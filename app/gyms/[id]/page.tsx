'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Dumbbell, Minus } from 'lucide-react';
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
import { Plus } from 'lucide-react';
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

	const ImageTile = ({ mobile = false }: { mobile?: boolean }) => (
		<div
			className={
				mobile
					? 'border-border bg-sub-alt relative aspect-square w-full overflow-hidden rounded-2xl border'
					: 'border-border bg-sub-alt relative col-span-2 row-span-2 overflow-hidden rounded-2xl border'
			}
		>
			{imageUrl ? (
				<img src={imageUrl} alt={gym.name} className="h-full w-full object-cover" />
			) : (
				<div className="flex h-full w-full items-center justify-center">
					<Dumbbell className="text-sub h-10 w-10 opacity-30" />
				</div>
			)}
			{uploading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/40">
					<span className="text-xs text-white">Uploading...</span>
				</div>
			)}
			{user ? (
				<label className="absolute bottom-3 right-3 cursor-pointer">
					<div className="border-border bg-surface/80 text-sub hover:text-main rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm">
						{imageUrl ? 'Change photo' : 'Add photo'}
					</div>
					<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
				</label>
			) : null}
		</div>
	);

	const EquipmentList = () => (
		<div className="max-h-100 overflow-y-auto">
			{equipment.length === 0 ? (
				<p className="text-sub text-sm">No equipment listed yet.</p>
			) : (
				<div className="divide-border divide-y">
					{equipment.map((item) => (
						<div
							key={item.equipment_id}
							className="hover:bg-main/5 -mx-4 flex w-[calc(100%+2rem)] items-center justify-between px-4 py-2.5 transition"
						>
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
					{/* Bento grid — desktop */}
					<div
						className="hidden sm:grid sm:grid-cols-4 sm:gap-3"
						style={{ gridTemplateRows: '160px 160px 160px auto auto' }}
					>
						{/* Image — 2×2 */}
						<ImageTile />

						{/* Name + info — 2×2 */}
						<div className="border-border bg-surface col-span-2 row-span-2 flex flex-col justify-between rounded-2xl border p-5">
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1">
									<p className="text-sub mb-1 text-xs">
										{gym.city} · {gym.country}
									</p>
									<h1 className="text-main text-2xl font-semibold leading-tight">{gym.name}</h1>
									<a
										href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([gym.address, gym.city, gym.country].filter(Boolean).join(', '))}`}
										target="_blank"
										rel="noreferrer"
										className="text-sub hover:text-main mt-2 flex items-center gap-1.5 text-sm transition"
									>
										<MapPin className="h-3.5 w-3.5 shrink-0" />
										<span className="hover:underline">{[gym.address, gym.city, gym.country].filter(Boolean).join(', ')}</span>
									</a>
								</div>
								<FavoriteButton isFavorite={isFavorite} onToggle={handleFavorite} />
							</div>
							{gym.instagram && (
								<a
									href={`https://instagram.com/${gym.instagram}`}
									target="_blank"
									rel="noreferrer"
									className="text-sub hover:text-main w-fit transition"
								>
									<FaInstagram className="h-4 w-4" />
								</a>
							)}
						</div>

						{/* Rating — 1×1 */}
						<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
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

						{/* Favourites — 1×1 */}
						<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">favourites</p>
							<p className="text-main text-xl font-semibold">{gym.favourites ?? 0}</p>
						</div>

						{/* Equipment count — 1×1 */}
						<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">equipment</p>
							<p className="text-main text-xl font-semibold">{gym.total_equipment}</p>
						</div>

						{/* Unique machines — 1×1 */}
						<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">unique</p>
							<p className="text-main text-xl font-semibold">{gym.unique_machines}</p>
						</div>

						{/* Equipment list — full width */}
						<div className="border-border bg-surface col-span-4 rounded-2xl border p-4">
							<div className="mb-3 flex items-center justify-between">
								<h2 className="text-main text-sm font-semibold">Equipment ({equipment.length})</h2>
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

					{/* Mobile layout — stacked */}
					<div className="flex flex-col gap-3 sm:hidden">
						<ImageTile mobile />

						{/* Name + info */}
						<div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1">
									<p className="text-sub mb-0.5 text-xs">
										{gym.city} · {gym.country}
									</p>
									<h1 className="text-main text-xl font-semibold">{gym.name}</h1>
									<a
										href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([gym.address, gym.city, gym.country].filter(Boolean).join(', '))}`}
										target="_blank"
										rel="noreferrer"
										className="text-sub hover:text-main mt-2 flex items-center gap-1 text-sm transition"
									>
										<MapPin className="h-3.5 w-3.5 shrink-0" />
										<span className="hover:underline">{[gym.address, gym.city, gym.country].filter(Boolean).join(', ')}</span>
									</a>
								</div>
								<FavoriteButton isFavorite={isFavorite} onToggle={handleFavorite} />
							</div>
							{gym.instagram && (
								<a
									href={`https://instagram.com/${gym.instagram}`}
									target="_blank"
									rel="noreferrer"
									className="text-sub hover:text-main w-fit transition"
								>
									<FaInstagram className="h-4 w-4" />
								</a>
							)}
						</div>

						{/* Stats grid 2×2 */}
						<div className="grid grid-cols-2 gap-3">
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

						{/* Equipment list */}
						<div className="border-border bg-surface rounded-2xl border p-4">
							<div className="mb-3 flex items-center justify-between">
								<h2 className="text-main text-sm font-semibold">Equipment ({equipment.length})</h2>
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
