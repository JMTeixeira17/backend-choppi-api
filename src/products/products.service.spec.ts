import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    price: 25.5,
    sku: 'SKU-TEST-001',
    stock: 100,
    category: 'Test Category',
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    storeId: 'store-id-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'New Product',
      description: 'New Description',
      price: 35.0,
      sku: 'SKU-NEW-001',
      stock: 50,
      category: 'New Category',
      storeId: 'store-id-123',
    };

    it('should create a product successfully', async () => {
      const newProduct = { ...mockProduct, ...createProductDto };

      mockRepository.findOne.mockResolvedValue(null); // SKU doesn't exist
      mockRepository.create.mockReturnValue(newProduct);
      mockRepository.save.mockResolvedValue(newProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(newProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sku: createProductDto.sku },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(mockRepository.save).toHaveBeenCalledWith(newProduct);
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllByStore', () => {
    it('should return paginated products for a store', async () => {
      const products = [mockProduct];
      const total = 1;

      mockRepository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAllByStore('store-id-123', 1, 10);

      expect(result).toEqual({
        data: products,
        total,
        page: 1,
        limit: 10,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { storeId: 'store-id-123', isActive: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
        relations: ['store'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id, isActive: true },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySku', () => {
    it('should return a product by SKU', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySku(mockProduct.sku);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sku: mockProduct.sku, isActive: true },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySku('invalid-sku')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 45.0,
    };

    it('should update a product successfully', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductDto };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new SKU already exists', async () => {
      const updateWithSku: UpdateProductDto = {
        ...updateProductDto,
        sku: 'SKU-EXISTING',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockProduct) // First call for findOne
        .mockResolvedValueOnce({ ...mockProduct, id: 'different-id' }); // Second call for SKU check

      await expect(
        service.update(mockProduct.id, updateWithSku),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const productToDelete = { ...mockProduct };

      mockRepository.findOne.mockResolvedValue(productToDelete);
      mockRepository.save.mockResolvedValue({
        ...productToDelete,
        isActive: false,
      });

      await service.remove(mockProduct.id);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...productToDelete,
        isActive: false,
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustStock', () => {
    beforeEach(() => {
        mockRepository.findOne.mockReset();
    });
    it('should add stock successfully', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };
      mockRepository.findOne.mockResolvedValueOnce(productWithStock);
      mockRepository.save.mockResolvedValue({
        ...productWithStock,
        stock: 150,
      });

      const adjustment = await service.adjustStock(mockProduct.id, 50, 'add');

      expect(adjustment.previousStock).toBe(100);
      expect(adjustment.newStock).toBe(150);
      expect(adjustment.product.stock).toBe(150);
    });

    it('should subtract stock successfully', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };

      mockRepository.findOne.mockResolvedValueOnce(productWithStock);
      mockRepository.save.mockResolvedValue({ ...productWithStock, stock: 70 });

      const adjustment = await service.adjustStock(
        mockProduct.id,
        30,
        'subtract',
      );

      expect(adjustment.previousStock).toBe(100);
      expect(adjustment.newStock).toBe(70);
    });

    it('should throw BadRequestException when subtracting more than available', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };

      mockRepository.findOne.mockResolvedValueOnce(productWithStock);

      await expect(
        service.adjustStock(mockProduct.id, 200, 'subtract'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set stock to specific value', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };

      mockRepository.findOne.mockResolvedValueOnce(productWithStock);
      mockRepository.save.mockResolvedValue({ ...productWithStock, stock: 75 });

      const adjustment = await service.adjustStock(mockProduct.id, 75, 'set');

      expect(adjustment.previousStock).toBe(100);
      expect(adjustment.newStock).toBe(75);
    });
  });

  describe('findLowStock', () => {
    it('should return products with stock below threshold', async () => {
      const allProducts = [
        { ...mockProduct, stock: 5 },
        { ...mockProduct, id: 'product-2', stock: 8 },
        { ...mockProduct, id: 'product-3', stock: 50 },
      ];

      mockRepository.find.mockResolvedValue(allProducts);

      const result = await service.findLowStock(10);

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.stock <= 10)).toBe(true);
    });

    it('should use default threshold of 10', async () => {
      mockRepository.find.mockResolvedValue([{ ...mockProduct, stock: 5 }]);

      const result = await service.findLowStock();

      expect(result).toHaveLength(1);
    });
  });
});
