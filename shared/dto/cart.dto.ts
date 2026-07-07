import { CartItemDto } from './cart-item.dto';

export interface CartDto {
  cartId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  cartItems: CartItemDto[];
}