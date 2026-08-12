import { StoreSupplyDto } from "./storeSupply.dto";

export class StoreHomeDto
{
        totalProducts!: number;
        categories!: string[];
        featuredProducts!: StoreSupplyDto[];
}