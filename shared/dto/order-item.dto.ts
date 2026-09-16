export interface OrderItemDto {
  orderItemId: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  imageUrl?: string | null;
}