import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    price: 25.50,
    sku: 'SKU-TEST-001',
    stock: 100,
    category: 'Test Category',
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    storeId: 'store-id-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByStore: jest.fn(),
    findOne: jest.fn(),
    findBySku: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    adjustStock: jest.fn(),
    findLowStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'New Product',
      description: 'New Description',
      price: 35.00,
      sku: 'SKU-NEW-001',
      stock: 50,
      category: 'New Category',
      storeId: 'store-id-123',
    };

    it('should create a new product', async () => {
      const newProduct = { ...mockProduct, ...createProductDto };
      mockProductsService.create.mockResolvedValue(newProduct);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(newProduct);
      expect(productsService.create).toHaveBeenCalledWith(createProductDto);
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockProductsService.create.mockRejectedValue(
        new ConflictException('El SKU ya está en uso'),
      );

      await expect(controller.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    const mockResponse = {
      data: [mockProduct],
      total: 1,
      page: 1,
      limit: 10,
    };

    it('should return all products when no storeId is provided', async () => {
      mockProductsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(undefined, 1, 10);

      expect(result).toEqual(mockResponse);
      expect(productsService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should return products filtered by store when storeId is provided', async () => {
      mockProductsService.findAllByStore.mockResolvedValue(mockResponse);

      const result = await controller.findAll('store-id-123', 1, 10);

      expect(result).toEqual(mockResponse);
      expect(productsService.findAllByStore).toHaveBeenCalledWith(
        'store-id-123',
        1,
        10,
      );
    });

    it('should use default pagination values', async () => {
      mockProductsService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll(undefined, undefined, undefined);

      expect(productsService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findByStore', () => {
    const mockResponse = {
      data: [mockProduct],
      total: 1,
      page: 1,
      limit: 10,
    };

    it('should return products by store id', async () => {
      mockProductsService.findAllByStore.mockResolvedValue(mockResponse);

      const result = await controller.findByStore('store-id-123', 1, 10);

      expect(result).toEqual(mockResponse);
      expect(productsService.findAllByStore).toHaveBeenCalledWith(
        'store-id-123',
        1,
        10,
      );
    });
  });

  describe('findBySku', () => {
    it('should return a product by SKU', async () => {
      mockProductsService.findBySku.mockResolvedValue(mockProduct);

      const result = await controller.findBySku(mockProduct.sku);

      expect(result).toEqual(mockProduct);
      expect(productsService.findBySku).toHaveBeenCalledWith(mockProduct.sku);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductsService.findBySku.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );

      await expect(controller.findBySku('invalid-sku')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne(mockProduct.id);

      expect(result).toEqual(mockProduct);
      expect(productsService.findOne).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 45.00,
    };

    it('should update a product', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductDto };
      mockProductsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(mockProduct.id, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(productsService.update).toHaveBeenCalledWith(
        mockProduct.id,
        updateProductDto,
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductsService.update.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );

      await expect(
        controller.update('invalid-id', updateProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new SKU already exists', async () => {
      mockProductsService.update.mockRejectedValue(
        new ConflictException('El SKU ya está en uso'),
      );

      await expect(
        controller.update(mockProduct.id, { ...updateProductDto, sku: 'EXISTING-SKU' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      mockProductsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockProduct.id);

      expect(productsService.remove).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductsService.remove.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustStock', () => {
    const adjustStockDto = {
      quantity: 50,
      type: 'add' as any,
      reason: 'Recepción de mercancía',
    };

    it('should adjust stock successfully', async () => {
      const mockResult = {
        product: { ...mockProduct, stock: 150 },
        previousStock: 100,
        newStock: 150,
      };

      mockProductsService.adjustStock.mockResolvedValue(mockResult);

      const result = await controller.adjustStock(mockProduct.id, adjustStockDto);

      expect(result).toHaveProperty('previousStock', 100);
      expect(result).toHaveProperty('newStock', 150);
      expect(result).toHaveProperty('adjustmentType', 'add');
      expect(result).toHaveProperty('reason', 'Recepción de mercancía');
      expect(productsService.adjustStock).toHaveBeenCalledWith(
        mockProduct.id,
        adjustStockDto.quantity,
        adjustStockDto.type,
      );
    });

    it('should handle errors', async () => {
      mockProductsService.adjustStock.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );

      await expect(
        controller.adjustStock('invalid-id', adjustStockDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLowStock', () => {
    it('should return products with low stock', async () => {
      const lowStockProducts = [
        { ...mockProduct, stock: 5 },
        { ...mockProduct, id: 'product-2', stock: 8 },
      ];

      mockProductsService.findLowStock.mockResolvedValue(lowStockProducts);

      const result = await controller.getLowStock(10);

      expect(result).toEqual(lowStockProducts);
      expect(productsService.findLowStock).toHaveBeenCalledWith(10);
    });

    it('should use default threshold', async () => {
      mockProductsService.findLowStock.mockResolvedValue([]);

      await controller.getLowStock(undefined);

      expect(productsService.findLowStock).toHaveBeenCalledWith(10);
    });
  });
});