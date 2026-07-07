import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '@shared/types/auth.types';
import { AddCartItemDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyCart(@Req() req: RequestWithUser) {
    return this.cartService.getMyCart(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  addItem(@Req() req: RequestWithUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:productId')
  removeItem(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(req.user.userId, productId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  clearCart(@Req() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.userId);
  }
}
