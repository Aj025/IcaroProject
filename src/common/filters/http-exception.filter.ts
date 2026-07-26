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

    if (exception instanceof HttpException) {
      const excResponse = exception.getResponse();
      message =
        typeof excResponse === 'string'
          ? excResponse
          : (((excResponse as Record<string, unknown>).message as string) ??
            exception.message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: status >= 500 ? 'Internal Server Error' : undefined,
    });
  }
}
