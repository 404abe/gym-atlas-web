'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RatingStars from '@/components/ui/RatingStars';
import FavoriteButton from '@/components/ui/FavoriteButton';
import ResistanceProfile from '@/components/ui/ResistanceProfile';
import { useAuth } from '@/app/contexts/AuthContext';
import {
	fetchEquipmentById,
	fetchBestInClassCategories,
	fetchEquipmentGyms,
	setBestInClass,
	uploadEquipmentImage,
	rateEquipment,
	favouriteEquipment,
	unfavouriteEquipment,
	updateWeightStack
} from '@/lib/api';
import { Star, Dumbbell, Plus, Trophy, X, ChevronDown } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { GymWithQuantity } from '@/types/gym';
import type { BestInClassCategory } from '@/types/bestInClass';

export default function EquipmentProfilePage() {
	const { id } = useParams();
	const router = useRouter();
	const [item, setItem] = useState<Equipment | null>(null);
	const [gyms, setGyms] = useState<GymWithQuantity[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFavorite, setIsFavorite] = useState(false);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const { user } = useAuth();
	const [categories, setCategories] = useState<BestInClassCategory[]>([]);
	const [showBestInClass, setShowBestInClass] = useState(false);
	const [saving, setSaving] = useState(false);
	const [justSaved, setJustSaved] = useState(false);
	const [selectedMuscle, setSelectedMuscle] = useState<{ id: number; name: string } | null>(null);
	const [selectedExercise, setSelectedExercise] = useState<{ id: number; name: string } | null>(
		null
	);
	const [showAllCategories, setShowAllCategories] = useState(false);
	const [editingWeightStack, setEditingWeightStack] = useState(false);
	const [weightStackInput, setWeightStackInput] = useState('');

	const canConfirm = selectedMuscle || selectedExercise;

	const SUGGESTED: Record<string, { muscles: string[]; exercises: string[] }> = {
		default: {
			muscles: ['Chest', 'Triceps', 'Shoulders'],
			exercises: ['Chest Press', 'Incline Chest Press', 'Chest Fly']
		},
		'Chest Press': {
			muscles: ['Chest', 'Triceps', 'Shoulders'],
			exercises: ['Chest Press', 'Incline Chest Press', 'Chest Fly']
		},
		'Leg Press': { muscles: ['Quads', 'Glutes', 'Hamstrings'], exercises: ['Leg Press'] },
		'Lat Pulldown': { muscles: ['Lats', 'Upper Back', 'Biceps'], exercises: ['Lat Pulldown'] },
		'Shoulder Press': {
			muscles: ['Shoulders', 'Triceps'],
			exercises: ['Shoulder Press', 'Lateral Raise']
		},
		'Leg Extension': { muscles: ['Quads'], exercises: ['Leg Extension'] },
		'Leg Curl': {
			muscles: ['Hamstrings'],
			exercises: ['Lying Hamstring Curl', 'Seated Hamstring Curl']
		},
		'Seated Row': {
			muscles: ['Upper Back', 'Lats', 'Biceps'],
			exercises: ['Lat Row', 'Upper Back Row', 'T-Bar Row']
		},
		'Calf Raise': { muscles: ['Calves'], exercises: ['Seated Calf Raise', 'Standing Calf Raise'] },
		'Bicep Curl': { muscles: ['Biceps'], exercises: ['Bicep Curl'] },
		'Tricep Extension': { muscles: ['Triceps'], exercises: ['Tricep Extension', 'Tricep Pushdown'] }
	};

	const getSuggested = () => {
		const key = Object.keys(SUGGESTED).find((k) => item?.name?.includes(k));
		return SUGGESTED[key ?? 'default'] ?? SUGGESTED['default'];
	};

	useEffect(() => {
		const load = async () => {
			try {
				const [eq, catsData] = await Promise.all([
					fetchEquipmentById(id as string),
					fetchBestInClassCategories().catch(() => ({ categories: [] }))
				]);
				setCategories(catsData.categories || []);
				setItem(eq);
				setImageUrl(eq.image_url || null);
				setIsFavorite(eq.is_favorite ?? false);
				const gymsData = await fetchEquipmentGyms(eq.slug);
				setGyms(gymsData.gyms || []);
			} catch (err) {
				console.error('Failed to load equipment:', err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [id]);

	const closeModal = () => {
		setShowBestInClass(false);
		setSelectedMuscle(null);
		setSelectedExercise(null);
		setShowAllCategories(false);
		setJustSaved(false);
	};

	// Backend expects one POST per category_id, so fire one or two requests
	const handleSetBestInClass = async () => {
		if (!item || !canConfirm) return;
		setSaving(true);
		try {
			const requests = [];
			if (selectedMuscle) requests.push(setBestInClass(selectedMuscle.id, item.id));
			if (selectedExercise) requests.push(setBestInClass(selectedExercise.id, item.id));
			await Promise.all(requests);
			setJustSaved(true);
			setTimeout(() => closeModal(), 800);
		} catch (err) {
			console.error('Failed to set best in class:', err);
		} finally {
			setSaving(false);
		}
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			setUploading(true);
			const url = await uploadEquipmentImage(id as string, file);
			setImageUrl(url);
		} catch (err) {
			console.error('Failed to upload image:', err);
		} finally {
			setUploading(false);
		}
	};

	const handleRate = async (rating: number) => {
		if (!item) return;
		setItem((prev) => (prev ? { ...prev, user_rating: rating } : prev));
		try {
			await rateEquipment(id as string, rating);
		} catch (err) {
			console.error('Failed to rate:', err);
		}
	};

	const handleSaveWeightStack = async () => {
		const val = parseInt(weightStackInput, 10);
		if (!val || val <= 0) return;
		try {
			await updateWeightStack(id as string, val);
			setItem((prev) => (prev ? { ...prev, weight_stack: val } : prev));
			setEditingWeightStack(false);
			setWeightStackInput('');
		} catch (err) {
			console.error('Failed to update weight stack:', err);
		}
	};

	const handleFavorite = async () => {
		setIsFavorite((prev) => !prev);
		try {
			if (isFavorite) await unfavouriteEquipment(id as string);
			else await favouriteEquipment(id as string);
		} catch (err) {
			console.error('Failed to toggle favourite:', err);
		}
	};

	if (loading) return <div className="p-8 text-sm">Loading...</div>;
	if (!item) return <div className="p-8 text-sm">Equipment not found.</div>;

	const avgRating = item.avg_rating ? Number(item.avg_rating) : null;

	const ImageTile = ({ mobile = false }: { mobile?: boolean }) => (
		<div
			className={
				mobile
					? 'border-border bg-sub-alt relative aspect-square w-full overflow-hidden rounded-2xl border'
					: 'border-border bg-sub-alt relative col-span-2 row-span-2 overflow-hidden rounded-2xl border'
			}
		>
			{imageUrl ? (
				<img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
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
						{uploading ? 'Uploading...' : imageUrl ? 'Change photo' : 'Add photo'}
					</div>
					<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
				</label>
			) : (
				<div className="group absolute bottom-3 right-3">
					<div className="border-border bg-surface/80 text-sub rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm">
						Add photo
					</div>
					<div className="bg-surface pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-44 rounded-lg px-3 py-2 text-center text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
						<a href="/login" className="text-main underline">
							Sign in
						</a>
						<span className="text-sub"> to add photos</span>
					</div>
				</div>
			)}
		</div>
	);

	const chipClass = (active: boolean, subtle = false) =>
		`rounded-full border px-3 py-1.5 text-xs transition ${
			active
				? 'bg-main text-surface border-main'
				: subtle
					? 'border-border text-sub hover:border-main/50 hover:text-main'
					: 'border-border text-main hover:border-main/50'
		}`;

	return (
		<div id="pageEquipmentProfile" className="content-grid py-8">
			<div className="full-width-padding mx-auto max-w-4xl">
				{/* ── Desktop Bento Grid ── */}
				<div
					className="hidden sm:grid sm:grid-cols-4 sm:gap-3"
					style={{ gridTemplateRows: '160px 160px 160px auto auto' }}
				>
					<ImageTile />

					<div className="border-border bg-surface col-span-2 row-span-2 flex flex-col justify-between rounded-2xl border p-5">
						<div className="flex items-start justify-between gap-2">
							<div>
								<p className="text-sub mb-1 text-xs">
									{item.brand} · {item.series}
								</p>
								<h1 className="text-main text-2xl font-semibold leading-tight">
									{item.name || item.slug}
								</h1>
							</div>
							<FavoriteButton isFavorite={isFavorite} onToggle={handleFavorite} />
						</div>
						{user && (
							<button
								onClick={() => setShowBestInClass(true)}
								className="text-sub hover:text-main border-border mt-auto flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition"
							>
								<Trophy className="h-3.5 w-3.5" />
								Set as best in class
							</button>
						)}
					</div>

					<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
						<p className="text-sub text-[11px]">avg rating</p>
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

					<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
						<p className="text-sub text-[11px]">in gyms</p>
						<p className="text-main text-xl font-semibold">{gyms.length}</p>
					</div>

					<div className="border-border bg-sub-alt relative col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
						<p className="text-sub text-[11px]">type</p>
						<div>
							<p className="text-sub text-xs">
								{item.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
							</p>
							{item.weight_stack && (
								<p className="text-main text-xl font-semibold">{item.weight_stack}kg</p>
							)}
						</div>
						{user && item.type === 'pin_loaded' && !item.weight_stack && (
							editingWeightStack ? (
								<div className="absolute bottom-3 right-3 flex items-center gap-1">
									<input
										type="number"
										autoFocus
										min={1}
										value={weightStackInput}
										onChange={(e) => setWeightStackInput(e.target.value)}
										onKeyDown={(e) => { if (e.key === 'Enter') handleSaveWeightStack(); if (e.key === 'Escape') setEditingWeightStack(false); }}
										placeholder="kg"
										className="bg-surface border-border text-main w-14 rounded-md border px-2 py-1 text-xs outline-none"
									/>
									<button onClick={handleSaveWeightStack} className="text-sub hover:text-main text-xs transition">✓</button>
									<button onClick={() => setEditingWeightStack(false)} className="text-sub hover:text-main text-xs transition">✕</button>
								</div>
							) : (
								<button
									onClick={() => setEditingWeightStack(true)}
									className="border-border bg-surface/80 text-sub hover:text-main absolute bottom-3 right-3 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm transition"
								>
									Add weight stack
								</button>
							)
						)}
					</div>

					<div className="border-border bg-sub-alt col-span-1 row-span-1 flex flex-col justify-between rounded-2xl border p-3">
						<p className="text-sub text-[11px]">resistance</p>
						<div className="mt-1">
							<ResistanceProfile profile={item.resistance_profile} />
						</div>
					</div>

					<div className="border-border bg-sub-alt col-span-4 row-span-1 flex items-center gap-4 rounded-2xl border px-4 py-3">
						<p className="text-sub shrink-0 text-xs">your rating</p>
						<RatingStars
							avgRating={avgRating || 0}
							userRating={item.user_rating ? Number(item.user_rating) : undefined}
							onRate={handleRate}
						/>
					</div>

					<div className="border-border bg-surface col-span-4 rounded-2xl border p-4">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-main text-sm font-semibold">
								Found in ({gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'})
							</h2>
							<button
								onClick={() => router.push(`/add?equipmentId=${item.id}`)}
								className="text-sub hover:text-main flex items-center gap-1 text-xs transition"
							>
								<Plus className="h-3.5 w-3.5" />
								Add gym
							</button>
						</div>
						{gyms.length === 0 ? (
							<p className="text-sub text-sm">Not listed in any gym yet.</p>
						) : (
							<div className="divide-border divide-y">
								{gyms.map((gym) => (
									<button
										key={gym.id}
										onClick={() => router.push(`/gyms/${gym.id}`)}
										className="hover:bg-main/5 -mx-4 flex w-[calc(100%+2rem)] items-center justify-between px-4 py-2.5 transition"
									>
										<div className="text-left">
											<p className="text-main text-sm font-medium">{gym.name}</p>
											{gym.city && <p className="text-sub text-xs">{gym.city}</p>}
										</div>
										<span className="text-sub bg-main/10 rounded-full px-2.5 py-0.5 text-xs">
											×{gym.quantity}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* ── Mobile Stack ── */}
				<div className="flex flex-col gap-3 sm:hidden">
					<ImageTile mobile />

					<div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
						<div className="flex items-start justify-between gap-2">
							<div>
								<p className="text-sub mb-0.5 text-xs">
									{item.brand} · {item.series}
								</p>
								<h1 className="text-main text-xl font-semibold">{item.name || item.slug}</h1>
							</div>
							<FavoriteButton isFavorite={isFavorite} onToggle={handleFavorite} />
						</div>
						{user && (
							<button
								onClick={() => setShowBestInClass(true)}
								className="text-sub hover:text-main border-border flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition"
							>
								<Trophy className="h-3.5 w-3.5" />
								Set as best in class
							</button>
						)}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">avg rating</p>
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
							<p className="text-sub text-[11px]">in gyms</p>
							<p className="text-main text-xl font-semibold">{gyms.length}</p>
						</div>
						<div className="border-border bg-sub-alt relative flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">type</p>
							<div>
								<p className="text-sub text-xs">
									{item.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
								</p>
								{item.weight_stack && (
									<p className="text-main text-xl font-semibold">{item.weight_stack}kg</p>
								)}
							</div>
							{user && item.type === 'pin_loaded' && !item.weight_stack && (
								editingWeightStack ? (
									<div className="absolute bottom-3 right-3 flex items-center gap-1">
										<input
											type="number"
											autoFocus
											min={1}
											value={weightStackInput}
											onChange={(e) => setWeightStackInput(e.target.value)}
											onKeyDown={(e) => { if (e.key === 'Enter') handleSaveWeightStack(); if (e.key === 'Escape') setEditingWeightStack(false); }}
											placeholder="kg"
											className="bg-surface border-border text-main w-14 rounded-md border px-2 py-1 text-xs outline-none"
										/>
										<button onClick={handleSaveWeightStack} className="text-sub hover:text-main text-xs transition">✓</button>
										<button onClick={() => setEditingWeightStack(false)} className="text-sub hover:text-main text-xs transition">✕</button>
									</div>
								) : (
									<button
										onClick={() => setEditingWeightStack(true)}
										className="border-border bg-surface/80 text-sub hover:text-main absolute bottom-3 right-3 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm transition"
									>
										Add weight stack
									</button>
								)
							)}
						</div>
						<div className="border-border bg-sub-alt flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">resistance</p>
							<div className="mt-1">
								<ResistanceProfile profile={item.resistance_profile} />
							</div>
						</div>
					</div>

					<div className="border-border bg-sub-alt flex items-center gap-4 rounded-2xl border px-4 py-3">
						<p className="text-sub shrink-0 text-xs">your rating</p>
						<RatingStars
							avgRating={avgRating || 0}
							userRating={item.user_rating ? Number(item.user_rating) : undefined}
							onRate={handleRate}
						/>
					</div>

					<div className="border-border bg-surface rounded-2xl border p-4">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-main text-sm font-semibold">
								Found in ({gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'})
							</h2>
							<button
								onClick={() => router.push(`/add?equipmentId=${item.id}`)}
								className="text-sub hover:text-main flex items-center gap-1 text-xs transition"
							>
								<Plus className="h-3.5 w-3.5" />
								Add gym
							</button>
						</div>
						{gyms.length === 0 ? (
							<p className="text-sub text-sm">Not listed in any gym yet.</p>
						) : (
							<div className="divide-border divide-y">
								{gyms.map((gym) => (
									<button
										key={gym.id}
										onClick={() => router.push(`/gyms/${gym.id}`)}
										className="hover:bg-main/5 -mx-4 flex w-[calc(100%+2rem)] items-center justify-between px-4 py-2.5 transition"
									>
										<div className="text-left">
											<p className="text-main text-sm font-medium">{gym.name}</p>
											{gym.city && <p className="text-sub text-xs">{gym.city}</p>}
										</div>
										<span className="text-sub bg-main/10 rounded-full px-2.5 py-0.5 text-xs">
											×{gym.quantity}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ── Best in Class Modal ── */}
			{showBestInClass && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
					<div className="bg-surface border-border relative w-full max-w-md rounded-2xl border p-5 shadow-2xl">
						<div className="mb-1 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Trophy className="text-main h-4 w-4" />
								<h2 className="text-main font-semibold">Set as best in class</h2>
							</div>
							<button onClick={closeModal} className="text-sub hover:text-main">
								<X className="h-4 w-4" />
							</button>
						</div>

						<p className="text-sub mb-4 text-xs">
							Setting{' '}
							<span className="text-main font-medium">
								{item.brand} {item.name}
							</span>{' '}
							as your best — choose one or both
						</p>

						{/* Suggested muscle group */}
						<div className="mb-4">
							<p className="text-sub mb-2 text-[11px] uppercase tracking-wide">
								Suggested muscle group
							</p>
							<div className="flex flex-wrap gap-2">
								{categories
									.filter(
										(c) => c.type === 'muscle_group' && getSuggested().muscles.includes(c.name)
									)
									.map((cat) => (
										<button
											key={cat.id}
											onClick={() =>
												setSelectedMuscle(
													selectedMuscle?.id === cat.id ? null : { id: cat.id, name: cat.name }
												)
											}
											className={chipClass(selectedMuscle?.id === cat.id)}
										>
											{cat.name}
										</button>
									))}
							</div>
						</div>

						{/* Suggested exercise */}
						<div className="mb-4">
							<p className="text-sub mb-2 text-[11px] uppercase tracking-wide">
								Suggested exercise
							</p>
							<div className="flex flex-wrap gap-2">
								{categories
									.filter((c) => c.type === 'exercise' && getSuggested().exercises.includes(c.name))
									.map((cat) => (
										<button
											key={cat.id}
											onClick={() =>
												setSelectedExercise(
													selectedExercise?.id === cat.id ? null : { id: cat.id, name: cat.name }
												)
											}
											className={chipClass(selectedExercise?.id === cat.id)}
										>
											{cat.name}
										</button>
									))}
							</div>
						</div>

						{/* Show all toggle */}
						<button
							onClick={() => setShowAllCategories((prev) => !prev)}
							className="text-sub hover:text-main mb-4 flex items-center gap-1 text-xs transition"
						>
							<ChevronDown
								className={`h-3.5 w-3.5 transition-transform ${showAllCategories ? 'rotate-180' : ''}`}
							/>
							{showAllCategories ? 'Hide all categories' : 'Show all categories'}
						</button>

						{showAllCategories && (
							<div className="mb-4 space-y-4">
								<div>
									<p className="text-sub mb-2 text-[11px] uppercase tracking-wide">
										All muscle groups
									</p>
									<div className="flex flex-wrap gap-2">
										{categories
											.filter((c) => c.type === 'muscle_group')
											.map((cat) => (
												<button
													key={cat.id}
													onClick={() =>
														setSelectedMuscle(
															selectedMuscle?.id === cat.id ? null : { id: cat.id, name: cat.name }
														)
													}
													className={chipClass(selectedMuscle?.id === cat.id, true)}
												>
													{cat.name}
												</button>
											))}
									</div>
								</div>
								<div>
									<p className="text-sub mb-2 text-[11px] uppercase tracking-wide">All exercises</p>
									<div className="flex flex-wrap gap-2">
										{categories
											.filter((c) => c.type === 'exercise')
											.map((cat) => (
												<button
													key={cat.id}
													onClick={() =>
														setSelectedExercise(
															selectedExercise?.id === cat.id
																? null
																: { id: cat.id, name: cat.name }
														)
													}
													className={chipClass(selectedExercise?.id === cat.id, true)}
												>
													{cat.name}
												</button>
											))}
									</div>
								</div>
							</div>
						)}

						{/* Summary */}
						{(selectedMuscle || selectedExercise) && (
							<div className="border-border bg-sub-alt mb-3 rounded-xl border px-3 py-2.5 text-xs">
								<span className="text-sub">Saving as best </span>
								{selectedMuscle && (
									<span className="text-main font-medium">{selectedMuscle.name} machine</span>
								)}
								{selectedMuscle && selectedExercise && <span className="text-sub"> — </span>}
								{selectedExercise && (
									<span className="text-main font-medium">{selectedExercise.name}</span>
								)}
							</div>
						)}

						<button
							onClick={handleSetBestInClass}
							disabled={!canConfirm || saving}
							className={`w-full rounded-xl py-2.5 text-xs font-medium transition ${
								justSaved
									? 'border border-green-500/50 text-green-400'
									: canConfirm
										? 'bg-main text-surface'
										: 'border-border text-sub cursor-not-allowed border opacity-40'
							}`}
						>
							{justSaved ? '✓ Saved!' : saving ? '...' : 'Confirm'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
