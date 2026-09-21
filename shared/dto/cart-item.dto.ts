import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export interface CartItemDto {
  cartItemId: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  imageUrl?: string | null;
}

export class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class RemoveCartItemDto {
  @IsUUID()
  cartItemId!: string;
}