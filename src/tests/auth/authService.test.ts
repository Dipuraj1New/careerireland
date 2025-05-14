import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  registerUser, 
  loginUser, 
  refreshAccessToken, 
  verifyToken, 
  logoutUser 
} from '@/services/auth/authService';
import { UserRole } from '@/types/user';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('uuid');
jest.mock('@/lib/db');
jest.mock('@/lib/redis', () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
  connectRedis: jest.fn().mockResolvedValue({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  }),
}));

// Import mocks
import db from '@/lib/db';
import { redisClient, connectRedis } from '@/lib/redis';

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Mock data
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.APPLICANT,
      };

      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPasswordHash = 'hashed_password';

      // Mock implementations
      (db.query as jest.Mock).mockImplementation((query, params) => {
        if (query.includes('SELECT')) {
          return { rows: [] }; // No existing user
        } else {
          return {
            rows: [{
              id: mockUserId,
              email: userData.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              role: userData.role,
              date_of_birth: null,
              nationality: null,
              created_at: new Date(),
              updated_at: new Date(),
            }],
          };
        }
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(mockPasswordHash);
      (uuidv4 as jest.Mock).mockReturnValue(mockUserId);

      // Call the function
      const result = await registerUser(userData);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(result).toEqual(expect.objectContaining({
        id: mockUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      }));
    });

    it('should throw an error if user already exists', async () => {
      // Mock data
      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.APPLICANT,
      };

      // Mock implementations
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'existing-id' }], // Existing user
      });

      // Call the function and expect error
      await expect(registerUser(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.APPLICANT,
        date_of_birth: null,
        nationality: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockToken = 'jwt_token';
      const mockRefreshToken = 'refresh_token';

      // Mock implementations
      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockUser],
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      (uuidv4 as jest.Mock).mockReturnValue(mockRefreshToken);

      // Call the function
      const result = await loginUser(loginData);

      // Assertions
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [loginData.email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password_hash);
      expect(jwt.sign).toHaveBeenCalled();
      expect(connectRedis).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
      expect(result).toEqual({
        token: mockToken,
        refreshToken: mockRefreshToken,
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
      });
    });

    it('should throw an error if user does not exist', async () => {
      // Mock data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      // Mock implementations
      (db.query as jest.Mock).mockResolvedValue({
        rows: [], // No user found
      });

      // Call the function and expect error
      await expect(loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error if password is incorrect', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.APPLICANT,
      };

      // Mock implementations
      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockUser],
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Password doesn't match

      // Call the function and expect error
      await expect(loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      // Mock data
      const mockToken = 'valid_token';
      const mockDecodedToken = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: UserRole.APPLICANT,
      };

      // Mock implementations
      (jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      // Call the function
      const result = verifyToken(mockToken);

      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(result).toEqual(mockDecodedToken);
    });

    it('should throw an error for invalid token', () => {
      // Mock data
      const mockToken = 'invalid_token';

      // Mock implementations
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Call the function and expect error
      expect(() => verifyToken(mockToken)).toThrow('Invalid or expired token');
    });
  });
});
