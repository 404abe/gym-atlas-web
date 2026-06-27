'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Dumbbell, Minus, LayoutGrid, List, Plus, Navigation, Check, X, Loader2, Clock } from 'lucide-react';
import {
	fetchGymById,
	fetchGymEquipment,
	fetchAllEquipment,
	favouriteGym,
	unfavouriteGym,
	uploadGymImage,
	updateGymInstagram,
	submitGymFreeWeights,
	removeGymEquipment
} from '@/lib/api';
import { Gym, GymEquipment, GymFreeWeightsInput } from '@/types/gym';
import type { Equipment } from '@/types/equipment';
import { FaInstagram } from 'react-icons/fa';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { useToastContext } from '@/app/contexts/ToastContext';
import AddEquipmentPanel from '@/app/add/_components/AddEquipmentPanel';
import { getOpenStatus } from '@/lib/openingHours';

const FREE_WEIGHT_DEFAULTS: GymFreeWeightsInput = {
	dumbbell_min_kg: null,
	dumbbell_max_kg: null,
	dumbbell_racks: 0,
	squat_racks: 0,
	flat_benches: 0,
	incline_benches: 0,
	platforms: 0,
	preacher_curl_stations: 0
};

export default function GymProfilePage() {
	const { id } = useParams();
	const router = useRouter();
	const { user } = useAuth();
	const { requireAuth } = useAuthGate();
	const { addToast } = useToastContext();

	const [gym, setGym] = useState<Gym | null>(null);
	const [equipment, setEquipment] = useState<GymEquipment[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFavorite, setIsFavorite] = useState(false);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [showAddPanel, setShowAddPanel] = useState(false);
	const [masterEquipment, setMasterEquipment] = useState<Equipment[]>([]);
	const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);
	const [equipmentView, setEquipmentView] = useState<'grid' | 'compact'>('grid');

	// Instagram suggestion (for gyms with no handle yet) — staged for admin review.
	const [instaOpen, setInstaOpen] = useState(false);
	const [instaValue, setInstaValue] = useState('');
	const [instaSubmitting, setInstaSubmitting] = useState(false);
	const [instaSubmitted, setInstaSubmitted] = useState(false);
	const [freeWeightsOpen, setFreeWeightsOpen] = useState(false);
	const [freeWeightsForm, setFreeWeightsForm] = useState<GymFreeWeightsInput>(FREE_WEIGHT_DEFAULTS);
	const [freeWeightsSubmitting, setFreeWeightsSubmitting] = useState(false);
	const [freeWeightsSubmitted, setFreeWeightsSubmitted] = useState(false);

	useEffect(() => {
		const load = async () => {
			try {
				const [gymData, equipmentData, masterData] = await Promise.all([
					fetchGymById(Number(id)),
					fetchGymEquipment(Number(id)),
					fetchAllEquipment()
				]);
				setMasterEquipment(masterData as Equipment[]);
				setGym(gymData);
				setEquipment(equipmentData);
				setIsFavorite(gymData.is_favorite ?? false);
				setImageUrl(gymData.image_url || null);
				setFreeWeightsForm({
					dumbbell_min_kg: gymData.free_weights?.dumbbell_min_kg ?? null,
					dumbbell_max_kg: gymData.free_weights?.dumbbell_max_kg ?? null,
					dumbbell_racks: gymData.free_weights?.dumbbell_racks ?? 0,
					squat_racks: gymData.free_weights?.squat_racks ?? 0,
					flat_benches: gymData.free_weights?.flat_benches ?? 0,
					incline_benches: gymData.free_weights?.incline_benches ?? 0,
					platforms: gymData.free_weights?.platforms ?? 0,
					preacher_curl_stations: gymData.free_weights?.preacher_curl_stations ?? 0
				});
			} catch (err) {
				console.error('Failed to load gym:', err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [id]);

	const handleFavorite = async () => {
		setIsFavorite((prev) => !prev);
		try {
			if (isFavorite) await unfavouriteGym(Number(id));
			else await favouriteGym(Number(id));
		} catch (err) {
			console.error('Failed to toggle favourite:', err);
			setIsFavorite((prev) => !prev);
		}
	};

	const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

	const handleRemove = (equipmentId: number) => {
		setPendingRemoveId(equipmentId);
	};

	const confirmRemove = async () => {
		if (pendingRemoveId === null) return;
		const equipmentId = pendingRemoveId;
		setPendingRemoveId(null);
		setEquipment((prev) =>
			prev
				.map((item) =>
					item.equipment_id === equipmentId ? { ...item, quantity: item.quantity - 1 } : item
				)
				.filter((item) => item.quantity > 0)
		);
		try {
			await removeGymEquipment(Number(id), equipmentId);
		} catch (err) {
			console.error('Failed to remove equipment:', err);
			fetchGymEquipment(Number(id)).then(setEquipment).catch(console.error);
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			setUploading(true);
			const url = await uploadGymImage(Number(id), file);
			setImageUrl(url);
		} catch (err) {
			console.error('Failed to upload image:', err);
		} finally {
			setUploading(false);
		}
	};

	const displayFreeWeights = gym?.free_weights ?? FREE_WEIGHT_DEFAULTS;
	const dumbbellRange =
		displayFreeWeights.dumbbell_min_kg != null && displayFreeWeights.dumbbell_max_kg != null
			? `${displayFreeWeights.dumbbell_min_kg}-${displayFreeWeights.dumbbell_max_kg}kg`
			: 'unknown';

	const setFreeWeightValue = (key: keyof GymFreeWeightsInput, value: number | null) => {
		setFreeWeightsForm((prev) => ({ ...prev, [key]: value }));
		setFreeWeightsSubmitted(false);
	};

	const adjustFreeWeightValue = (key: keyof GymFreeWeightsInput, delta: number) => {
		setFreeWeightsForm((prev) => {
			const current = Number(prev[key] ?? 0);
			return { ...prev, [key]: Math.max(0, current + delta) };
		});
		setFreeWeightsSubmitted(false);
	};

	const handleSubmitFreeWeights = async () => {
		if (!requireAuth('submit free weights')) return;
		try {
			setFreeWeightsSubmitting(true);
			await submitGymFreeWeights(Number(id), freeWeightsForm);
			setFreeWeightsSubmitted(true);
			setFreeWeightsOpen(false);
			addToast('Free weights update submitted for review', 'success');
		} catch (err) {
			console.error('Failed to submit free weights:', err);
			addToast('Failed to submit free weights', 'error');
		} finally {
			setFreeWeightsSubmitting(false);
		}
	};

	const openInstagramEditor = () => {
		if (!requireAuth('suggest an Instagram')) return;
		setInstaOpen(true);
	};

	const handleSubmitInstagram = async () => {
		const handle = instaValue.trim().replace(/^@/, '');
		if (!handle || instaSubmitting) return;
		setInstaSubmitting(true);
		try {
			await updateGymInstagram(Number(id), handle);
			setInstaSubmitted(true);
			setInstaOpen(false);
			setInstaValue('');
			addToast('Instagram suggestion submitted for review', 'success');
		} catch (err) {
			console.error('Failed to submit Instagram:', err);
			addToast('Failed to submit Instagram', 'error');
		} finally {
			setInstaSubmitting(false);
		}
	};

	if (loading) return <div className="p-8 text-sm">Loading...</div>;
	if (!gym) return <div className="p-8 text-sm">Gym not found.</div>;

	const avgRating = gym.rating ? Number(gym.rating) : null;
	const fullAddress = [gym.address, gym.city, gym.country].filter(Boolean).join(', ');
	const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

	const openStatus = getOpenStatus(gym.opening_hours);

	// ── Hero ── image-first; gym name, location, address + socials overlaid
	const Hero = () => (
		<div className="bg-sub-alt relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-auto sm:h-90">
			{imageUrl ? (
				<img src={imageUrl} alt={gym.name} className="h-full w-full object-cover" />
			) : (
				<div className="flex h-full w-full items-center justify-center">
					<Dumbbell className="text-sub h-12 w-12 opacity-30" />
				</div>
			)}

			{uploading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/40">
					<span className="text-xs text-white">Uploading...</span>
				</div>
			)}

			{/* Photo control — top left */}
			{user ? (
				<label className="absolute left-3 top-3 cursor-pointer">
					<div className="bg-surface/80 text-sub hover:text-main rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm transition">
						{uploading ? 'Uploading...' : imageUrl ? 'Change photo' : 'Add photo'}
					</div>
					<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
				</label>
			) : (
				<button
					onClick={() => requireAuth('add a photo')}
					className="bg-surface/80 text-sub hover:text-main absolute left-3 top-3 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm transition"
				>
					{imageUrl ? 'Change photo' : 'Add photo'}
				</button>
			)}

			{/* Favourite — top right */}
			<div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur-sm">
				<FavoriteButton isFavorite={isFavorite} onToggle={handleFavorite} />
			</div>

			{/* Detail overlay — bottom */}
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
				{(gym.city || gym.country) && (
					<p className="text-xs text-white/70">
						{[gym.city, gym.country].filter(Boolean).join(' · ')}
					</p>
				)}
				<h1 className="mt-1 text-2xl font-semibold leading-tight text-white">{gym.name}</h1>
				{fullAddress && (
					<div className="mt-2 flex items-start gap-1.5 text-sm text-white/85">
						<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
						<span>{fullAddress}</span>
					</div>
				)}
				<div className="mt-3 flex flex-wrap gap-2">
					{fullAddress && (
						<a
							href={mapHref}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition hover:bg-white/25"
						>
							<Navigation className="h-3 w-3" />
							Directions
						</a>
					)}
					{gym.instagram && (
						<a
							href={`https://instagram.com/${gym.instagram}`}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition hover:bg-white/25"
						>
							<FaInstagram className="h-3 w-3" />
							Instagram
						</a>
					)}

					{/* No Instagram yet — let users suggest one (staged for admin review) */}
					{!gym.instagram && !instaSubmitted && !instaOpen && (
						<button
							onClick={openInstagramEditor}
							className="flex items-center gap-1.5 rounded-full border border-dashed border-white/40 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm transition hover:bg-white/15 hover:text-white"
						>
							<FaInstagram className="h-3 w-3" />
							Add Instagram
						</button>
					)}

					{!gym.instagram && !instaSubmitted && instaOpen && (
						<div className="flex items-center gap-1 rounded-full border border-white/25 bg-white/15 py-1 pl-3 pr-1 text-xs text-white backdrop-blur-sm">
							<FaInstagram className="h-3 w-3 shrink-0" />
							<span className="text-white/50">@</span>
							<input
								value={instaValue}
								onChange={(e) => setInstaValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmitInstagram();
									if (e.key === 'Escape') {
										setInstaOpen(false);
										setInstaValue('');
									}
								}}
								autoFocus
								placeholder="handle"
								spellCheck={false}
								className="w-24 bg-transparent text-white outline-none placeholder:text-white/40"
							/>
							<button
								onClick={handleSubmitInstagram}
								disabled={instaSubmitting || !instaValue.trim()}
								aria-label="Submit Instagram"
								className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 disabled:opacity-40"
							>
								{instaSubmitting ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<Check className="h-3 w-3" />
								)}
							</button>
							<button
								onClick={() => {
									setInstaOpen(false);
									setInstaValue('');
								}}
								aria-label="Cancel"
								className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/20"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					)}

					{!gym.instagram && instaSubmitted && (
						<span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
							<FaInstagram className="h-3 w-3" />
							Instagram pending review
						</span>
					)}
				</div>
				{openStatus && (
					<div className={`mt-2.5 flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
						openStatus.status === 'open'
							? 'bg-[#0d2e1a] border-[#1a4a28] text-[#4ade80]'
							: openStatus.status === 'closing_soon'
							? 'bg-[#2a1a0d] border-[#4a2e10] text-[#fb923c]'
							: 'bg-[#2a1010] border-[#4a2020] text-[#f87171]'
					}`}>
						<Clock className="h-3 w-3 shrink-0" />
						<span>{openStatus.label}</span>
					</div>
				)}
			</div>
		</div>
	);

	const EquipmentList = () => {
		const sortedEquipment = [...equipment].sort((a, b) => {
			if (a.image_url && !b.image_url) return -1;
			if (!a.image_url && b.image_url) return 1;
			return 0;
		});
		return (
		<div>
			{equipment.length === 0 ? (
				<p className="text-sub text-sm">No equipment listed yet.</p>
			) : equipmentView === 'grid' ? (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					{sortedEquipment.map((item) => {
						const isPending = item.status === 'pending';
						return (
							<button
								key={item.equipment_id}
								onClick={() => !isPending && router.push(`/equipment/${item.equipment_id}`)}
								className={`bg-sub-alt group relative flex flex-col gap-1.5 rounded-xl p-3 text-left transition ${
									isPending ? 'cursor-default opacity-50' : ''
								}`}
							>
								{item.image_url ? (
									<img
										src={item.image_url}
										alt={item.full_name}
										className="bg-main/5 mb-1 aspect-video w-full rounded-lg object-contain"
									/>
								) : (
									<div className="bg-main/5 mb-1 flex aspect-video w-full items-center justify-center rounded-lg">
										<Dumbbell className="text-sub h-5 w-5 opacity-30" />
									</div>
								)}
								<p className="text-sub text-[10px] uppercase tracking-wide">
									{item.brand} · {item.series}
								</p>
								<div className="flex items-center justify-between gap-1">
									<p className="text-main min-w-0 flex-1 truncate text-xs font-medium leading-tight">
										{item.name}
									</p>
									<div className="flex shrink-0 items-center gap-1">
										{isPending ? (
											<span className="text-sub bg-main/10 rounded-full px-1.5 py-0.5 text-[9px]">
												Pending
											</span>
										) : (
											<>
												<span className="text-sub bg-main/10 rounded-full px-1.5 py-0.5 text-[10px]">
													×{item.quantity}
												</span>
												{isAdmin && (
													<span
														role="button"
														onClick={(e) => {
															e.stopPropagation();
															handleRemove(item.equipment_id);
														}}
														className="text-sub transition hover:text-red-400"
														aria-label="Remove one"
													>
														<Minus className="h-3 w-3" />
													</span>
												)}
											</>
										)}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			) : (
				<div className="divide-border divide-y">
					{sortedEquipment.map((item) => {
						const isPending = item.status === 'pending';
						return (
							<div
								key={item.equipment_id}
								className={`-mx-4 flex w-[calc(100%+2rem)] items-center gap-3 px-4 py-2.5 transition ${
									isPending ? 'opacity-50' : 'hover:bg-main/5'
								}`}
							>
								<div className="bg-main/5 h-9 w-9 shrink-0 overflow-hidden rounded-lg">
									{item.image_url ? (
										<img
											src={item.image_url}
											alt={item.full_name}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<Dumbbell className="text-sub h-4 w-4 opacity-30" />
										</div>
									)}
								</div>
								<button
									className="min-w-0 flex-1 text-left"
									disabled={isPending}
									onClick={() => !isPending && router.push(`/equipment/${item.equipment_id}`)}
								>
									<p className="text-main text-sm font-medium">{item.full_name}</p>
									<p className="text-sub text-xs">
										{item.brand} · {item.series}
									</p>
								</button>
								<div className="flex shrink-0 items-center gap-2">
									{isPending ? (
										<span className="text-sub bg-main/10 rounded-full px-2 py-0.5 text-[9px]">
											Pending
										</span>
									) : (
										<>
											<span className="text-sub bg-main/10 rounded-full px-2.5 py-0.5 text-xs">
												×{item.quantity}
											</span>
											{isAdmin && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleRemove(item.equipment_id);
													}}
													className="text-sub transition hover:text-red-400"
													aria-label="Remove one"
												>
													<Minus className="h-3.5 w-3.5" />
												</button>
											)}
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
	};

	return (
		<>
			<div id="pageGymProfile" className="content-grid py-8">
				<div className="full-width-padding mx-auto w-full max-w-4xl">
					<div className="flex flex-col gap-3">
						<Hero />

						{/* ── Stats ── */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
								<p className="text-sub text-[11px]">Rating</p>
								<p className="text-main text-xl font-semibold">
									{avgRating ? avgRating.toFixed(1) : '—'}
								</p>
								{avgRating && (
									<div className="flex gap-0.5">
										{[1, 2, 3, 4, 5].map((s) => (
											<Star
												key={s}
												className={`h-2.5 w-2.5 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-sub'}`}
											/>
										))}
									</div>
								)}
							</div>
							<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
								<p className="text-sub text-[11px]">Favourites</p>
								<p className="text-main text-xl font-semibold">{gym.favourites ?? 0}</p>
							</div>
							<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
								<p className="text-sub text-[11px]">Equipment</p>
								<p className="text-main text-xl font-semibold">{gym.total_equipment}</p>
							</div>
							<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
								<p className="text-sub text-[11px]">Unique</p>
								<p className="text-main text-xl font-semibold">{gym.unique_machines}</p>
							</div>
						</div>

						<details className="group border-border bg-sub-alt rounded-2xl border">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
								<div>
									<h2 className="text-main text-sm font-semibold">Free Weights</h2>
									<p className="text-sub text-xs">Racks, benches, and dumbbell range</p>
								</div>
								<div className="flex items-center gap-2">
									<div className="border-border bg-bg/40 rounded-xl border px-3 py-2 text-right">
										<p className="text-sub text-[10px] uppercase">Dumbbells</p>
										<p className="text-main text-sm font-semibold">{dumbbellRange}</p>
									</div>
									<span className="border-border bg-bg/40 text-main hidden rounded-full border px-2.5 py-1 text-xs transition group-open:hidden sm:inline">
										View details
									</span>
								</div>
							</summary>
							<div className="border-border border-t px-4 pb-4 pt-3">
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
									<FreeWeightStat label="Dumbbell Racks" value={displayFreeWeights.dumbbell_racks} />
									<FreeWeightStat label="Squat Racks" value={displayFreeWeights.squat_racks} />
									<FreeWeightStat label="Flat Benches" value={displayFreeWeights.flat_benches} />
									<FreeWeightStat label="Incline Benches" value={displayFreeWeights.incline_benches} />
								</div>
								<div className="mt-2 flex flex-wrap gap-2">
									<span className="border-border text-sub rounded-full border px-2.5 py-1 text-xs">
										{displayFreeWeights.platforms} Platforms
									</span>
									<span className="border-border text-sub rounded-full border px-2.5 py-1 text-xs">
										{displayFreeWeights.preacher_curl_stations} Preacher Curl Stations
									</span>
									{gym.free_weights?.verified && (
										<span className="border-border text-sub rounded-full border px-2.5 py-1 text-xs">
											Free Weight Area Verified
										</span>
									)}
								</div>
								<div className="mt-3 flex flex-wrap items-center gap-2">
									<button
										type="button"
										onClick={() => {
											if (!requireAuth('submit free weights')) return;
											setFreeWeightsOpen((prev) => !prev);
										}}
										className="border-border text-main hover:bg-main/5 rounded-full border px-3 py-1.5 text-xs transition"
									>
										{freeWeightsOpen ? 'Cancel edit' : gym.free_weights ? 'Suggest correction' : 'Add free weights'}
									</button>
									{freeWeightsSubmitted && (
										<span className="text-xs text-[#3ee7a6]">Submitted for review</span>
									)}
								</div>
								{freeWeightsOpen && (
									<div className="border-border mt-3 rounded-xl border bg-bg/30 p-3">
										<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
											<CounterField label="Dumbbell min kg" value={freeWeightsForm.dumbbell_min_kg ?? 0} onChange={(value) => setFreeWeightValue('dumbbell_min_kg', value)} onAdjust={(delta) => adjustFreeWeightValue('dumbbell_min_kg', delta)} />
											<CounterField label="Dumbbell max kg" value={freeWeightsForm.dumbbell_max_kg ?? 0} onChange={(value) => setFreeWeightValue('dumbbell_max_kg', value)} onAdjust={(delta) => adjustFreeWeightValue('dumbbell_max_kg', delta)} />
											<CounterField label="Dumbbell racks" value={freeWeightsForm.dumbbell_racks} onChange={(value) => setFreeWeightValue('dumbbell_racks', value)} onAdjust={(delta) => adjustFreeWeightValue('dumbbell_racks', delta)} />
											<CounterField label="Squat racks" value={freeWeightsForm.squat_racks} onChange={(value) => setFreeWeightValue('squat_racks', value)} onAdjust={(delta) => adjustFreeWeightValue('squat_racks', delta)} />
											<CounterField label="Flat benches" value={freeWeightsForm.flat_benches} onChange={(value) => setFreeWeightValue('flat_benches', value)} onAdjust={(delta) => adjustFreeWeightValue('flat_benches', delta)} />
											<CounterField label="Incline benches" value={freeWeightsForm.incline_benches} onChange={(value) => setFreeWeightValue('incline_benches', value)} onAdjust={(delta) => adjustFreeWeightValue('incline_benches', delta)} />
											<CounterField label="Platforms" value={freeWeightsForm.platforms} onChange={(value) => setFreeWeightValue('platforms', value)} onAdjust={(delta) => adjustFreeWeightValue('platforms', delta)} />
											<CounterField label="Preacher curl stations" value={freeWeightsForm.preacher_curl_stations} onChange={(value) => setFreeWeightValue('preacher_curl_stations', value)} onAdjust={(delta) => adjustFreeWeightValue('preacher_curl_stations', delta)} />
										</div>
										<div className="mt-3 flex justify-end">
											<button
												type="button"
												onClick={handleSubmitFreeWeights}
												disabled={freeWeightsSubmitting}
												className="bg-main text-bg hover:opacity-90 disabled:opacity-60 rounded-full px-4 py-2 text-xs font-medium transition"
											>
												{freeWeightsSubmitting ? 'Submitting...' : 'Submit for review'}
											</button>
										</div>
									</div>
								)}
							</div>
						</details>

						{/* ── Equipment ── */}
						<div className="bg-surface rounded-2xl p-4">
							<div className="mb-3 flex items-center justify-between">
								<h2 className="text-main text-sm font-semibold">Equipment ({equipment.length})</h2>
								<div className="flex items-center gap-1">
									<div className="bg-main/5 flex items-center rounded-lg p-0.5">
										<button
											onClick={() => setEquipmentView('grid')}
											className={`rounded-md p-1.5 transition ${equipmentView === 'grid' ? 'bg-main text-bg' : 'text-sub hover:text-main'}`}
											aria-label="Grid view"
										>
											<LayoutGrid className="h-3 w-3" />
										</button>
										<button
											onClick={() => setEquipmentView('compact')}
											className={`rounded-md p-1.5 transition ${equipmentView === 'compact' ? 'bg-main text-bg' : 'text-sub hover:text-main'}`}
											aria-label="Compact view"
										>
											<List className="h-3 w-3" />
										</button>
									</div>
									{user && (
										<button
											onClick={() => setShowAddPanel((v) => !v)}
											className="text-sub hover:text-main hover:bg-main/5 flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition"
										>
											<Plus className="h-3.5 w-3.5" />
											Add
										</button>
									)}
								</div>
							</div>
							{showAddPanel && (
								<AddEquipmentPanel
									gymId={Number(id)}
									masterEquipment={masterEquipment}
									existingEquipment={equipment}
									onEquipmentAdded={(item) =>
										setEquipment((prev) => {
											const existing = prev.find(
												(e) => e.equipment_id === item.equipment_id
											);
											if (!existing) return [...prev, item];
											if (item.status === 'approved') {
												return prev.map((e) =>
													e.equipment_id === item.equipment_id
														? { ...e, quantity: e.quantity + item.quantity }
														: e
												);
											}
											// pending on an already-listed machine — quantity unchanged
											return prev;
										})
									}
									onClose={() => setShowAddPanel(false)}
								/>
							)}
							<EquipmentList />
						</div>
					</div>
				</div>
			</div>

			{/* Remove equipment confirmation modal */}
			{pendingRemoveId !== null && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
					onClick={() => setPendingRemoveId(null)}
				>
					<div
						className="bg-bg border-border w-full max-w-sm rounded-2xl border p-5 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<h2 className="text-main mb-1 text-sm font-semibold">Remove one from {gym?.name}?</h2>
						<p className="text-main mb-1 text-sm font-medium">
							{equipment.find((e) => e.equipment_id === pendingRemoveId)?.full_name}
						</p>
						<p className="text-sub mb-5 text-xs">
							This will reduce the quantity by 1. If quantity reaches 0 it will be removed from this
							gym.
						</p>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setPendingRemoveId(null)}
								className="border-border text-sub hover:text-main rounded-lg border px-4 py-1.5 text-sm transition"
							>
								Cancel
							</button>
							<button
								onClick={confirmRemove}
								className="rounded-lg bg-red-500/90 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-500"
							>
								Remove
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function FreeWeightStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="border-border bg-bg/30 rounded-xl border px-3 py-2">
			<p className="text-sub text-[11px]">{label}</p>
			<p className="text-main text-base font-semibold">{value}</p>
		</div>
	);
}

function CounterField({
	label,
	value,
	onChange,
	onAdjust
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	onAdjust: (delta: number) => void;
}) {
	return (
		<label className="border-border bg-bg/40 rounded-xl border px-3 py-2">
			<span className="text-sub block text-[11px]">{label}</span>
			<div className="mt-1 flex items-center gap-2">
				<button
					type="button"
					onClick={() => onAdjust(-1)}
					className="border-border text-sub hover:text-main grid h-7 w-7 place-items-center rounded-lg border"
					aria-label={`Decrease ${label}`}
				>
					<Minus className="h-3.5 w-3.5" />
				</button>
				<input
					type="number"
					min={0}
					max={999}
					value={value}
					onChange={(event) => onChange(Math.max(0, Number(event.target.value || 0)))}
					className="bg-bg text-main border-border h-7 min-w-0 flex-1 rounded-lg border px-2 text-center text-sm font-semibold outline-none focus:border-main"
				/>
				<button
					type="button"
					onClick={() => onAdjust(1)}
					className="border-border text-sub hover:text-main grid h-7 w-7 place-items-center rounded-lg border"
					aria-label={`Increase ${label}`}
				>
					<Plus className="h-3.5 w-3.5" />
				</button>
			</div>
		</label>
	);
}
