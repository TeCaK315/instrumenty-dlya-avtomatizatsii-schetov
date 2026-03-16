'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import {
  LayoutDashboard,
  Clock,
  PlusCircle,
  Settings,
  LogOut,
  LogIn, CreditCard,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/create', label: 'Create New', icon: PlusCircle },
  { href: '/dashboard/history', label: 'History', icon: Clock },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase not configured
    }
    router.push('/');
  }, [router]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <nav
      className="w-64 min-h-screen border-r flex flex-col"
      style={{
        background: '#1a202c',
        borderColor: '#5a67d810',
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: '#5a67d810' }}>
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-heading font-bold" style={{ color: '#edf2f7' }}>
            Инструменты для автоматизации счетов
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: active ? '#5a67d820' : 'transparent',
                color: active ? '#5a67d8' : '#edf2f770',
              }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User Section */}
      <div className="p-4 border-t" style={{ borderColor: '#5a67d810' }}>
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:opacity-80"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
                >
                  {initials}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate" style={{ color: '#edf2f7' }}>
                  {displayName}
                </p>
                <p className="text-xs truncate" style={{ color: '#edf2f750' }}>
                  {user.email}
                </p>
              </div>
              <ChevronDown
                className="w-4 h-4 transition-transform"
                style={{
                  color: '#edf2f750',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-lg overflow-hidden"
                style={{
                  background: '#1a202c',
                  borderColor: '#5a67d820',
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:opacity-80"
                  style={{ color: '#ef4444' }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:opacity-80"
            style={{ color: '#edf2f770' }}
          >
            <LogIn className="w-5 h-5" />
            <span className="text-sm font-medium">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
