import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RequestWithUser } from '@shared/types/auth.types';
import { AddCartItemDto, UpdateCartItemDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADOPTER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('me')
  getMyCart(@Req() req: RequestWithUser) {
    return this.cartService.getMyCart(req.user.userId);
  }

  @Post('items')
  addItem(@Req() req: RequestWithUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user.userId, dto);
  }

  @Patch('items/:productId')
  updateItemQuantity(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(
      req.user.userId,
      productId,
      dto.quantity,
    );
  }

  @Delete('items/:productId')
  removeItem(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(req.user.userId, productId);
  }

  @Delete('me')
  clearCart(@Req() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.userId);
  }
}
