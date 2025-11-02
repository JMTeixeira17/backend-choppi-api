import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductListResponseDto,
} from './dto/product.dto';
import { AdjustStockDto, StockAdjustmentResponseDto } from './dto/adjust-stock.dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 409, description: 'El SKU ya está en uso' })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos (opcionalmente filtrados por tienda)' })
  @ApiQuery({ name: 'storeId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    type: ProductListResponseDto,
  })
  async findAll(
    @Query('storeId') storeId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (storeId) {
      return this.productsService.findAllByStore(storeId, +page, +limit);
    }
    return this.productsService.findAll(+page, +limit);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Obtener todos los productos de un supermercado específico' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    type: ProductListResponseDto,
  })
  async findByStore(
    @Param('storeId') storeId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productsService.findAllByStore(storeId, +page, +limit);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Obtener un producto por SKU' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 409, description: 'El SKU ya está en uso' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto (soft delete)' })
  @ApiResponse({ status: 204, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: 'Ajustar stock de un producto' })
  @ApiResponse({
    status: 200,
    description: 'Stock ajustado exitosamente',
    type: StockAdjustmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o datos inválidos' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async adjustStock(
    @Param('id') id: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    const result = await this.productsService.adjustStock(
      id,
      adjustStockDto.quantity,
      adjustStockDto.type,
    );

    return {
      id: result.product.id,
      name: result.product.name,
      sku: result.product.sku,
      previousStock: result.previousStock,
      newStock: result.newStock,
      adjustmentType: adjustStockDto.type,
      adjustmentQuantity: adjustStockDto.quantity,
      reason: adjustStockDto.reason,
    };
  }

  @Get('low-stock/list')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    example: 10,
    description: 'Umbral de stock bajo (default: 10)'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos con stock bajo',
    type: [ProductResponseDto],
  })
  async getLowStock(@Query('threshold') threshold: number = 10) {
    return this.productsService.findLowStock(+threshold);
  }
}