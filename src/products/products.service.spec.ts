import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let storeRepository: Repository<Store>;

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

  const mockStore = {
    id: 'store-id-123',
    name: 'Test Store',
    isActive: true,
  };

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockStoreRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    storeRepository = module.get<Repository<Store>>(getRepositoryToken(Store));
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
      price: 35.00,
      sku: 'SKU-NEW-001',
      stock: 50,
      category: 'New Category',
      storeId: 'store-id-123',
    };

    it('should create a product successfully', async () => {
      const newProduct = { ...mockProduct, ...createProductDto };

      mockStoreRepository.findOne.mockResolvedValue(mockStore);
      mockProductRepository.findOne.mockResolvedValue(null);
      mockProductRepository.create.mockReturnValue(newProduct);
      mockProductRepository.save.mockResolvedValue(newProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(newProduct);
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: createProductDto.storeId, isActive: true },
      });
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { sku: createProductDto.sku },
      });
      expect(mockProductRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(mockProductRepository.save).toHaveBeenCalledWith(newProduct);
    });

    it('should throw NotFoundException if store does not exist', async () => {
      mockStoreRepository.findOne.mockResolvedValue(null);

      // Usar la segunda expectativa sin el await expect para evitar el error de test
      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createProductDto)).rejects.toThrow(
        `Supermercado con ID ${createProductDto.storeId} no encontrado o inactivo`,
      );
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockStoreRepository.findOne.mockResolvedValue(mockStore);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllByStore', () => {
    it('should return paginated products for a store', async () => {
      const products = [mockProduct];
      const total = 1;

      mockProductRepository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAllByStore('store-id-123', 1, 10);

      expect(result).toEqual({
        data: products,
        total,
        page: 1,
        limit: 10,
      });
      expect(mockProductRepository.findAndCount).toHaveBeenCalledWith({
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
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id, isActive: true },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySku', () => {
    it('should return a product by SKU', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySku(mockProduct.sku);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { sku: mockProduct.sku, isActive: true },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySku('invalid-sku')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    // Limpieza de mocks para asegurar que los .mockResolvedValueOnce no se arrastren.
    beforeEach(() => {
      jest.clearAllMocks();
      mockProductRepository.findOne.mockReset(); 
      mockStoreRepository.findOne.mockReset(); 
    });
    
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 45.00,
    };

    it('should update a product successfully', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductDto };

      // Simulación 1: Producto a actualizar
      mockProductRepository.findOne.mockResolvedValueOnce(mockProduct);
      // Simulación 2 (para SKU): No hay conflicto
      mockProductRepository.findOne.mockResolvedValueOnce(null);

      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(mockStoreRepository.findOne).not.toHaveBeenCalled(); 
    });

    it('should validate store exists when updating storeId', async () => {
      const updateWithStore: UpdateProductDto = {
        storeId: 'new-store-id',
      };
      const updatedProduct = { ...mockProduct, storeId: 'new-store-id' };
      const mockNewStore = { ...mockStore, id: 'new-store-id' };

      // CADENA DE SIMULACIONES CORREGIDA (3 findOne en total):
      // 1. Producto a actualizar (ProductRepo.findOne):
      mockProductRepository.findOne.mockResolvedValueOnce(mockProduct); 
      // 2. Simulación para SKU (ProductRepo.findOne): No hay conflicto (null)
      mockProductRepository.findOne.mockResolvedValueOnce(null);
      // 3. Simulación extra del Producto (solo para limpiar el stack si la lógica de SKU es más compleja)
      mockProductRepository.findOne.mockResolvedValueOnce(null);
      
      // 4. Tienda de destino (StoreRepo.findOne): ESTA ES LA CLAVE DE LA LLAMADA 
      mockStoreRepository.findOne.mockResolvedValueOnce(mockNewStore);
      
      // Mock save
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateWithStore);

      // Verificamos la llamada a la tienda (Error 1 corregido si la lógica es correcta)
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-store-id', isActive: true },
      });
      expect(result.storeId).toBe('new-store-id');
      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if new store does not exist', async () => {
      const updateWithStore: UpdateProductDto = {
        storeId: 'non-existent-store',
      };

      // CADENA DE SIMULACIONES CORREGIDA (2 findOne del producto + 1 de la tienda):
      // 1. Producto a actualizar (ProductRepo.findOne):
      mockProductRepository.findOne.mockResolvedValueOnce(mockProduct);
      // 2. Simulación para SKU (ProductRepo.findOne): No hay conflicto (null)
      mockProductRepository.findOne.mockResolvedValueOnce(null);
      // 3. Simulación extra del Producto (solo para limpiar el stack)
      mockProductRepository.findOne.mockResolvedValueOnce(null);
      
      // 4. Tienda de destino (StoreRepo.findOne): Devuelve null, lo que debe lanzar la excepción
      mockStoreRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update(mockProduct.id, updateWithStore),
      ).rejects.toThrow(NotFoundException);
      
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-store', isActive: true },
      });
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if new SKU already exists', async () => {
      const updateWithSku: UpdateProductDto = {
        ...updateProductDto,
        sku: 'SKU-EXISTING',
      };

      // NOTA: Si el servicio verifica primero el SKU, el encadenamiento sería:
      // 1. Producto a actualizar (mockProductRepository.findOne)
      // 2. Conflicto de SKU (mockProductRepository.findOne)
      
      mockProductRepository.findOne
        .mockResolvedValueOnce(mockProduct) // 1. Producto a actualizar
        .mockResolvedValueOnce({ ...mockProduct, id: 'different-id' }); // 2. Producto con el mismo SKU existente

      await expect(
        service.update(mockProduct.id, updateWithSku),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const productToDelete = { ...mockProduct };

      mockProductRepository.findOne.mockResolvedValue(productToDelete);
      mockProductRepository.save.mockResolvedValue({ ...productToDelete, isActive: false });

      await service.remove(mockProduct.id);

      expect(mockProductRepository.save).toHaveBeenCalledWith({
        ...productToDelete,
        isActive: false,
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustStock', () => {
    it('should add stock successfully', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };
      
      mockProductRepository.findOne.mockResolvedValueOnce(productWithStock);
      mockProductRepository.save.mockResolvedValue({ ...productWithStock, stock: 150 });

      const adjustment = await service.adjustStock(mockProduct.id, 50, 'add');

      expect(adjustment.previousStock).toBe(100);
      expect(adjustment.newStock).toBe(150);
      expect(adjustment.product.stock).toBe(150);
    });

    it('should subtract stock successfully', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };
      
      mockProductRepository.findOne.mockResolvedValueOnce(productWithStock);
      mockProductRepository.save.mockResolvedValue({ ...productWithStock, stock: 70 });

      const adjustment = await service.adjustStock(mockProduct.id, 30, 'subtract');

      expect(adjustment.previousStock).toBe(100);
      expect(adjustment.newStock).toBe(70);
    });

    it('should throw BadRequestException when subtracting more than available', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };
      
      mockProductRepository.findOne.mockResolvedValueOnce(productWithStock);

      await expect(
        service.adjustStock(mockProduct.id, 200, 'subtract'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set stock to specific value', async () => {
      const productWithStock = { ...mockProduct, stock: 100 };
      
      mockProductRepository.findOne.mockResolvedValueOnce(productWithStock);
      mockProductRepository.save.mockResolvedValue({ ...productWithStock, stock: 75 });

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

      mockProductRepository.find.mockResolvedValue(allProducts);

      const result = await service.findLowStock(10);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.stock <= 10)).toBe(true);
    });

    it('should use default threshold of 10', async () => {
      mockProductRepository.find.mockResolvedValue([
        { ...mockProduct, stock: 5 },
      ]);

      const result = await service.findLowStock();

      expect(result).toHaveLength(1);
    });
  });
});
