'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Check, X, Building2, Dumbbell, Clock, Users, ShieldCheck, ImageIcon } from 'lucide-react';
import { fetchAdminPending, fetchAdminUsers, adminAction, adminPhotoAction, makeAdmin } from '@/lib/api';
import { PendingGym, PendingEquipment, PendingSuggestion, PendingPhoto, AdminUser } from '@/types/admin';

type ActionState = Record<string, 'approving' | 'rejecting' | 'done'>;

const TABS = ['equipment', 'gyms', 'suggestions', 'photos', 'users'] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
	const { user } = useAuth();
	const router = useRouter();
	const [gyms, setGyms] = useState<PendingGym[]>([]);
	const [equipment, setEquipment] = useState<PendingEquipment[]>([]);
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [actions, setActions] = useState<ActionState>({});
	const [promotingId, setPromotingId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>('equipment');
	const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
	const [photos, setPhotos] = useState<PendingPhoto[]>([]);

	const isSuperAdmin = user?.role === 'super_admin';

	useEffect(() => {
		if (!user) {
			router.push('/login');
			return;
		}
		if (user.role !== 'admin' && user.role !== 'super_admin') {
			router.push('/');
			return;
		}

		fetchPending();

		// Evaluate the condition dynamically inside the effect instead of tracking its boolean state
		if (user.role === 'super_admin') {
			fetchUsers();
		}
	}, [user, router]);

	const fetchPending = async () => {
		try {
			const data = await fetchAdminPending();
			setGyms(data.gyms || []);
			setEquipment(data.equipment || []);
			setSuggestions(data.suggestions || []);
			setPhotos(data.photos || []);
		} catch (err) {
			console.error('Failed to fetch pending:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchUsers = async () => {
		try {
			const data = await fetchAdminUsers();
			setUsers(data.users || []);
		} catch (err) {
			console.error('Failed to fetch users:', err);
		}
	};

	const handleAction = async (
		type: 'gym' | 'equipment' | 'suggestion',
		id: number,
		action: 'approve' | 'reject'
	) => {
		const key = `${type}-${id}`;
		setActions((prev) => ({ ...prev, [key]: action === 'approve' ? 'approving' : 'rejecting' }));
		try {
			await adminAction(action, type, id);
			setActions((prev) => ({ ...prev, [key]: 'done' }));
			setTimeout(() => {
				if (type === 'gym') setGyms((prev) => prev.filter((g) => g.id !== id));
				else if (type === 'equipment') setEquipment((prev) => prev.filter((e) => e.id !== id));
				else setSuggestions((prev) => prev.filter((s) => s.id !== id));
			}, 600);
		} catch (err) {
			console.error(`Failed to ${action}:`, err);
			setActions((prev) => {
				const next = { ...prev };
				delete next[key];
				return next;
			});
		}
	};

	const handlePhotoAction = async (id: number, action: 'approve' | 'reject') => {
		const key = `photo-${id}`;
		setActions((prev) => ({ ...prev, [key]: action === 'approve' ? 'approving' : 'rejecting' }));
		try {
			await adminPhotoAction(action, id);
			setActions((prev) => ({ ...prev, [key]: 'done' }));
			setTimeout(() => setPhotos((prev) => prev.filter((p) => p.id !== id)), 600);
		} catch (err) {
			console.error(`Failed to ${action} photo:`, err);
			setActions((prev) => {
				const next = { ...prev };
				delete next[key];
				return next;
			});
		}
	};

	const handleMakeAdmin = async (userId: string) => {
		setPromotingId(userId);
		try {
			await makeAdmin(userId);
			setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: 'admin' } : u)));
		} catch (err) {
			console.error('Failed to promote user:', err);
		} finally {
			setPromotingId(null);
		}
	};

	const formatDate = (d: string) =>
		new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	if (loading) return <div className="text-sub p-8 text-sm">Loading admin dashboard...</div>;

	const totalPending = gyms.length + equipment.length + suggestions.length + photos.length;
	const visibleTabs = isSuperAdmin ? TABS : (['equipment', 'gyms', 'suggestions', 'photos'] as const);

	return (
		<div id="pageAdmin" className="content-grid py-8">
			<div className="full-width-padding mx-auto w-full max-w-3xl">
				{/* Header */}
				<div className="mb-6">
					<div className="mb-1 flex items-center gap-2">
						<h1 className="text-main text-xl font-semibold">Admin</h1>
						{totalPending > 0 && (
							<span className="bg-main text-bg rounded-full px-2 py-0.5 text-xs font-medium">
								{totalPending} pending
							</span>
						)}
						{isSuperAdmin && (
							<span className="border-border text-sub rounded-full border px-2 py-0.5 text-xs">
								super admin
							</span>
						)}
					</div>
					<p className="text-sub text-sm">Review and approve community submissions</p>
				</div>

				{/* Tabs Bar */}
				<div className="border-border scrollbar-none mb-4 flex gap-1 overflow-x-auto whitespace-nowrap border-b">
					{visibleTabs.map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
								activeTab === tab
									? 'border-main text-main -mb-px'
									: 'text-sub hover:text-main border-transparent'
							}`}
						>
							{tab === 'equipment' && <Dumbbell className="h-3.5 w-3.5" />}
							{tab === 'gyms' && <Building2 className="h-3.5 w-3.5" />}
							{tab === 'suggestions' && <Dumbbell className="h-3.5 w-3.5" />}
							{tab === 'photos' && <ImageIcon className="h-3.5 w-3.5" />}
							{tab === 'users' && <Users className="h-3.5 w-3.5" />}

							<span className="capitalize">{tab}</span>

							{tab === 'equipment' && equipment.length > 0 && (
								<span className="bg-sub-alt text-sub rounded-full px-1.5 py-0.5 text-xs">
									{equipment.length}
								</span>
							)}
							{tab === 'gyms' && gyms.length > 0 && (
								<span className="bg-sub-alt text-sub rounded-full px-1.5 py-0.5 text-xs">
									{gyms.length}
								</span>
							)}
							{tab === 'suggestions' && suggestions.length > 0 && (
								<span className="bg-sub-alt text-sub rounded-full px-1.5 py-0.5 text-xs">
									{suggestions.length}
								</span>
							)}
							{tab === 'photos' && photos.length > 0 && (
								<span className="bg-sub-alt text-sub rounded-full px-1.5 py-0.5 text-xs">
									{photos.length}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Equipment Tab Content */}
				{activeTab === 'equipment' && (
					<div className="space-y-2">
						{equipment.length === 0 ? (
							<EmptyState label="No pending equipment entries found" />
						) : (
							equipment.map((e) => {
								const key = `equipment-${e.id}`;
								const state = actions[key];
								return (
									<div
										key={e.id}
										className={`border-border bg-surface flex items-center gap-4 rounded-2xl border p-4 transition-opacity duration-300 ${
											state === 'done' ? 'opacity-0' : 'opacity-100'
										}`}
									>
										<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
											{e.image_url ? (
												<img
													src={e.image_url}
													alt={e.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<Dumbbell className="text-sub h-4 w-4" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-main text-sm font-medium">
												{[e.brand, e.series, e.name].filter(Boolean).join(' ')}
											</p>
											<div className="text-sub mt-0.5 flex items-center gap-2 text-xs">
												<span
													className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
														e.type === 'pin_loaded'
															? 'bg-blue-900/30 text-blue-400'
															: 'bg-orange-900/30 text-orange-400'
													}`}
												>
													{e.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
												</span>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{formatDate(e.created_at)}
												</span>
												{e.submitted_by && <span>by {e.submitted_by}</span>}
											</div>
										</div>
										<ActionButtons
											state={state}
											onApprove={() => handleAction('equipment', e.id, 'approve')}
											onReject={() => handleAction('equipment', e.id, 'reject')}
										/>
									</div>
								);
							})
						)}
					</div>
				)}

				{/* Gyms Tab Content */}
				{activeTab === 'gyms' && (
					<div className="space-y-2">
						{gyms.length === 0 ? (
							<EmptyState label="No pending gyms found" />
						) : (
							gyms.map((g) => {
								const key = `gym-${g.id}`;
								const state = actions[key];
								return (
									<div
										key={g.id}
										className={`border-border bg-surface flex items-center gap-4 rounded-2xl border p-4 transition-opacity duration-300 ${
											state === 'done' ? 'opacity-0' : 'opacity-100'
										}`}
									>
										<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
											<Building2 className="text-sub h-4 w-4" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-main text-sm font-medium">{g.name}</p>
											<div className="text-sub mt-0.5 flex items-center gap-2 text-xs">
												{(g.city || g.country) && (
													<span>{[g.city, g.country].filter(Boolean).join(', ')}</span>
												)}
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{formatDate(g.created_at)}
												</span>
												{g.submitted_by && <span>by {g.submitted_by}</span>}
											</div>
											{g.instagram && <p className="text-sub mt-0.5 text-xs">@{g.instagram}</p>}
										</div>
										<ActionButtons
											state={state}
											onApprove={() => handleAction('gym', g.id, 'approve')}
											onReject={() => handleAction('gym', g.id, 'reject')}
										/>
									</div>
								);
							})
						)}
					</div>
				)}

				{/* Suggestions Tab Content */}
				{activeTab === 'suggestions' && (
					<div className="space-y-2">
						{suggestions.length === 0 ? (
							<EmptyState label="No pending equipment linking suggestions" />
						) : (
							suggestions.map((s) => {
								const key = `suggestion-${s.id}`;
								const state = actions[key];
								return (
									<div
										key={s.id}
										className={`border-border bg-surface flex items-center gap-4 rounded-2xl border p-4 transition-opacity duration-300 ${
											state === 'done' ? 'opacity-0' : 'opacity-100'
										}`}
									>
										<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
											{s.equipment_image_url ? (
												<img
													src={s.equipment_image_url}
													alt={s.equipment_name}
													className="h-full w-full object-cover"
												/>
											) : (
												<Dumbbell className="text-sub h-4 w-4" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-main text-sm font-medium">{s.equipment_name}</p>
											<div className="text-sub mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
												<span className="text-main font-medium">{s.gym_name}</span>
												<span className="bg-sub-alt text-main rounded px-1 font-mono text-[11px] font-medium">
													×{s.quantity}
												</span>
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{formatDate(s.created_at)}
												</span>
												{s.submitted_by && <span>by {s.submitted_by}</span>}
											</div>
										</div>
										<ActionButtons
											state={state}
											onApprove={() => handleAction('suggestion', s.id, 'approve')}
											onReject={() => handleAction('suggestion', s.id, 'reject')}
										/>
									</div>
								);
							})
						)}
					</div>
				)}

				{/* Photos Tab Content */}
				{activeTab === 'photos' && (
					<div className="space-y-2">
						{photos.length === 0 ? (
							<EmptyState label="No pending photo submissions" />
						) : (
							photos.map((p) => {
								const key = `photo-${p.id}`;
								const state = actions[key];
								return (
									<div
										key={p.id}
										className={`border-border bg-surface flex items-center gap-4 rounded-2xl border p-4 transition-opacity duration-300 ${
											state === 'done' ? 'opacity-0' : 'opacity-100'
										}`}
									>
										{p.image_url ? (
											<img
												src={p.image_url}
												alt={p.name}
												className="h-14 w-14 shrink-0 rounded-xl object-cover"
											/>
										) : (
											<div className="bg-sub-alt flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
												<ImageIcon className="text-sub h-5 w-5" />
											</div>
										)}
										<div className="min-w-0 flex-1">
											<p className="text-main text-sm font-medium">
												{[p.brand, p.series, p.name].filter(Boolean).join(' ')}
											</p>
											<div className="text-sub mt-0.5 flex items-center gap-2 text-xs">
												<span className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{formatDate(p.photo_uploaded_at)}
												</span>
												{p.submitted_by && <span>by {p.submitted_by}</span>}
											</div>
										</div>
										<ActionButtons
											state={state}
											onApprove={() => handlePhotoAction(p.id, 'approve')}
											onReject={() => handlePhotoAction(p.id, 'reject')}
										/>
									</div>
								);
							})
						)}
					</div>
				)}

				{/* Users Tab Content (super_admin only) */}
				{activeTab === 'users' && isSuperAdmin && (
					<div className="space-y-2">
						{users.length === 0 ? (
							<EmptyState label="No registered user profiles found" />
						) : (
							users.map((u) => (
								<div
									key={u.id}
									className="border-border bg-surface flex items-center gap-4 rounded-2xl border p-4"
								>
									<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
										<Users className="text-sub h-4 w-4" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-main text-sm font-medium">{u.email}</p>
										<div className="mt-0.5 flex items-center gap-2">
											<RoleBadge role={u.role} />
											<span className="text-sub flex items-center gap-1 text-xs">
												<Clock className="h-3 w-3" />
												{formatDate(u.created_at)}
											</span>
										</div>
									</div>
									{u.role === 'user' && (
										<button
											onClick={() => handleMakeAdmin(u.id)}
											disabled={promotingId === u.id}
											className="border-border text-sub hover:border-main/50 hover:text-main flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-40"
										>
											<ShieldCheck className="h-3.5 w-3.5" />
											{promotingId === u.id ? 'Promoting...' : 'Make admin'}
										</button>
									)}
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}

/* ── UI Subcomponents ── */

function RoleBadge({ role }: { role: string }) {
	if (role === 'super_admin')
		return (
			<span className="rounded bg-purple-900/30 px-1.5 py-0.5 text-[10px] text-xs font-semibold uppercase tracking-wide text-purple-400">
				super admin
			</span>
		);
	if (role === 'admin')
		return (
			<span className="rounded bg-blue-900/30 px-1.5 py-0.5 text-[10px] text-xs font-semibold uppercase tracking-wide text-blue-400">
				admin
			</span>
		);
	return (
		<span className="bg-sub-alt text-sub rounded px-1.5 py-0.5 text-[10px] text-xs font-semibold uppercase tracking-wide">
			user
		</span>
	);
}

function ActionButtons({
	state,
	onApprove,
	onReject
}: {
	state?: 'approving' | 'rejecting' | 'done';
	onApprove: () => void;
	onReject: () => void;
}) {
	if (state === 'done') return <Check className="h-4 w-4 shrink-0 text-green-400" />;
	return (
		<div className="flex shrink-0 items-center gap-2">
			<button
				onClick={onReject}
				disabled={!!state}
				className="border-border text-sub flex h-8 w-8 items-center justify-center rounded-lg border transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-40"
			>
				<X className="h-3.5 w-3.5" />
			</button>
			<button
				onClick={onApprove}
				disabled={!!state}
				className="border-border text-sub flex h-8 w-8 items-center justify-center rounded-lg border transition hover:border-green-500/50 hover:text-green-400 disabled:opacity-40"
			>
				<Check className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<div className="flex w-full flex-col items-center justify-center py-16 text-center">
			<div className="bg-sub-alt mb-3 rounded-full p-4">
				<Check className="text-sub h-6 w-6" />
			</div>
			<p className="text-sub text-sm">{label}</p>
		</div>
	);
}
