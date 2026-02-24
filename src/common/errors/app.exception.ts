import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}
