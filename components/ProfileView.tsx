'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dumbbell, Trophy, Calendar, LogOut, Pencil, Check, X } from 'lucide-react';
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
		{ label: 'gyms added', value: contributions.summary.gyms_added },
		{ label: 'equipment added', value: contributions.summary.equipment_added },
		{ label: 'equipment linked', value: contributions.summary.equipment_linked },
		{ label: 'photos added', value: contributions.summary.photos_added }
	];

	const activityStats = [
		{ label: 'gyms rated', value: profile.gyms_rated ?? '—' },
		{ label: 'equipment rated', value: profile.equipment_rated ?? '—' },
		{ label: 'total contributions', value: contributions.summary.total_contributions }
	];

	const noContributions =
		contributions.recent.gyms.length === 0 &&
		contributions.recent.equipment.length === 0 &&
		contributions.recent.links.length === 0 &&
		contributions.recent.photos.length === 0;

	return (
		<div className="xs:space-y-10 space-y-8 sm:space-y-12">
			{/* ── Profile header ── */}
			<div>
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

			{/* ── Contribution counts ── */}
			<div className="flex flex-wrap gap-6 md:gap-12">
				{contributionStats.map(({ label, value }) => (
					<div key={label} className="basis-[calc(50%-0.75rem)] md:basis-auto">
						<p className="text-main text-3xl font-medium tabular-nums sm:text-4xl">{value}</p>
						<p className="text-sub mt-1 text-xs uppercase tracking-wide">{label}</p>
					</div>
				))}
			</div>

			{/* ── Best in Class ── */}
			{bestInClass.length > 0 && (
				<div className="xs:pt-10 xs:pb-12 pt-8 pb-10 sm:pt-12 sm:pb-14">
					<div className="mb-5 flex items-center justify-between">
						<p className="text-sub text-xs uppercase tracking-wide">
							Best in Class · {bestInClass.length}
						</p>

						{/* Toggle */}
						<div className="bg-main/5 flex items-center rounded-lg p-0.5">
							<button
								onClick={() => setBicTab('exercise')}
								className={`rounded-md px-3 py-1 text-xs font-medium transition ${
									bicTab === 'exercise' ? 'bg-main text-bg' : 'text-sub hover:text-main'
								}`}
							>
								Movement
							</button>
							<button
								onClick={() => setBicTab('muscle_group')}
								className={`rounded-md px-3 py-1 text-xs font-medium transition ${
									bicTab === 'muscle_group' ? 'bg-main text-bg' : 'text-sub hover:text-main'
								}`}
							>
								Muscle group
							</button>
						</div>
					</div>

					{filteredBic.length > 0 ? (
						<div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
							{filteredBic.map((b) => (
								<Link
									key={b.id}
									href={`/equipment/${b.equipment_id}`}
									className="group flex items-center gap-3 transition hover:opacity-70"
								>
									<div className="bg-sub-alt relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
										{b.image_url ? (
											<Image
												src={b.image_url}
												alt={b.equipment_name}
												fill
												sizes="96px"
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center">
												<Dumbbell className="text-sub h-6 w-6 opacity-30" />
											</div>
										)}
									</div>
									<div>
										<p className="text-sub text-[10px] uppercase tracking-wide">{b.category_name}</p>
										<p className="text-main text-sm font-medium leading-tight">
											{b.brand} {b.equipment_name}
										</p>
									</div>
								</Link>
							))}
						</div>
					) : (
						<p className="text-sub text-sm">
							No {bicTab === 'exercise' ? 'movement' : 'muscle group'} selections yet.
						</p>
					)}
				</div>
			)}

			{/* ── Gyms added ── */}
			{contributions.recent.gyms.length > 0 && (
				<div>
					<h2 className="text-sub mb-2 text-xs uppercase tracking-wide">
						Gyms added · {contributions.summary.gyms_added}
					</h2>
					<div>
						{contributions.recent.gyms.map((gym, i) => (
							<Link
								key={gym.id}
								href={`/gyms/${gym.id}`}
								className={`border-border hover:bg-sub-alt/50 flex items-center justify-between border-t py-3 transition ${
									i === contributions.recent.gyms.length - 1 ? 'border-b' : ''
								}`}
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

			{/* ── Equipment added ── */}
			{contributions.recent.equipment.length > 0 && (
				<div>
					<h2 className="text-sub mb-2 text-xs uppercase tracking-wide">
						Equipment added · {contributions.summary.equipment_added}
					</h2>
					<div>
						{contributions.recent.equipment.map((eq, i) => (
							<Link
								key={eq.id}
								href={`/equipment/${eq.id}`}
								className={`border-border hover:bg-sub-alt/50 flex items-center justify-between border-t py-3 transition ${
									i === contributions.recent.equipment.length - 1 ? 'border-b' : ''
								}`}
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

			{/* ── Photos added ── */}
			{contributions.recent.photos.length > 0 && (
				<div>
					<h2 className="text-sub mb-2 text-xs uppercase tracking-wide">
						Photos added · {contributions.summary.photos_added}
					</h2>
					<div>
						{contributions.recent.photos.map((photo, i) => (
							<Link
								key={photo.id}
								href={`/equipment/${photo.id}`}
								className={`border-border hover:bg-sub-alt/50 flex items-center justify-between gap-3 border-t py-3 transition ${
									i === contributions.recent.photos.length - 1 ? 'border-b' : ''
								}`}
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

			{/* ── Equipment linked ── */}
			{contributions.recent.links.length > 0 && (
				<div>
					<h2 className="text-sub mb-2 text-xs uppercase tracking-wide">
						Equipment linked to gyms · {contributions.summary.equipment_linked}
					</h2>
					<div>
						{contributions.recent.links.map((link, i) => (
							<div
								key={link.id}
								className={`border-border flex items-center justify-between border-t py-3 ${
									i === contributions.recent.links.length - 1 ? 'border-b' : ''
								}`}
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
			{noContributions && (
				<div className="p-10 text-center">
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
	);
}
