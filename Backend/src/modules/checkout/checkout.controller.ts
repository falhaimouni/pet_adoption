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

  //to cancel the order created in the DB
  @UseGuards(JwtAuthGuard)
  @Post(':orderId/cancel')
  cancelOrder(
    @Req() req: RequestWithUser,
    @Param('orderId') orderId: string,
  ) {
    return this.checkoutService.cancelOrder(
      req.user.userId,
      orderId,
    );
  }
}