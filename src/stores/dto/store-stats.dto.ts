import { ApiProperty } from '@nestjs/swagger';

export class CategoryStatsDto {
  @ApiProperty({ example: 'Bebidas' })
  category: string;

  @ApiProperty({ example: 15 })
  productCount: number;

  @ApiProperty({ example: 1250.50 })
  totalValue: number;
}

export class StoreStatsDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  storeId: string;

  @ApiProperty({ example: 'Supermercado Central Madeirense' })
  storeName: string;

  @ApiProperty({ example: 150 })
  totalProducts: number;

  @ApiProperty({ example: 25500.75 })
  totalInventoryValue: number;

  @ApiProperty({ type: [CategoryStatsDto] })
  productsByCategory: CategoryStatsDto[];

  @ApiProperty({ example: 12 })
  lowStockProducts: number;

  @ApiProperty({ example: 10 })
  lowStockThreshold: number;
}

export class StoreRevenueDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  storeId: string;

  @ApiProperty({ example: 'Supermercado Central Madeirense' })
  storeName: string;

  @ApiProperty({ example: 25500.75 })
  totalInventoryValue: number;

  @ApiProperty({ example: 150 })
  totalProducts: number;

  @ApiProperty({ example: 3500 })
  totalStock: number;

  @ApiProperty({ example: 170.00 })
  averageProductPrice: number;
}