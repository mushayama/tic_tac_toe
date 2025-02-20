export class SessionError extends Error {
  constructor(message = "Session or socket not found") {
    super(message);
    this.name = "SessionError";
  }
}

export class NakamaInstanceError extends Error {
  constructor(message = "Nakama instance not found") {
    super(message);
    this.name = "NakamaInstanceError";
  }
}

export class NakamaHandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NakamaHandlerError";
  }
}

export class NakamaResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NakamaResponseError";
  }
}
