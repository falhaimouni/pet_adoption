export interface CreateAdopterDto {
  userId: string;
  address: string;
  city: string;
  phone?: string;
}

export interface UpdateAdopterDto {
  address?: string;
  city?: string;
  phone?: string;
}
