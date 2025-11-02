import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StockAdjustmentType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
}

export class AdjustStockDto {
  @ApiProperty({
    example: 10,
    description: 'Cantidad a ajustar (debe ser positiva)',
    minimum: 0
  })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  quantity: number;

  @ApiProperty({
    enum: StockAdjustmentType,
    example: StockAdjustmentType.ADD,
    description: 'Tipo de ajuste: add (agregar), subtract (restar), set (establecer)'
  })
  @IsEnum(StockAdjustmentType)
  @IsNotEmpty()
  type: StockAdjustmentType;

  @ApiPropertyOptional({
    example: 'Recepción de mercancía',
    description: 'Razón del ajuste de stock'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class StockAdjustmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ description: 'Stock anterior' })
  previousStock: number;

  @ApiProperty({ description: 'Stock nuevo' })
  newStock: number;

  @ApiProperty()
  adjustmentType: StockAdjustmentType;

  @ApiProperty()
  adjustmentQuantity: number;

  @ApiProperty()
  reason?: string;
}