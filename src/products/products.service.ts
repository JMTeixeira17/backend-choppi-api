import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const store = await this.storesRepository.findOne({
      where: { id: createProductDto.storeId, isActive: true },
    });

    if (!store) {
      throw new NotFoundException(
        `Supermercado con ID ${createProductDto.storeId} no encontrado o inactivo`,
      );
    }

    const existingProduct = await this.productsRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(`El SKU ${createProductDto.sku} ya está en uso`);
    }

    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAllByStore(
    storeId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.productsRepository.findAndCount({
      where: { storeId, isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['store'],
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.productsRepository.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['store'],
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { sku, isActive: true },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con SKU ${sku} no encontrado`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Si se actualiza el storeId, validar que la nueva tienda exista
    if (updateProductDto.storeId && updateProductDto.storeId !== product.storeId) {
      const store = await this.storesRepository.findOne({
        where: { id: updateProductDto.storeId, isActive: true },
      });

      if (!store) {
        throw new NotFoundException(
          `Supermercado con ID ${updateProductDto.storeId} no encontrado o inactivo`,
        );
      }
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productsRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException(`El SKU ${updateProductDto.sku} ya está en uso`);
      }
    }
    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productsRepository.save(product);
  }

  async hardDelete(id: string): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
  }

  async adjustStock(
    id: string,
    quantity: number,
    type: 'add' | 'subtract' | 'set',
  ): Promise<{ product: Product; previousStock: number; newStock: number }> {
    const product = await this.findOne(id);
    const previousStock = product.stock;

    switch (type) {
      case 'add':
        product.stock += quantity;
        break;
      case 'subtract':
        if (product.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente. Stock actual: ${product.stock}, intentando restar: ${quantity}`,
          );
        }
        product.stock -= quantity;
        break;
      case 'set':
        product.stock = quantity;
        break;
    }

    const updatedProduct = await this.productsRepository.save(product);

    return {
      product: updatedProduct,
      previousStock,
      newStock: updatedProduct.stock,
    };
  }

  async findLowStock(threshold: number = 10): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      relations: ['store'],
      order: { stock: 'ASC' },
    }).then(products => products.filter(p => p.stock <= threshold));
  }
}