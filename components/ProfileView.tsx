'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
	Building2,
	Dumbbell,
	LinkIcon,
	Trophy,
	Calendar,
	ChevronRight,
	ImageIcon,
	LogOut,
	Pencil,
	Check,
	X
} from 'lucide-react';
import { BestInClass } from '@/types/bestInClass';
import { UserProfile, UserContributions } from '@/types/user';
import { useAuth } from '@/app/contexts/AuthContext';

export type ProfileViewProps = {
	profile: UserProfile;
	contributions: UserContributions;
	bestInClass: BestInClass[];
	/** Pass true when rendering inside /account/page — hides back button */
	isOwn?: boolean;
};

export default function ProfileView({
	profile,
	contributions,
	bestInClass,
	isOwn = false
}: ProfileViewProps) {
	const [bicTab, setBicTab] = useState<'exercise' | 'muscle_group'>('exercise');
	const [bicExpanded, setBicExpanded] = useState(false);
	const { logout, updateUsername } = useAuth();
	const [updatedUsername, setUpdatedUsername] = useState<string | null>(null);
	const [usernameDraft, setUsernameDraft] = useState(profile.username);
	const [editingUsername, setEditingUsername] = useState(false);
	const [savingUsername, setSavingUsername] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const displayUsername = updatedUsername ?? profile.username;

	const startUsernameEdit = () => {
		setUsernameDraft(displayUsername);
		setUsernameError(null);
		setEditingUsername(true);
	};

	const cancelUsernameEdit = () => {
		setUsernameDraft(displayUsername);
		setUsernameError(null);
		setEditingUsername(false);
	};

	const saveUsername = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const username = usernameDraft.trim();
		if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
			setUsernameError('Use 3-20 letters, numbers, or underscores.');
			return;
		}

		setSavingUsername(true);
		setUsernameError(null);
		try {
			await updateUsername(username);
			setUpdatedUsername(username);
			setUsernameDraft(username);
			setEditingUsername(false);
		} catch (err) {
			setUsernameError(err instanceof Error ? err.message : 'Failed to update username');
		} finally {
			setSavingUsername(false);
		}
	};

	const joinedDate = new Date(profile.created_at).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	const filteredBic = bestInClass.filter((b) => b.category_type === bicTab);

	const contributionStats = [
		{
			label: 'gyms added',
			value: contributions.summary.gyms_added,
			icon: Building2
		},
		{
			label: 'equipment added',
			value: contributions.summary.equipment_added,
			icon: Dumbbell
		},
		{
			label: 'equipment linked',
			value: contributions.summary.equipment_linked,
			icon: LinkIcon
		},
		{
			label: 'photos added',
			value: contributions.summary.photos_added,
			icon: ImageIcon
		}
	];

	const activityStats = [
		{ label: 'gyms rated', value: profile.gyms_rated ?? '—' },
		{ label: 'equipment rated', value: profile.equipment_rated ?? '—' },
		{ label: 'total contributions', value: contributions.summary.total_contributions }
	];

	const visibleBic = bicExpanded ? filteredBic : filteredBic.slice(0, 6);

	const bestInClassSection = bestInClass.length > 0 && (
		<div className="bg-sub-alt rounded-2xl p-5">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Trophy className="h-4 w-4 text-amber-400" />
					<h2 className="text-main text-sm font-semibold">Best in Class</h2>
					<span className="bg-main/10 text-sub rounded-full px-2 py-0.5 text-xs">
						{bestInClass.length}
					</span>
				</div>

				{/* Toggle */}
				<div className="bg-main/5 flex items-center rounded-lg p-0.5">
					<button
						onClick={() => {
							setBicTab('exercise');
							setBicExpanded(false);
						}}
						className={`rounded-md px-3 py-1 text-xs font-medium transition ${
							bicTab === 'exercise' ? 'bg-main text-bg' : 'text-sub hover:text-main'
						}`}
					>
						Movement
					</button>
					<button
						onClick={() => {
							setBicTab('muscle_group');
							setBicExpanded(false);
						}}
						className={`rounded-md px-3 py-1 text-xs font-medium transition ${
							bicTab === 'muscle_group' ? 'bg-main text-bg' : 'text-sub hover:text-main'
						}`}
					>
						Muscle group
					</button>
				</div>
			</div>

			{filteredBic.length > 0 ? (
				<>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
						{visibleBic.map((b) => (
							<Link
								key={b.id}
								href={`/equipment/${b.equipment_id}`}
								className="bg-sub-alt group flex flex-col gap-1.5 rounded-xl p-3 transition"
							>
								{b.image_url ? (
									<div className="relative mb-1 aspect-square w-full">
										<Image
											src={b.image_url}
											alt={b.equipment_name}
											fill
											sizes="(max-width: 640px) 45vw, 200px"
											className="rounded-lg object-cover"
										/>
									</div>
								) : (
									<div className="bg-main/5 mb-1 flex aspect-square w-full items-center justify-center rounded-lg">
										<Dumbbell className="text-sub h-6 w-6 opacity-30" />
									</div>
								)}
								<p className="text-sub text-[10px] uppercase tracking-wide">{b.category_name}</p>
								<div className="flex items-center justify-between">
									<p className="text-main text-xs font-medium leading-tight">
										{b.brand} {b.equipment_name}
									</p>
									<ChevronRight className="text-sub h-3 w-3 opacity-0 transition group-hover:opacity-100" />
								</div>
							</Link>
						))}
					</div>
					{filteredBic.length > 6 && (
						<button
							onClick={() => setBicExpanded((prev) => !prev)}
							className="text-sub hover:text-main mt-3 w-full text-center text-xs transition"
						>
							{bicExpanded ? 'Show less' : `Show all ${filteredBic.length}`}
						</button>
					)}
				</>
			) : (
				<p className="text-sub text-sm">
					No {bicTab === 'exercise' ? 'movement' : 'muscle group'} selections yet.
				</p>
			)}
		</div>
	);

	return (
		<div className="space-y-4">
			{/* ── Profile header ── */}
			<div className="bg-sub-alt rounded-2xl p-5">
				<div className="flex items-start justify-between gap-4">
					{/* Avatar + identity */}
					<div className="flex items-center gap-4">
						<div className="bg-main/10 text-main flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
							{displayUsername.slice(0, 2).toUpperCase()}
						</div>
						<div className="min-w-0">
							{editingUsername && isOwn ? (
								<form onSubmit={saveUsername} className="flex items-center gap-1.5">
									<input
										autoFocus
										value={usernameDraft}
										onChange={(event) => setUsernameDraft(event.target.value)}
										maxLength={20}
										disabled={savingUsername}
										aria-label="Username"
										className="border-border bg-main/5 text-main h-8 w-44 rounded-md border px-2 text-base font-semibold outline-none focus:border-white/60"
									/>
									<button
										type="submit"
										disabled={savingUsername}
										aria-label="Save username"
										title="Save username"
										className="text-sub hover:text-main disabled:text-sub/40 grid h-8 w-8 place-items-center transition"
									>
										<Check className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={cancelUsernameEdit}
										disabled={savingUsername}
										aria-label="Cancel username edit"
										title="Cancel"
										className="text-sub hover:text-main disabled:text-sub/40 grid h-8 w-8 place-items-center transition"
									>
										<X className="h-4 w-4" />
									</button>
								</form>
							) : (
								<div className="flex items-center gap-1.5">
									<h1 className="text-main text-xl font-semibold leading-none">{displayUsername}</h1>
									{isOwn && (
										<button
											type="button"
											onClick={startUsernameEdit}
											aria-label="Edit username"
											title="Edit username"
											className="text-sub hover:text-main grid h-7 w-7 place-items-center transition"
										>
											<Pencil className="h-3.5 w-3.5" />
										</button>
									)}
								</div>
							)}
							<div className="text-sub mt-1.5 flex items-center gap-1.5 text-sm">
								<Calendar className="h-3.5 w-3.5" />
								<span>Joined {joinedDate}</span>
							</div>
							{usernameError && <p className="mt-1 text-xs text-red-400">{usernameError}</p>}
						</div>
					</div>

					<button
						onClick={logout}
						className="text-sub hover:text-main flex items-center gap-1.5 text-sm transition"
					>
						<LogOut className="h-4 w-4" /> Sign out
					</button>

					{/* Rank badge */}
					{profile.leaderboard_rank != null && (
						<div className="bg-main/10 rounded-xl px-5 py-3 text-center">
							<p className="text-sub mb-0.5 text-[10px] uppercase tracking-widest">Rank</p>
							<p className="text-main text-2xl font-bold">#{profile.leaderboard_rank}</p>
						</div>
					)}
				</div>

				{/* Activity stats row */}
				<div className="border-border/30 mt-4 flex items-center gap-8 border-t pt-4">
					{activityStats.map(({ label, value }) => (
						<div key={label}>
							<p className="text-main text-xl font-semibold">{value}</p>
							<p className="text-sub mt-0.5 text-xs">{label}</p>
						</div>
					))}
				</div>
			</div>

			{!isOwn && bestInClassSection}

			{/* ── Contribution counts ── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{contributionStats.map(({ label, value, icon: Icon }) => (
					<div key={label} className="bg-sub-alt rounded-2xl p-4">
						<div className="text-sub mb-1 flex items-center gap-1.5 text-xs">
							<Icon className="h-3.5 w-3.5" />
							<span className="text-sub">{label}</span>
						</div>
						<p className="text-main text-2xl font-semibold">{value}</p>
					</div>
				))}
			</div>

			{isOwn && bestInClassSection}

			{/* ── Recent contributions ── */}
			<div className="space-y-3">
				{/* Gyms added */}
				{contributions.recent.gyms.length > 0 && (
					<div className="bg-sub-alt rounded-2xl p-4">
						<div className="mb-3 flex items-center gap-2">
							<Building2 className="text-sub h-3.5 w-3.5" />
							<h2 className="text-main text-sm font-semibold">Gyms added</h2>
							<span className="bg-main/10 text-sub rounded-full px-2 py-0.5 text-xs">
								{contributions.summary.gyms_added}
							</span>
						</div>
						<div className="space-y-0.5">
							{contributions.recent.gyms.map((gym) => (
								<Link
									key={gym.id}
									href={`/gyms/${gym.id}`}
									className="hover:bg-main/5 flex items-center justify-between rounded-lg px-3 py-2 transition"
								>
									<div>
										<p className="text-main text-sm">{gym.name}</p>
										{(gym.city || gym.country) && (
											<p className="text-sub text-xs">
												{[gym.city, gym.country].filter(Boolean).join(', ')}
											</p>
										)}
									</div>
									<span className="text-sub text-xs">
										{new Date(gym.created_at).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short'
										})}
									</span>
								</Link>
							))}
						</div>
					</div>
				)}

				{/* Equipment added */}
				{contributions.recent.equipment.length > 0 && (
					<div className="bg-sub-alt rounded-2xl p-4">
						<div className="mb-3 flex items-center gap-2">
							<Dumbbell className="text-sub h-3.5 w-3.5" />
							<h2 className="text-main text-sm font-semibold">Equipment added</h2>
							<span className="bg-main/10 text-sub rounded-full px-2 py-0.5 text-xs">
								{contributions.summary.equipment_added}
							</span>
						</div>
						<div className="space-y-0.5">
							{contributions.recent.equipment.map((eq) => (
								<Link
									key={eq.id}
									href={`/equipment/${eq.id}`}
									className="hover:bg-main/5 flex items-center justify-between rounded-lg px-3 py-2 transition"
								>
									<p className="text-main text-sm">
										{[eq.brand, eq.series, eq.name].filter(Boolean).join(' ')}
									</p>
									<span className="text-sub text-xs">
										{new Date(eq.created_at).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short'
										})}
									</span>
								</Link>
							))}
						</div>
					</div>
				)}

				{/* Photos added */}
				{contributions.recent.photos.length > 0 && (
					<div className="bg-sub-alt rounded-2xl p-4">
						<div className="mb-3 flex items-center gap-2">
							<ImageIcon className="text-sub h-3.5 w-3.5" />
							<h2 className="text-main text-sm font-semibold">Photos added</h2>
							<span className="bg-main/10 text-sub rounded-full px-2 py-0.5 text-xs">
								{contributions.summary.photos_added}
							</span>
						</div>
						<div className="space-y-0.5">
							{contributions.recent.photos.map((photo) => (
								<Link
									key={photo.id}
									href={`/equipment/${photo.id}`}
									className="hover:bg-main/5 flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition"
								>
									<div className="flex min-w-0 items-center gap-3">
										{photo.image_url && (
											<Image
												src={photo.image_url}
												alt={photo.name}
												width={32}
												height={32}
												className="h-8 w-8 shrink-0 rounded object-cover"
											/>
										)}
										<p className="text-main truncate text-sm">
											{[photo.brand, photo.series, photo.name].filter(Boolean).join(' ')}
										</p>
									</div>
									<span className="text-sub shrink-0 text-xs">
										{new Date(photo.uploaded_at).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short'
										})}
									</span>
								</Link>
							))}
						</div>
					</div>
				)}

				{/* Equipment linked */}
				{contributions.recent.links.length > 0 && (
					<div className="bg-sub-alt rounded-2xl p-4">
						<div className="mb-3 flex items-center gap-2">
							<LinkIcon className="text-sub h-3.5 w-3.5" />
							<h2 className="text-main text-sm font-semibold">Equipment linked to gyms</h2>
							<span className="bg-main/10 text-sub rounded-full px-2 py-0.5 text-xs">
								{contributions.summary.equipment_linked}
							</span>
						</div>
						<div className="space-y-0.5">
							{contributions.recent.links.map((link) => (
								<div
									key={link.id}
									className="hover:bg-main/5 flex items-center justify-between rounded-lg px-3 py-2 transition"
								>
									<div>
										<p className="text-main text-sm">{link.equipment_name}</p>
										<p className="text-sub text-xs">{link.gym_name}</p>
									</div>
									<span className="text-sub text-xs">
										{new Date(link.created_at).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short'
										})}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Empty state */}
				{contributions.recent.gyms.length === 0 &&
					contributions.recent.equipment.length === 0 &&
					contributions.recent.links.length === 0 &&
					contributions.recent.photos.length === 0 && (
						<div className="bg-sub-alt rounded-2xl p-10 text-center">
							<Trophy className="text-sub mx-auto mb-3 h-10 w-10 opacity-20" />
							<p className="text-main mb-1 text-sm font-medium">No contributions yet</p>
							<p className="text-sub text-xs">
								{isOwn
									? 'Start adding gyms and equipment to the atlas'
									: "This user hasn't added any content yet"}
							</p>
						</div>
					)}
			</div>
		</div>
	);
}
