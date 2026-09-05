import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAdoptionRequestDto {
  @IsUUID()
  petId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateAdoptionRequestDto {

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
