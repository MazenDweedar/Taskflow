'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiException } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      await api.auth.register({ email, password });
      toast.success('Account created successfully');
      // After registration, redirect to login
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiException) {
        setErrors(err.messages);
        err.messages.forEach(msg => toast.error(msg));
      } else {
        setErrors(['An unexpected error occurred.']);
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-8">
      <div>
        <h2 className="text-xl font-bold text-text-primary">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Get started with TaskFlow for free
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email-address" className="block text-sm font-medium text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            className="appearance-none block w-full px-3 py-2 bg-bg border border-border placeholder-text-secondary text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="appearance-none block w-full px-3 py-2 bg-bg border border-border placeholder-text-secondary text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errors.length > 0 && (
          <div className="text-red-500 text-sm">
            <ul className="list-disc pl-5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-bg bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
        
        <div className="text-center text-sm pt-2">
          <span className="text-text-secondary">Already have an account? </span>
          <Link href="/login" className="font-medium text-accent hover:text-accent/80 transition-colors">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
