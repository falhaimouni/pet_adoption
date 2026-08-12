import { IsIn, IsNumber,IsOptional,IsString,Min } from "class-validator";
import { Type } from "class-transformer";
export class StoreQueryDto
{
        @IsOptional()
        @IsNumber()
        @Min(1)
        page?: number;

        @IsOptional()
        @IsNumber()
        @Min(1)
        limit?: number;

        @IsOptional()
        // @IsString()
        @IsIn(['supplyName', 'category', 'sellingPrice'])
        sortBy?: string;

        @IsOptional()
        @IsIn(['ASC', 'DESC'])
        order?: 'ASC' | 'DESC';

        @IsOptional()
        @IsString()
        search?: string;

        @IsOptional()
        @IsString()
        category?: string;

        @IsOptional()
        @Type(()=> Number)
        @IsNumber()
        minPrice?: number;

        @IsOptional()
        @Type(()=> Number)
        @IsNumber()
        maxPrice?: number;
}