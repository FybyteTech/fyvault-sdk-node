import type { HttpClient } from "../http.js";

interface ScanFinding {
  pattern_name: string;
  matched_text: string;
  line_number: number;
  confidence: "high" | "medium" | "low";
}

export class ScannerResource {
  constructor(private http: HttpClient, private orgId: string) {}

  async scanText(text: string, sourceRef?: string): Promise<ScanFinding[]> {
    const result = await this.http.post<{ findings: ScanFinding[]; total_findings: number }>(
      `/orgs/${this.orgId}/scan/text`,
      { text, sourceRef }
    );
    return result.findings;
  }
}
