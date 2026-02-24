import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerRequestId = req.header('x-request-id');
    req.requestId = headerRequestId ?? randomUUID();
    res.setHeader('x-request-id', req.requestId);
    next();
  }
}
