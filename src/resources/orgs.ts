import type { HttpClient } from "../http.js";
import type { Organization } from "../types.js";

export class OrgsResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async get(): Promise<Organization> {
    return this.http.get(`/orgs/${this.orgId}`);
  }
}
