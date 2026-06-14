export declare class CreateSupplyDto {
    name: string;
    category: string;
    quantity: number;
    unitPrice: number;
    lowStockLimit: number;
}
export declare class UpdateSupplyDto {
    name?: string;
    category?: string;
    quantity?: number;
    unitPrice?: number;
    lowStockLimit?: number;
}
