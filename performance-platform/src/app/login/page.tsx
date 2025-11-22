'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (email: string) => {
        setLoading(email);
        setError(null);

        const result = await signIn("credentials", {
            redirect: false,
            email: email,
            password: "password", // Dummy password, ignored by our authorize
        });

        setLoading(null);

        if (result?.ok) {
            router.push('/dashboard');
        } else {
            setError("Login failed. User not found or error occurred.");
        }
    };

    const users = [
        { email: 'hr@example.com', label: 'HR Admin', role: 'HR' },
        { email: 'manager@example.com', label: 'Manager Mike', role: 'Manager' },
        { email: 'employee@example.com', label: 'Employee Emma', role: 'Employee' },
    ];

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md p-8 space-y-8 bg-slate-900/80 backdrop-blur-2xl border-slate-700/50">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Performance Platform
                    </h1>
                    <p className="text-slate-400">Select a role to continue (v5 Auth)</p>
                </div>

                {error && <p className="text-red-400 text-center">{error}</p>}

                <div className="space-y-4">
                    {users.map((user) => (
                        <motion.div
                            key={user.email}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                onClick={() => handleLogin(user.email)}
                                disabled={!!loading}
                                className="w-full justify-between group relative overflow-hidden"
                                variant="secondary"
                                size="lg"
                            >
                                <span className="relative z-10">{user.label}</span>
                                <span className="relative z-10 text-xs font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                                    {user.role}
                                </span>
                                {loading === user.email && (
                                    <motion.div
                                        layoutId="loading"
                                        className="absolute inset-0 bg-cyan-500/20"
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                    />
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
