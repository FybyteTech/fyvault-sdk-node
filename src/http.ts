import type { ApiResponse } from "./types.js";
import { FyVaultError } from "./errors.js";

export class HttpClient {
  constructor(
    private apiKey: string,
    private baseUrl: string
  ) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, { ...init, headers: this.headers() });
    } catch (err) {
      throw new FyVaultError(
        `Network error: ${err instanceof Error ? err.message : String(err)}`,
        0,
        "NETWORK_ERROR"
      );
    }

    let data: ApiResponse<T>;
    try {
      data = (await res.json()) as ApiResponse<T>;
    } catch {
      throw new FyVaultError(
        `Unexpected response (${res.status}): unable to parse JSON`,
        res.status,
        "PARSE_ERROR"
      );
    }

    if (!data.success) {
      const code =
        res.status === 401
          ? "UNAUTHORIZED"
          : res.status === 403
            ? "FORBIDDEN"
            : res.status === 404
              ? "NOT_FOUND"
              : "API_ERROR";
      throw new FyVaultError(data.error || `API error (${res.status})`, res.status, code);
    }

    return data.data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete(path: string): Promise<void> {
    await this.request<void>(`${this.baseUrl}${path}`, { method: "DELETE" });
  }
}
