'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, ApiException } from '@/lib/api';

type Project = {
  id: string;
  name: string;
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    api.auth.me()
      .then(async (data: any) => {
        if (mounted) {
          setUser(data);
          try {
            const projs = await api.projects.list();
            if (mounted) setProjects(projs);
          } catch (e) {
            console.error('Failed to load projects', e);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          // Clear the stale cookie so middleware won't redirect us back
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
          }
          if (err instanceof ApiException && err.statusCode === 401) {
            window.location.href = '/login';
          } else {
            console.error('Failed to verify session', err);
            window.location.href = '/login';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-surface border-r border-border flex flex-col h-screen fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header / Logo */}
        <div className="p-6">
          <Link href="/projects" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h1 className="font-bold text-lg text-text-primary tracking-wide">TaskFlow</h1>
              <p className="text-xs text-text-secondary truncate w-40">{user?.email}</p>
            </div>
          </Link>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="flex items-center gap-2 mb-3 px-3">
            <h2 className="text-[11px] font-semibold text-text-secondary/50 tracking-widest uppercase">Projects</h2>
            <div className="h-px flex-1 bg-border/50"></div>
          </div>
          <ul className="space-y-1">
            {projects.map(p => {
              const isActive = pathname === `/projects/${p.id}`;
              return (
                <li key={p.id} className="group relative">
                  <Link
                    href={`/projects/${p.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors pr-8 ${isActive
                        ? 'bg-accent-dim text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      }`}
                  >
                    <span className="truncate block">{p.name}</span>
                  </Link>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (window.confirm(`Delete project "${p.name}"? All tasks will be lost.`)) {
                        try {
                          await api.projects.delete(p.id);
                          setProjects(prev => prev.filter(proj => proj.id !== p.id));
                          if (isActive) {
                            router.push('/projects');
                          }
                        } catch (err) {
                          alert('Failed to delete project');
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-text-secondary hover:text-[#EF4444] transition-all p-1.5 rounded-lg hover:bg-[#EF4444]/10"
                    title="Delete Project"
                  >
                    <span className="text-sm leading-none">🗑</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/projects"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Project
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors"
          >
            <span className="text-lg leading-none">⎋</span> Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden md:overflow-visible">
        {/* Mobile Header */}
        <div className="md:hidden bg-surface border-b border-border p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 -ml-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/projects" className="font-bold text-text-primary">TaskFlow</Link>
          </div>
          <button onClick={handleLogout} className="text-text-secondary text-sm font-medium">Log out</button>
        </div>

        <div className="flex-1 p-6 md:p-10 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
