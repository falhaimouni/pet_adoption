import { SupplyStatusEnum } from "../enums";
export interface Supply {
  supplyId: string;
  supplyName: string;
  category: string;
  quantity: number;
  sellingPrice: string;
  purchasePrice: string;
  lowStockLimit: number;
  lastUpdated: Date;
  supplierId: string;
  isActive: boolean;
  storeListed: boolean;
  status: SupplyStatusEnum;
  imageUrl?: string | null;
}
