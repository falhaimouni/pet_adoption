import {StoreSupplyDto} from "./storeSupply.dto";

export class StorePagniatedSuppliesDto
{
        data!: StoreSupplyDto[];
        total!: number;
        page!: number;
        limit!: number;
}
// this is the whole paginated response for the product list, it contains an array of StoreSupplyDto and some pagination info