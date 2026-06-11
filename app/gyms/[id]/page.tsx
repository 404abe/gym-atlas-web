'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Dumbbell, Minus, LayoutGrid, List, Plus, Navigation } from 'lucide-react';
import {
	fetchGymById,
	fetchGymEquipment,
	fetchAllEquipment,
	favouriteGym,
	unfavouriteGym,
	uploadGymImage,
	removeGymEquipment
} from '@/lib/api';
import { Gym, GymEquipment } from '@/types/gym';
import type { Equipment } from '@/types/equipment';
import { FaInstagram } from 'react-icons/fa';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useAuth } from '@/app/contexts/AuthContext';
import AddEquipmentPanel from '@/app/add/_components/AddEquipmentPanel';

export default function GymProfilePage() {
	const { id } = useParams();
	const router = useRouter();
	const { user } = useAuth();

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

	if (loading) return <div className="p-8 text-sm">Loading...</div>;
	if (!gym) return <div className="p-8 text-sm">Gym not found.</div>;

	const avgRating = gym.rating ? Number(gym.rating) : null;
	const fullAddress = [gym.address, gym.city, gym.country].filter(Boolean).join(', ');
	const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

	// ── Hero ── image-first; gym name, location, address + socials overlaid
	const Hero = () => (
		<div className="border-border bg-sub-alt relative aspect-[4/3] w-full overflow-hidden rounded-2xl border sm:aspect-[16/9]">
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
			{user && (
				<label className="absolute left-3 top-3 cursor-pointer">
					<div className="border-border bg-surface/80 text-sub hover:text-main rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm transition">
						{uploading ? 'Uploading...' : imageUrl ? 'Change photo' : 'Add photo'}
					</div>
					<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
				</label>
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
				</div>
			</div>
		</div>
	);

	const EquipmentList = () => (
		<div>
			{equipment.length === 0 ? (
				<p className="text-sub text-sm">No equipment listed yet.</p>
			) : equipmentView === 'grid' ? (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					{equipment.map((item) => (
						<button
							key={item.equipment_id}
							onClick={() => router.push(`/equipment/${item.equipment_id}`)}
							className="border-border bg-sub-alt hover:border-main/30 group flex flex-col gap-1.5 rounded-xl border p-3 text-left transition"
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
								</div>
							</div>
						</button>
					))}
				</div>
			) : (
				<div className="divide-border divide-y">
					{equipment.map((item) => (
						<div
							key={item.equipment_id}
							className="hover:bg-main/5 -mx-4 flex w-[calc(100%+2rem)] items-center gap-3 px-4 py-2.5 transition"
						>
							<div className="border-border bg-main/5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border">
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
								onClick={() => router.push(`/equipment/${item.equipment_id}`)}
							>
								<p className="text-main text-sm font-medium">{item.full_name}</p>
								<p className="text-sub text-xs">
									{item.brand} · {item.series}
								</p>
							</button>
							<div className="flex shrink-0 items-center gap-2">
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
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);

	return (
		<>
			<div id="pageGymProfile" className="content-grid py-8">
				<div className="full-width-padding mx-auto max-w-4xl">
					<div className="flex flex-col gap-3">
						<Hero />

						{/* ── Stats ── */}
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<div className="border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3">
								<p className="text-sub text-[11px]">rating</p>
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
							<div className="border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3">
								<p className="text-sub text-[11px]">favourites</p>
								<p className="text-main text-xl font-semibold">{gym.favourites ?? 0}</p>
							</div>
							<div className="border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3">
								<p className="text-sub text-[11px]">equipment</p>
								<p className="text-main text-xl font-semibold">{gym.total_equipment}</p>
							</div>
							<div className="border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3">
								<p className="text-sub text-[11px]">unique</p>
								<p className="text-main text-xl font-semibold">{gym.unique_machines}</p>
							</div>
						</div>

						{/* ── Equipment ── */}
						<div className="border-border bg-surface rounded-2xl border p-4">
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
									onEquipmentAdded={(item) => setEquipment((prev) => [...prev, item])}
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
