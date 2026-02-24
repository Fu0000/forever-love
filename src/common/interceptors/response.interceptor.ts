import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';

type MetaPayload<T> = {
  data: T;
  __meta?: Record<string, unknown>;
};

const isMetaPayload = <T>(value: unknown): value is MetaPayload<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    '__meta' in value
  );
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined || value === null) {
          return undefined;
        }

        if (isMetaPayload(value)) {
          const payload = value;

          return {
            data: payload.data,
            meta: {
              requestId: request.requestId,
              ...(payload.__meta ?? {}),
            },
          };
        }

        return {
          data: value,
          meta: {
            requestId: request.requestId,
          },
        };
      }),
    );
  }
}
