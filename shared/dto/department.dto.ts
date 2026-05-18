export interface CreateDepartmentDto {
  name: string;
  location: string;
  managerId?: string;
  description?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  location?: string;
  managerId?: string;
  description?: string;
}
