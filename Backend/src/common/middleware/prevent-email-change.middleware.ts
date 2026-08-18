import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PreventEmailChangeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      throw new ForbiddenException('Email cannot be changed');
    }

    next();
  }
}
