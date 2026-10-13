export class AppError extends Error {
  constructor(message, status = 500, publicMessage = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    if (publicMessage) {
      this.publicMessage = publicMessage;
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message, publicMessage = message) {
    super(message, 400, publicMessage);
  }
}

export class NotFoundError extends AppError {
  constructor(message, publicMessage = "Not found") {
    super(message, 404, publicMessage);
  }
}

export class ConflictError extends AppError {
  constructor(message, publicMessage = message) {
    super(message, 409, publicMessage);
  }
}
