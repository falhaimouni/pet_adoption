import { Supply } from "../types";

export class PaginatedSuppliesDto{
        data!: Supply[];
        total!: number;
        page!: number;
        limit!: number;
}