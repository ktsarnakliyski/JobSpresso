// frontend/src/components/Layout.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8h1a4 4 0 110 8h-1" />
      <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
      <path d="M6 2v3" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
    </svg>
  );
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/analyze', label: 'Analyze' },
    { href: '/generate', label: 'Generate' },
    { href: '/profiles', label: 'Profiles' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-espresso-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-espresso-800 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <CoffeeIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl font-semibold text-espresso-900 tracking-tight">
                JobSpresso
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-espresso-100 text-espresso-900'
                        : 'text-espresso-600 hover:text-espresso-900 hover:bg-espresso-50'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-espresso-200/50 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-espresso-500">
            JobSpresso — A fresh shot for your job descriptions
          </p>
        </div>
      </footer>
    </div>
  );
}
