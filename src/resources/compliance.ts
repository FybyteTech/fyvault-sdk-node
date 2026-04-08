import type { HttpClient } from "../http.js";

export interface ComplianceReport {
  reportType: string;
  generatedAt: string;
  periodDays: number;
  periodStart: string;
  periodEnd: string;
  sections: Record<string, unknown>;
}

export class ComplianceResource {
  constructor(
    private http: HttpClient,
    private orgId: string
  ) {}

  async generateReport(
    type: "soc2" | "hipaa" | "iso27001",
    periodDays: number = 90
  ): Promise<ComplianceReport> {
    return this.http.get(
      `/orgs/${this.orgId}/compliance/report?type=${type}&period=${periodDays}`
    );
  }
}
