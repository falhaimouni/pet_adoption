export interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface PaginationQuery {
    limit?: number;
    offset?: number;
    page?: number;
    sortBy?: string;
    order?: "ASC" | "DESC";
}
