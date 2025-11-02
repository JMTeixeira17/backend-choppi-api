import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto, userId: string): Promise<Store> {
    const store = this.storesRepository.create({
      ...createStoreDto,
      createdById: userId,
    });

    return this.storesRepository.save(store);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: Store[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.storesRepository.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['createdBy'],
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id, isActive: true },
      relations: ['createdBy', 'products'],
    });

    if (!store) {
      throw new NotFoundException(`Supermercado con ID ${id} no encontrado`);
    }

    return store;
  }

  async update(
    id: string,
    updateStoreDto: UpdateStoreDto,
    userId: string,
  ): Promise<Store> {
    const store = await this.findOne(id);
    Object.assign(store, updateStoreDto);
    return this.storesRepository.save(store);
  }

  async remove(id: string, userId: string): Promise<void> {
    const store = await this.findOne(id);
    store.isActive = false;
    await this.storesRepository.save(store);
  }

  async hardDelete(id: string): Promise<void> {
    const result = await this.storesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Supermercado con ID ${id} no encontrado`);
    }
  }

    async getStats(id: string, lowStockThreshold: number = 10) {
    const store = await this.storesRepository.findOne({
      where: { id, isActive: true },
      relations: ['products'],
    });

    if (!store) {
      throw new NotFoundException(`Supermercado con ID ${id} no encontrado`);
    }
    const activeProducts = store.products.filter(p => p.isActive);
    const totalProducts = activeProducts.length;
    const totalInventoryValue = activeProducts.reduce(
      (sum, product) => sum + Number(product.price) * product.stock,
      0,
    );

    const categoriesMap = new Map<string, { count: number; value: number }>();
    activeProducts.forEach(product => {
      const category = product.category || 'Sin categoría';
      const existing = categoriesMap.get(category) || { count: 0, value: 0 };
      categoriesMap.set(category, {
        count: existing.count + 1,
        value: existing.value + (Number(product.price) * product.stock),
      });
    });

    const productsByCategory = Array.from(categoriesMap.entries()).map(
      ([category, data]) => ({
        category,
        productCount: data.count,
        totalValue: Math.round(data.value * 100) / 100,
      }),
    );

    const lowStockProducts = activeProducts.filter(
      p => p.stock <= lowStockThreshold,
    ).length;

    return {
      storeId: store.id,
      storeName: store.name,
      totalProducts,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      productsByCategory,
      lowStockProducts,
      lowStockThreshold,
    };
  }

  async getRevenue(id: string) {
    const store = await this.storesRepository.findOne({
      where: { id, isActive: true },
      relations: ['products'],
    });

    if (!store) {
      throw new NotFoundException(`Supermercado con ID ${id} no encontrado`);
    }

    const activeProducts = store.products.filter(p => p.isActive);

    const totalProducts = activeProducts.length;
    const totalStock = activeProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalInventoryValue = activeProducts.reduce(
      (sum, p) => sum + Number(p.price) * p.stock,
      0,
    );
    const averageProductPrice = totalProducts > 0
      ? activeProducts.reduce((sum, p) => sum + Number(p.price), 0) / totalProducts
      : 0;

    return {
      storeId: store.id,
      storeName: store.name,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      totalProducts,
      totalStock,
      averageProductPrice: Math.round(averageProductPrice * 100) / 100,
    };
  }

}