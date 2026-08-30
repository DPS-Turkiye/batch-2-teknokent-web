export class SessionRequiredError extends Error {
  constructor(message = "No active session.") {
    super(message);
    this.name = "SessionRequiredError";
  }
}
