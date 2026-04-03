import http from "node:http";
import type { FyVault } from "./client.js";

/**
 * Local HTTP proxy that resolves FyVault rotating handles to real credentials.
 *
 * Usage:
 *   const proxy = new SecretProxy(fvClient);
 *   const { port, stop } = await proxy.start();
 *   // Your app routes through localhost:{port}
 *   // Proxy resolves fvh_xxx handles in Authorization headers to real credentials
 *   stop(); // when done
 *
 * The proxy intercepts outbound HTTP requests and replaces any
 * `fvh_` handle tokens in Authorization headers with the real
 * secret value by calling the FyVault API.
 *
 * Resolved values are cached locally for the handle's TTL.
 */
export class SecretProxy {
  private client: FyVault;
  private cache = new Map<string, { value: string; expiresAt: number }>();
  private server: http.Server | null = null;

  constructor(client: FyVault) {
    this.client = client;
  }

  /**
   * Start the local proxy server.
   * @param port - Port to listen on (0 = random available port)
   * @returns The actual port and a stop function
   */
  async start(port: number = 0): Promise<{ port: number; stop: () => void }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (err) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Proxy error",
              message: err instanceof Error ? err.message : "Unknown error",
            })
          );
        }
      });

      this.server.on("error", reject);

      this.server.listen(port, "127.0.0.1", () => {
        const addr = this.server!.address();
        const actualPort = typeof addr === "object" && addr ? addr.port : port;

        resolve({
          port: actualPort,
          stop: () => {
            this.server?.close();
            this.server = null;
            this.cache.clear();
          },
        });
      });
    });
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    // Check for FyVault handle in the Authorization header
    const authHeader = req.headers.authorization || "";
    const resolvedAuth = await this.maybeResolveHandle(authHeader);

    // Forward the request to the original target
    // The proxy expects the request URL to be the full target URL
    const targetUrl = new URL(req.url || "/", `http://${req.headers.host}`);

    // Check for X-FyVault-Target header for explicit target
    const target = req.headers["x-fyvault-target"] as string | undefined;
    if (target) {
      const targetParsed = new URL(target);
      targetUrl.hostname = targetParsed.hostname;
      targetUrl.port = targetParsed.port;
      targetUrl.protocol = targetParsed.protocol;
    }

    const proxyReq = http.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
          authorization: resolvedAuth || undefined,
          "x-fyvault-target": undefined, // Don't forward internal header
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upstream error", message: err.message }));
    });

    req.pipe(proxyReq, { end: true });
  }

  /**
   * If the value contains a fvh_ handle, resolve it to the real credential.
   * Results are cached until the handle expires.
   */
  private async maybeResolveHandle(headerValue: string): Promise<string> {
    // Look for fvh_ tokens in the header value
    const handleMatch = headerValue.match(/fvh_[A-Za-z0-9_-]+/);
    if (!handleMatch) return headerValue;

    const handle = handleMatch[0];

    // Check cache
    const cached = this.cache.get(handle);
    if (cached && cached.expiresAt > Date.now()) {
      return headerValue.replace(handle, cached.value);
    }

    // Resolve via FyVault API
    const realValue = await this.client.secrets.resolveHandle(handle);

    // Cache for 80% of TTL (default 5 min → cache for 4 min)
    this.cache.set(handle, {
      value: realValue,
      expiresAt: Date.now() + 4 * 60 * 1000,
    });

    return headerValue.replace(handle, realValue);
  }
}
