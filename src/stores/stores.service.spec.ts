import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StoresService } from './stores.service';
import { Store } from './entities/store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

describe('StoresService', () => {
  let service: StoresService;
  let repository: Repository<Store>;

  const mockStore = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Store',
    address: 'Test Address 123',
    phone: '+525512345678',
    city: 'Ciudad de México',
    state: 'CDMX',
    latitude: 19.432608,
    longitude: -99.133209,
    isActive: true,
    createdById: 'user-id-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    repository = module.get<Repository<Store>>(getRepositoryToken(Store));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createStoreDto: CreateStoreDto = {
      name: 'New Store',
      address: 'New Address 456',
      phone: '+525587654321',
      city: 'Guadalajara',
      state: 'Jalisco',
    };

    it('should create a store successfully', async () => {
      const userId = 'user-id-123';
      const newStore = { ...mockStore, ...createStoreDto };

      mockRepository.create.mockReturnValue(newStore);
      mockRepository.save.mockResolvedValue(newStore);

      const result = await service.create(createStoreDto, userId);

      expect(result).toEqual(newStore);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createStoreDto,
        createdById: userId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(newStore);
    });
  });

  describe('findAll', () => {
    it('should return paginated stores', async () => {
      const stores = [mockStore];
      const total = 1;

      mockRepository.findAndCount.mockResolvedValue([stores, total]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: stores,
        total,
        page: 1,
        limit: 10,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
        relations: ['createdBy'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockStore);

      const result = await service.findOne(mockStore.id);

      expect(result).toEqual(mockStore);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockStore.id, isActive: true },
        relations: ['createdBy', 'products'],
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateStoreDto: UpdateStoreDto = {
      name: 'Updated Store',
      phone: '+525599999999',
    };

    it('should update a store successfully', async () => {
      const updatedStore = { ...mockStore, ...updateStoreDto };

      mockRepository.findOne.mockResolvedValue(mockStore);
      mockRepository.save.mockResolvedValue(updatedStore);

      const result = await service.update(mockStore.id, updateStoreDto, 'user-id-123');

      expect(result).toEqual(updatedStore);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if store not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateStoreDto, 'user-id-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a store', async () => {
      const storeToDelete = { ...mockStore };

      mockRepository.findOne.mockResolvedValue(storeToDelete);
      mockRepository.save.mockResolvedValue({ ...storeToDelete, isActive: false });

      await service.remove(mockStore.id, 'user-id-123');

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...storeToDelete,
        isActive: false,
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'user-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStats', () => {
    const mockStoreWithProducts = {
      ...mockStore,
      products: [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          stock: 10,
          category: 'Bebidas',
          isActive: true,
        },
        {
          id: '2',
          name: 'Product 2',
          price: 50,
          stock: 5,
          category: 'Bebidas',
          isActive: true,
        },
        {
          id: '3',
          name: 'Product 3',
          price: 200,
          stock: 3,
          category: 'Alimentos',
          isActive: true,
        },
      ],
    };

    it('should return store statistics', async () => {
      mockRepository.findOne.mockResolvedValue(mockStoreWithProducts);

      const result = await service.getStats(mockStore.id, 10);

      expect(result).toHaveProperty('storeId', mockStore.id);
      expect(result).toHaveProperty('storeName', mockStoreWithProducts.name);
      expect(result).toHaveProperty('totalProducts', 3);
      expect(result).toHaveProperty('totalInventoryValue');
      expect(result).toHaveProperty('productsByCategory');
      expect(result.productsByCategory).toHaveLength(2);
      expect(result).toHaveProperty('lowStockProducts', 3);
      expect(result).toHaveProperty('lowStockThreshold', 10);
    });

    it('should calculate correct inventory value', async () => {
      mockRepository.findOne.mockResolvedValue(mockStoreWithProducts);
      const result = await service.getStats(mockStore.id);
      expect(result.totalInventoryValue).toBe(1850);
    });

    it('should group products by category', async () => {
      mockRepository.findOne.mockResolvedValue(mockStoreWithProducts);

      const result = await service.getStats(mockStore.id);

      const bebidasCategory = result.productsByCategory.find(
        c => c.category === 'Bebidas',
      );
      expect(bebidasCategory).toBeDefined();
      expect(bebidasCategory.productCount).toBe(2);
      expect(bebidasCategory.totalValue).toBe(1250);
    });

    it('should throw NotFoundException if store not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getStats('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRevenue', () => {
    const mockStoreWithProducts = {
      ...mockStore,
      products: [
        {
          id: '1',
          price: 100,
          stock: 10,
          isActive: true,
        },
        {
          id: '2',
          price: 50,
          stock: 20,
          isActive: true,
        },
      ],
    };

    it('should calculate revenue correctly', async () => {
      mockRepository.findOne.mockResolvedValue(mockStoreWithProducts);

      const result = await service.getRevenue(mockStore.id);

      expect(result).toHaveProperty('storeId', mockStore.id);
      expect(result).toHaveProperty('storeName', mockStoreWithProducts.name);
      expect(result).toHaveProperty('totalInventoryValue', 2000);
      expect(result).toHaveProperty('totalProducts', 2);
      expect(result).toHaveProperty('totalStock', 30);
      expect(result).toHaveProperty('averageProductPrice', 75);
    });

    it('should handle store with no products', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockStore,
        products: [],
      });

      const result = await service.getRevenue(mockStore.id);

      expect(result.totalProducts).toBe(0);
      expect(result.totalInventoryValue).toBe(0);
      expect(result.averageProductPrice).toBe(0);
    });

    it('should throw NotFoundException if store not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getRevenue('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});