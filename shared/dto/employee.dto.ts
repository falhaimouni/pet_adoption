export interface CreateEmployeeDto {
  userId: string;
  departmentId: string;
  salary?: number;
  hireDate: string;
  address?: string;
}

export interface UpdateEmployeeDto {
  departmentId?: string;
  salary?: number;
  address?: string;
}
