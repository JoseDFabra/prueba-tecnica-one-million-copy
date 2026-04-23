import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { LeadSource } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsEnum(LeadSource)
  fuente: LeadSource;

  @IsOptional()
  @IsString()
  producto_interes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  presupuesto?: number;
}
