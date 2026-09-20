export class StoreSupplyDetailsDto
{
  supplyId!: string;
  productId!: string;
  supplyName!: string;
  category!: string;
  sellingPrice!: string;
  quantity!: number;
  // description!: string;
  inStock!: boolean;
  storeListed!: boolean;

  imageUrl?: string | null;
}
// this is a one product's detailed page
