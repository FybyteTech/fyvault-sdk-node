export class FyVaultError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code: string = "FYVAULT_ERROR") {
    super(message);
    this.name = "FyVaultError";
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, FyVaultError.prototype);
  }
}
