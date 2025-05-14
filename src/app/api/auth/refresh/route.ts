import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/services/auth/authService';

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Refresh access token
    const { token, refreshToken: newRefreshToken, user } = await refreshAccessToken(refreshToken);
    
    // Set new refresh token as HTTP-only cookie
    const response = NextResponse.json(
      { token, user },
      { status: 200 }
    );
    
    response.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    if (error.message === 'Invalid or expired refresh token') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
