'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Building2, Dumbbell, LinkIcon } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

type Notification = {
	id: number;
	type: string;
	message: string;
	related_id: number | null;
	read: boolean;
	created_at: string;
};

interface Props {
	buttonClassName?: string;
}

export default function NotificationDrawer({ buttonClassName }: Props) {
	const { user, token } = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	const unreadCount = notifications.filter((n) => !n.read).length;

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (user && isOpen) fetchNotifications();
	}, [user, isOpen]);

	const fetchNotifications = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${API_URL}/notifications`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			setNotifications(data.data?.notifications || []);
		} catch (err) {
			console.error('Failed to fetch notifications:', err);
		} finally {
			setLoading(false);
		}
	};

	const markAsRead = async (id: number) => {
		try {
			await fetch(`${API_URL}/notifications/${id}/read`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
		} catch (err) {
			console.error('Failed to mark as read:', err);
		}
	};

	const markAllAsRead = async () => {
		try {
			await fetch(`${API_URL}/notifications/read-all`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		} catch (err) {
			console.error('Failed to mark all as read:', err);
		}
	};

	const getIcon = (type: string) => {
		if (type === 'gym_rejected' || type === 'equipment_rejected')
			return <X className="h-4 w-4 text-red-400" />;
		if (type === 'submission_received') return <Check className="text-sub h-4 w-4" />;
		if (type === 'gym_approved') return <Building2 className="text-sub h-4 w-4" />;
		if (type === 'equipment_approved') return <Dumbbell className="text-sub h-4 w-4" />;
		if (type.includes('gym')) return <Building2 className="text-sub h-4 w-4" />;
		if (type.includes('equipment')) return <Dumbbell className="text-sub h-4 w-4" />;
		if (type.includes('suggestion')) return <LinkIcon className="text-sub h-4 w-4" />;
		return <Check className="text-sub h-4 w-4" />;
	};

	const getLink = (notif: Notification) => {
		if (notif.type === 'gym_approved' && notif.related_id) return `/gyms/${notif.related_id}`;
		if (notif.type === 'equipment_approved' && notif.related_id)
			return `/equipment/${notif.related_id}`;
		return null;
	};

	if (!user) return null;

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
				className={
					buttonClassName ??
					'h-(--hit-size) w-(--hit-size) rounded-(--roundness) text-sub hover:text-text flex items-center justify-center transition-colors'
				}
			>
				<span className="relative">
					<Bell className="h-4.5 w-4.5" />
					{unreadCount > 0 && (
						<span className="bg-main text-bg absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					)}
				</span>
			</button>

			{mounted &&
				isOpen &&
				createPortal(
					<>
						<div
							className="top-15 fixed inset-x-0 bottom-0 z-40 bg-black/40"
							onClick={() => setIsOpen(false)}
						/>

						<div className="bg-surface border-border z-70 fixed bottom-0 right-0 top-0 w-full max-w-sm border-l shadow-2xl">
							<div className="border-border flex items-center justify-between border-b p-4">
								<div className="flex items-center gap-2">
									<Bell className="text-main h-5 w-5" />
									<h2 className="text-main text-lg font-semibold">Notifications</h2>
									{unreadCount > 0 && (
										<span className="bg-main/10 text-main rounded-full px-2 py-0.5 text-xs">
											{unreadCount}
										</span>
									)}
								</div>
								<button
									onClick={() => setIsOpen(false)}
									aria-label="Close notifications"
									className="text-sub hover:text-main transition"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{unreadCount > 0 && (
								<div className="border-border border-b p-3">
									<button
										onClick={markAllAsRead}
										className="text-sub hover:text-main w-full text-left text-xs transition"
									>
										Mark all as read
									</button>
								</div>
							)}

							<div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
								{loading ? (
									<div className="text-sub flex items-center justify-center p-8 text-sm">
										Loading...
									</div>
								) : notifications.length === 0 ? (
									<div className="flex flex-col items-center justify-center p-12 text-center">
										<Bell className="text-sub mb-3 h-12 w-12 opacity-30" />
										<p className="text-main mb-1 font-medium">No notifications yet</p>
										<p className="text-sub text-sm">
											You'll be notified when your contributions are approved
										</p>
									</div>
								) : (
									<div className="divide-border divide-y">
										{notifications.map((notif) => {
											const link = getLink(notif);
											const sharedCls = `flex gap-3 p-4 transition ${!notif.read ? 'bg-main/5' : ''}`;

											if (link) {
												return (
													<Link
														key={notif.id}
														href={link}
														className={`${sharedCls} hover:bg-sub-alt cursor-pointer`}
														onClick={() => !notif.read && markAsRead(notif.id)}
													>
														<div className="mt-0.5">{getIcon(notif.type)}</div>
														<div className="min-w-0 flex-1">
															<p className="text-main text-sm">{notif.message}</p>
															<p className="text-sub mt-1 text-xs">
																{new Date(notif.created_at).toLocaleDateString('en-GB', {
																	day: 'numeric',
																	month: 'short',
																	hour: '2-digit',
																	minute: '2-digit'
																})}
															</p>
														</div>
														{!notif.read && (
															<div className="bg-main mt-2 h-2 w-2 shrink-0 rounded-full" />
														)}
													</Link>
												);
											}

											return (
												<div key={notif.id} className={sharedCls}>
													<div className="mt-0.5">{getIcon(notif.type)}</div>
													<div className="min-w-0 flex-1">
														<p className="text-main text-sm">{notif.message}</p>
														<p className="text-sub mt-1 text-xs">
															{new Date(notif.created_at).toLocaleDateString('en-GB', {
																day: 'numeric',
																month: 'short',
																hour: '2-digit',
																minute: '2-digit'
															})}
														</p>
													</div>
													{!notif.read && (
														<div className="bg-main mt-2 h-2 w-2 shrink-0 rounded-full" />
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					</>,
					document.body
				)}
		</>
	);
}
