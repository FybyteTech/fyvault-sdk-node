export interface Secret {
  secret_id: string;
  name: string;
  description: string | null;
  secret_type: string;
  injection_config: Record<string, unknown>;
  encryption_mode: "server" | "client";
  current_version: number;
  last_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretVersion {
  version_id: string;
  version: number;
  created_by: number;
  created_at: string;
}

export interface CreateSecretInput {
  name: string;
  description?: string;
  secretType: string;
  value?: string;
  clientEncryptedValue?: string;
  injectionConfig?: Record<string, unknown>;
}

export interface Device {
  device_id: string;
  name: string;
  fingerprint: string;
  status: string;
  agent_version: string | null;
  last_boot_at: string | null;
  last_heartbeat_at: string | null;
  created_at: string;
}

export interface RegisterDeviceInput {
  name: string;
  fingerprint: string;
}

export interface Organization {
  org_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface SecretValue {
  name: string;
  value: string;
}

export type ApiScope =
  | "SECRETS_READ"
  | "SECRETS_WRITE"
  | "DEVICES_READ"
  | "DEVICES_WRITE"
  | "AUDIT_READ"
  | "BOOT";

export interface MintSessionTokenResult {
  token: string;
  session_token_id: string;
  expires_at: string;
  scopes: ApiScope[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
