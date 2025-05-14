import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Career Ireland Immigration',
  description: 'Login to your Career Ireland Immigration account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Career Ireland</h1>
          <p className="mt-2 text-sm text-gray-600">
            Streamlining the Irish immigration process
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
