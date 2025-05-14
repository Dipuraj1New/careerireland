import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '@/lib/db';
import { redisClient, connectRedis } from '@/lib/redis';
import { User, UserRegistrationData, UserLoginData, UserRole, AuthTokens } from '@/types/user';

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
export async function registerUser(userData: UserRegistrationData): Promise<User> {
  // Check if user already exists
  const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [userData.email]);
  
  if (existingUser.rows.length > 0) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
  
  // Create user
  const userId = uuidv4();
  const now = new Date();
  
  const newUser = {
    id: userId,
    email: userData.email,
    passwordHash,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role || UserRole.APPLICANT,
    dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
    nationality: userData.nationality || null,
    createdAt: now,
    updatedAt: now,
  };
  
  const query = `
    INSERT INTO users (
      id, email, password_hash, first_name, last_name, role, 
      date_of_birth, nationality, created_at, updated_at
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, email, first_name, last_name, role, date_of_birth, nationality, created_at, updated_at
  `;
  
  const values = [
    newUser.id, 
    newUser.email, 
    newUser.passwordHash, 
    newUser.firstName, 
    newUser.lastName, 
    newUser.role,
    newUser.dateOfBirth,
    newUser.nationality,
    newUser.createdAt,
    newUser.updatedAt
  ];
  
  const result = await db.query(query, values);
  
  return {
    ...result.rows[0],
    firstName: result.rows[0].first_name,
    lastName: result.rows[0].last_name,
    dateOfBirth: result.rows[0].date_of_birth,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Login a user
 */
export async function loginUser(loginData: UserLoginData): Promise<AuthTokens> {
  // Find user by email
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [loginData.email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }
  
  const user = result.rows[0];
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  
  // Generate tokens
  const tokens = await generateTokens(user);
  
  return tokens;
}

/**
 * Generate JWT and refresh tokens
 */
export async function generateTokens(user: any): Promise<AuthTokens> {
  // Create JWT token
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  // Create refresh token
  const refreshToken = uuidv4();
  
  // Store refresh token in Redis
  await connectRedis();
  await redisClient.set(
    `refresh_token:${refreshToken}`,
    user.id,
    { EX: 60 * 60 * 24 * 7 } // 7 days
  );
  
  // Format user object
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    dateOfBirth: user.date_of_birth,
    nationality: user.nationality,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
  
  return {
    token,
    refreshToken,
    user: userResponse,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  await connectRedis();
  
  // Get user ID from refresh token
  const userId = await redisClient.get(`refresh_token:${refreshToken}`);
  
  if (!userId) {
    throw new Error('Invalid or expired refresh token');
  }
  
  // Get user from database
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  
  // Delete old refresh token
  await redisClient.del(`refresh_token:${refreshToken}`);
  
  // Generate new tokens
  const tokens = await generateTokens(user);
  
  return tokens;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Logout user by invalidating refresh token
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  await connectRedis();
  await redisClient.del(`refresh_token:${refreshToken}`);
}
