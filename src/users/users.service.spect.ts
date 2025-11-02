import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const email = 'newuser@example.com';
    const password = 'password123';
    const name = 'New User';

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const newUser = {
        ...mockUser,
        email,
        password: hashedPassword,
        name,
      };

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(email, password, name);

      expect(result).toEqual(newUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
        name,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(email, password, name)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(email, password, name)).rejects.toThrow(
        'El email ya está registrado',
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(
        plainPassword,
        hashedPassword,
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
    });

    it('should return false for invalid password', async () => {
      const plainPassword = 'wrongpassword';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(
        plainPassword,
        hashedPassword,
      );

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('invalid-id', updateData)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });

    it('should throw ConflictException if new email already exists', async () => {
      const existingUser = { ...mockUser, id: 'different-id' };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(existingUser);

      await expect(service.update(mockUser.id, updateData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(mockUser.id, updateData)).rejects.toThrow(
        'El email ya está en uso',
      );
    });

    it('should not check email if email is not being updated', async () => {
      const updateDataWithoutEmail = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateDataWithoutEmail };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDataWithoutEmail);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should not check email if email is same as current', async () => {
      const updateDataSameEmail = { 
        name: 'Updated Name',
        email: mockUser.email
      };
      const updatedUser = { ...mockUser, ...updateDataSameEmail };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDataSameEmail);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePassword', () => {
    it('should update user password with hashed value', async () => {
      const newPassword = 'newPassword456';
      const hashedPassword = 'newHashedPassword456';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updatePassword(mockUser.id, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: hashedPassword,
      });
    });
  });
});