import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '@shared/types/auth.types';

import { CreateOrderDto } from '@shared/dto/order.dto';

import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  checkout(
    @Req() req: RequestWithUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.checkoutService.checkout(
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':orderId/cancel')
  cancel(
    @Req() req: RequestWithUser,
    @Param('orderId') orderId: string,
  ) {
    return this.checkoutService.cancel(req.user.userId, orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':orderId/pay')
  pay(
    @Req() req: RequestWithUser,
    @Param('orderId') orderId: string,
  ) {
    return this.checkoutService.pay(req.user.userId, orderId);
  }
}