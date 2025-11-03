import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStoreDto {
  @ApiProperty({ example: 'Supermercado Central Madeirense' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Av. Soublette. Maiquetía' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: '+584141124458' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'La Guaira' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'LG' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 10.587508 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: -66.9213628 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StoreListResponseDto {
  @ApiProperty({ type: [StoreResponseDto] })
  data: StoreResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}