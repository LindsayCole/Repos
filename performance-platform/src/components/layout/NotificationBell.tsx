'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '@/app/actions/notifications';

interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationBellProps {
    userId: string;
    initialUnreadCount?: number;
}

export default function NotificationBell({ userId, initialUnreadCount = 0 }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            loadNotifications();
        }
    }, [isOpen]);

    // Auto-refresh unread count every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const count = await getUnreadNotificationCount(userId);
            setUnreadCount(count);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [userId]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications(userId, 10);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Optimistic UI update - mark as read immediately
        setNotifications(prev =>
            prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - (notification.isRead ? 0 : 1)));

        // Mark as read on server
        try {
            await markNotificationAsRead(notification.id);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }

        // Navigate to link if available
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Update on server
        try {
            await markAllNotificationsAsRead(userId);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const truncateMessage = (message: string, maxLength = 80) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    const getRelativeTime = (date: Date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch (error) {
            return 'Recently';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon with Badge */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                                    <Bell size={48} className="mb-4 opacity-20" />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800">
                                    {notifications.map(notification => (
                                        <motion.button
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full text-left p-4 transition-colors hover:bg-slate-800/50 ${
                                                !notification.isRead
                                                    ? 'bg-blue-500/10 border-l-4 border-blue-500/30'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <h4
                                                    className={`font-semibold ${
                                                        !notification.isRead
                                                            ? 'text-white'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {notification.title}
                                                </h4>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 ml-2 flex-shrink-0"></span>
                                                )}
                                            </div>
                                            <p
                                                className={`text-sm mb-2 ${
                                                    !notification.isRead
                                                        ? 'text-slate-300'
                                                        : 'text-slate-500'
                                                }`}
                                            >
                                                {truncateMessage(notification.message)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {getRelativeTime(notification.createdAt)}
                                            </p>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-800 text-center">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Future: Navigate to /notifications page
                                        // router.push('/notifications');
                                    }}
                                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
