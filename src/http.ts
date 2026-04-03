import type { ApiResponse } from "./types.js";

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

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    });
    const data = (await res.json()) as ApiResponse<T>;
    if (!data.success) throw new Error(data.error || `API error (${res.status})`);
    return data.data;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as ApiResponse<T>;
    if (!data.success) throw new Error(data.error || `API error (${res.status})`);
    return data.data;
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as ApiResponse<T>;
    if (!data.success) throw new Error(data.error || `API error (${res.status})`);
    return data.data;
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    const data = (await res.json()) as ApiResponse<void>;
    if (!data.success) throw new Error(data.error || `API error (${res.status})`);
  }
}
