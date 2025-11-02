import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

describe('StoresController', () => {
  let controller: StoresController;
  let storesService: StoresService;

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

  const mockStoresService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
    getRevenue: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-id-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: mockStoresService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    storesService = module.get<StoresService>(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createStoreDto: CreateStoreDto = {
      name: 'New Store',
      address: 'New Address 456',
      phone: '+525587654321',
      city: 'Guadalajara',
      state: 'Jalisco',
    };

    it('should create a new store', async () => {
      const newStore = { ...mockStore, ...createStoreDto };
      mockStoresService.create.mockResolvedValue(newStore);

      const result = await controller.create(createStoreDto, mockRequest);

      expect(result).toEqual(newStore);
      expect(storesService.create).toHaveBeenCalledWith(
        createStoreDto,
        mockRequest.user.userId,
      );
    });

    it('should handle creation errors', async () => {
      mockStoresService.create.mockRejectedValue(
        new Error('Error creating store'),
      );

      await expect(
        controller.create(createStoreDto, mockRequest),
      ).rejects.toThrow('Error creating store');
    });
  });

  describe('findAll', () => {
    it('should return paginated stores', async () => {
      const mockResponse = {
        data: [mockStore],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockStoresService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResponse);
      expect(storesService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should use default pagination values', async () => {
      const mockResponse = {
        data: [mockStore],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockStoresService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll(undefined, undefined);

      expect(storesService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      mockStoresService.findOne.mockResolvedValue(mockStore);

      const result = await controller.findOne(mockStore.id);

      expect(result).toEqual(mockStore);
      expect(storesService.findOne).toHaveBeenCalledWith(mockStore.id);
    });

    it('should throw NotFoundException if store not found', async () => {
      mockStoresService.findOne.mockRejectedValue(
        new NotFoundException('Supermercado no encontrado'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateStoreDto: UpdateStoreDto = {
      name: 'Updated Store',
      phone: '+525599999999',
    };

    it('should update a store', async () => {
      const updatedStore = { ...mockStore, ...updateStoreDto };
      mockStoresService.update.mockResolvedValue(updatedStore);

      const result = await controller.update(
        mockStore.id,
        updateStoreDto,
        mockRequest,
      );

      expect(result).toEqual(updatedStore);
      expect(storesService.update).toHaveBeenCalledWith(
        mockStore.id,
        updateStoreDto,
        mockRequest.user.userId,
      );
    });

    it('should throw NotFoundException if store not found', async () => {
      mockStoresService.update.mockRejectedValue(
        new NotFoundException('Supermercado no encontrado'),
      );

      await expect(
        controller.update('invalid-id', updateStoreDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a store', async () => {
      mockStoresService.remove.mockResolvedValue(undefined);

      await controller.remove(mockStore.id, mockRequest);

      expect(storesService.remove).toHaveBeenCalledWith(
        mockStore.id,
        mockRequest.user.userId,
      );
    });

    it('should throw NotFoundException if store not found', async () => {
      mockStoresService.remove.mockRejectedValue(
        new NotFoundException('Supermercado no encontrado'),
      );

      await expect(
        controller.remove('invalid-id', mockRequest),
      ).rejects.toThrow(NotFoundException      );
    });
  });

  describe('getStats', () => {
    const mockStats = {
      storeId: mockStore.id,
      storeName: mockStore.name,
      totalProducts: 150,
      totalInventoryValue: 25500.75,
      productsByCategory: [
        { category: 'Bebidas', productCount: 45, totalValue: 8500 },
      ],
      lowStockProducts: 12,
      lowStockThreshold: 10,
    };

    it('should return store statistics', async () => {
      mockStoresService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockStore.id, 10);

      expect(result).toEqual(mockStats);
      expect(storesService.getStats).toHaveBeenCalledWith(mockStore.id, 10);
    });

    it('should use default threshold', async () => {
      mockStoresService.getStats.mockResolvedValue(mockStats);

      await controller.getStats(mockStore.id, undefined);

      expect(storesService.getStats).toHaveBeenCalledWith(mockStore.id, 10);
    });
  });

  describe('getRevenue', () => {
    const mockRevenue = {
      storeId: mockStore.id,
      storeName: mockStore.name,
      totalInventoryValue: 25500.75,
      totalProducts: 150,
      totalStock: 3500,
      averageProductPrice: 170.00,
    };

    it('should return store revenue', async () => {
      mockStoresService.getRevenue.mockResolvedValue(mockRevenue);

      const result = await controller.getRevenue(mockStore.id);

      expect(result).toEqual(mockRevenue);
      expect(storesService.getRevenue).toHaveBeenCalledWith(mockStore.id);
    });

    it('should handle errors', async () => {
      mockStoresService.getRevenue.mockRejectedValue(
        new NotFoundException('Supermercado no encontrado'),
      );

      await expect(controller.getRevenue('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});