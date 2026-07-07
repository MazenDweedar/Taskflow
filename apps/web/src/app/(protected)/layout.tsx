'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiException } from '@/lib/api';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    
    api.auth.me()
      .then((data: any) => {
        if (mounted) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          if (err instanceof ApiException && err.statusCode === 401) {
            router.push('/login');
          } else {
            console.error('Failed to verify session', err);
            // Optionally redirect to login on other errors too, or show an error state
            router.push('/login');
          }
        }
      });
      
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/projects" className="text-xl font-bold text-indigo-600">
                  TaskFlow
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
