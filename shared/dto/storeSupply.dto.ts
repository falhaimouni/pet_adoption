import { SupplyStatusEnum } from '../enums';

export class StoreSupplyDto{
  
  supplyId!: string;

  productId!: string;

  supplyName!: string;

  category!: string;

  sellingPrice!: string;

  quantity!: number;

  status!: SupplyStatusEnum;

  inStock!: boolean;

  storeListed!: boolean;

  imageUrl?: string | null;
}
// this dto for one item in the product list
