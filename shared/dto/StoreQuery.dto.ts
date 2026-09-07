import { IsIn, IsInt, IsNumber,IsOptional,IsString,Max,Min } from "class-validator";
import { Type } from "class-transformer";
export class StoreQueryDto
{
        @IsOptional()
        @Type(()=> Number)
        @IsInt()
        @Min(1)
        page?: number;

        @IsOptional()
        @Type(()=> Number)
        @IsInt()
        @Min(1)
        @Max(100)
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
