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
  Request,
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
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreResponseDto,
  StoreListResponseDto,
} from './dto/store.dto';
import { StoreRevenueDto, StoreStatsDto } from './dto/store-stats.dto';

@ApiTags('Stores')
@Controller('stores')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo supermercado' })
  @ApiResponse({
    status: 201,
    description: 'Supermercado creado exitosamente',
    type: StoreResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@Body() createStoreDto: CreateStoreDto, @Request() req) {
    return this.storesService.create(createStoreDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los supermercados' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de supermercados obtenida exitosamente',
    type: StoreListResponseDto,
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.storesService.findAll(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un supermercado por ID' })
  @ApiResponse({
    status: 200,
    description: 'Supermercado encontrado',
    type: StoreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Supermercado no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un supermercado' })
  @ApiResponse({
    status: 200,
    description: 'Supermercado actualizado exitosamente',
    type: StoreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Supermercado no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @Request() req,
  ) {
    return this.storesService.update(id, updateStoreDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un supermercado (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Supermercado eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Supermercado no encontrado' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.storesService.remove(id, req.user.userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de un supermercado' })
  @ApiQuery({
    name: 'lowStockThreshold',
    required: false,
    type: Number,
    example: 10,
    description: 'Umbral para considerar stock bajo (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    type: StoreStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Supermercado no encontrado' })
  async getStats(
    @Param('id') id: string,
    @Query('lowStockThreshold') lowStockThreshold: number = 10,
  ) {
    return this.storesService.getStats(id, +lowStockThreshold);
  }

  @Get(':id/revenue')
  @ApiOperation({
    summary: 'Obtener valor total del inventario de un supermercado',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue calculado exitosamente',
    type: StoreRevenueDto,
  })
  @ApiResponse({ status: 404, description: 'Supermercado no encontrado' })
  async getRevenue(@Param('id') id: string) {
    return this.storesService.getRevenue(id);
  }
}
