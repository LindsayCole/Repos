'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Home, Users, FileText, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { UI_TEXT } from '@/lib/constants';

export default function Navigation() {
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string | null>(null);

    // Fetch user role
    useEffect(() => {
        fetch('/api/current-user')
            .then(res => res.json())
            .then(data => setUserRole(data.role))
            .catch(() => setUserRole(null));
    }, []);

    // Don't show navigation on login page
    if (pathname === '/login') return null;

    // Define navigation items with role requirements
    const allNavItems = [
        { href: '/dashboard', label: UI_TEXT.NAV_DASHBOARD, icon: Home, roles: ['HR', 'MANAGER', 'EMPLOYEE'] },
        { href: '/team', label: UI_TEXT.NAV_MY_TEAM, icon: Users, roles: ['MANAGER'] },
        { href: '/builder', label: UI_TEXT.NAV_FORMS, icon: FileText, roles: ['HR'] },
    ];

    // Filter based on user role
    const navItems = userRole
        ? allNavItems.filter(item => item.roles.includes(userRole))
        : allNavItems.filter(item => item.href === '/dashboard'); // Default to dashboard only

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50"
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/dashboard">
                            <motion.h1
                                whileHover={{ scale: 1.05 }}
                                className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                            >
                                Performance Platform
                            </motion.h1>
                        </Link>

                        <div className="hidden md:flex space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                                return (
                                    <Link key={item.href} href={item.href}>
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive
                                                    ? 'bg-cyan-500/20 text-cyan-300'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut size={16} className="mr-2" />
                        {UI_TEXT.NAV_SIGN_OUT}
                    </Button>
                </div>
            </div>
        </motion.nav>
    );
}
