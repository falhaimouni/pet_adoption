export interface DashboardRoleCountDto {
  total: number;
  admin?: number;
  manager?: number;
  employee: number;
  vet: number;
  adopter: number;
  active?: number;
  inactive?: number;
}

export interface DashboardPetStatsDto {
  total: number;
  available: number;
  adopted: number;
  pendingAdoption: number;
  addedRecently?: number;
}

export interface DashboardAdoptionStatsDto {
  totalRequests: number;
  pending: number;
  approved: number;
  rejectedOrCanceled: number;
}

export interface DashboardMedicalStatsDto {
  totalMedicalRecords?: number;
  totalVaccinations: number;
  petsNeedingMedicalAttention?: number;
}

export interface DashboardSupplyStatsDto {
  totalSupplies?: number;
  availableSupplies?: number;
  lowStockSupplies: number;
  totalSuppliers: number;
}

export interface DashboardActivityLogDto {
  logId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: Date;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface AdminDashboardDto {
  users: DashboardRoleCountDto;
  pets: DashboardPetStatsDto;
  adoptions: DashboardAdoptionStatsDto;
  medical: DashboardMedicalStatsDto;
  supplies: DashboardSupplyStatsDto;
  activity: {
    recentActivityLogs: DashboardActivityLogDto[];
  };
}

export interface ManagerDashboardDto {
  users: DashboardRoleCountDto;
  pets: DashboardPetStatsDto;
  adoptions: DashboardAdoptionStatsDto;
  medical: DashboardMedicalStatsDto;
  supplies: DashboardSupplyStatsDto;
  activity: {
    recentActivityLogs: DashboardActivityLogDto[];
  };
}
