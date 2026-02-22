// frontend/src/components/Layout.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
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
    <div className="min-h-screen bg-background">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-navy-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <Image
                src="/logo.png"
                alt="JobSpresso"
                width={144}
                height={36}
                priority
                className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
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
                        ? 'bg-navy-100 text-navy-900'
                        : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10">
        {children}
      </main>
      <footer className="border-t border-navy-200/50 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-navy-500">
            JobSpresso — Craft job descriptions that attract the right talent
          </p>
        </div>
      </footer>
    </div>
  );
}
