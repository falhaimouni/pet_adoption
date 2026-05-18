export interface CreateSupplierDto {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

export interface UpdateSupplierDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
}
