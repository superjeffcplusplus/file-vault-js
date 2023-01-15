export interface ApiException {
  error: any,
  status: number
}

class Exception implements ApiException {
  constructor(readonly error: any, readonly status: number) {}
}

export class NotFoundException extends Exception {
  constructor(error: any) {
    super(error, 404)
  }
}

export class BadRequestException extends Exception {
  constructor(error: any) {
    super(error, 400);
  }
}

export class ServerError extends Exception {
  constructor(error: any) {
    super(error, 500);
  }
}