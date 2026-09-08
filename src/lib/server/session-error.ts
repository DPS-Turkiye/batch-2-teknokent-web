export class SessionRequiredError extends Error {
  constructor(message = "Etkin oturum bulunamadı.") {
    super(message);
    this.name = "SessionRequiredError";
  }
}
