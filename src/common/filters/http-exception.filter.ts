import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let detail: string | undefined;

    if (exception instanceof HttpException) {
      const excResponse = exception.getResponse();
      message =
        typeof excResponse === 'string'
          ? excResponse
          : ((excResponse as any).message ?? exception.message);
    } else if (exception instanceof Error) {
      message = exception.message;
      detail = exception.stack;
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(status >= 500 && { error: 'Internal Server Error', detail }),
    });
  }
}
