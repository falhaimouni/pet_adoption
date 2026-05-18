export interface CreateSupplyDto {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lowStockLimit: number;
}

export interface UpdateSupplyDto {
  name?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  lowStockLimit?: number;
}
