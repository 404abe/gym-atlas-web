'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RatingStars from '@/components/ui/RatingStars';
import FavoriteButton from '@/components/ui/FavoriteButton';
import ResistanceProfile from '@/components/ui/ResistanceProfile';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import {
	fetchEquipmentById,
	fetchBestInClassCategories,
	fetchEquipmentGyms,
	setBestInClass,
	uploadEquipmentImage,
	rateEquipment,
	favouriteEquipment,
	unfavouriteEquipment,
	updateWeightStack,
	createVariant,
	deleteVariant
} from '@/lib/api';
import { Star, Dumbbell, Plus, Trophy, X, ChevronDown } from 'lucide-react';
import { Equipment, EquipmentVariant } from '@/types/equipment';
import { GymWithQuantity } from '@/types/gym';
import type { BestInClassCategory } from '@/types/bestInClass';
import { getEquipmentCategorySuggestions, EQUIPMENT_CATEGORY_DEFAULT } from '@/lib/equipment-categories';

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
	const { requireAuth } = useAuthGate();
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
	const [weightStackPending, setWeightStackPending] = useState(false);

	const canConfirm = selectedMuscle || selectedExercise;

	const getSuggested = () =>
		getEquipmentCategorySuggestions(item?.name ?? '', { fallback: true }) ??
		EQUIPMENT_CATEGORY_DEFAULT;

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
		if (!requireAuth('rate equipment')) return;
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
			setEditingWeightStack(false);
			setWeightStackInput('');
			setWeightStackPending(true);
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

	// ── Hero ── shared across breakpoints; image-first with overlaid title + actions
	const Hero = () => (
		<div className="bg-sub-alt relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:aspect-[16/9]">
			{imageUrl ? (
				<img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
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
					Add photo
				</button>
			)}

			{/* Actions — top right */}
			<div className="absolute right-3 top-3 flex items-center gap-2">
				{user && (
					<button
						onClick={() => setShowBestInClass(true)}
						className="flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 text-sm text-white backdrop-blur-sm transition hover:bg-white/25"
					>
						<Trophy className="h-3.5 w-3.5" />
						Best in class
					</button>
				)}
				<div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur-sm">
					<FavoriteButton isFavorite={isFavorite} onToggle={handleFavorite} />
				</div>
			</div>

			{/* Title overlay — bottom */}
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5">
				<span className="mb-2 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
					{item.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
				</span>
				<h1 className="text-2xl font-semibold leading-tight text-white">{item.name || item.slug}</h1>
				<p className="text-sm text-white/70">
					{item.brand} · {item.series}
				</p>
			</div>
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
			<div className="full-width-padding mx-auto w-full max-w-4xl">
				<div className="flex flex-col gap-3">
					<Hero />

					{/* ── Stats ── */}
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{/* avg rating */}
						<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
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

						{/* in gyms */}
						<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
							<p className="text-sub text-[11px]">in gyms</p>
							<p className="text-main text-xl font-semibold">{gyms.length}</p>
						</div>

						{/* weight stack */}
						<div className="border-border bg-sub-alt relative flex flex-col justify-between rounded-2xl border p-3">
							<p className="text-sub text-[11px]">weight stack</p>
							<div>
								{item.type === 'pin_loaded' ? (
									item.weight_stack ? (
										<p className="text-main text-xl font-semibold">{item.weight_stack}kg</p>
									) : (
										<p className="text-sub text-sm">—</p>
									)
								) : (
									<p className="text-sub text-sm">Plate loaded</p>
								)}
							</div>
							{user &&
								item.type === 'pin_loaded' &&
								!item.weight_stack &&
								(weightStackPending ? (
									<span className="text-sub absolute bottom-3 right-3 text-[11px] italic">
										Pending review
									</span>
								) : editingWeightStack ? (
									<div className="absolute bottom-3 right-3 flex items-center gap-1">
										<input
											type="number"
											autoFocus
											min={1}
											value={weightStackInput}
											onChange={(e) => setWeightStackInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleSaveWeightStack();
												if (e.key === 'Escape') setEditingWeightStack(false);
											}}
											placeholder="kg"
											className="bg-surface text-main w-14 rounded-md px-2 py-1 text-xs outline-none"
										/>
										<button
											onClick={handleSaveWeightStack}
											className="text-sub hover:text-main text-xs transition"
										>
											✓
										</button>
										<button
											onClick={() => setEditingWeightStack(false)}
											className="text-sub hover:text-main text-xs transition"
										>
											✕
										</button>
									</div>
								) : (
									<button
										onClick={() => setEditingWeightStack(true)}
										className="bg-surface/80 text-sub hover:text-main absolute bottom-3 right-3 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm transition"
									>
										Add weight stack
									</button>
								))}
						</div>

						{/* resistance */}
						<div className="bg-sub-alt flex flex-col justify-between rounded-2xl p-3">
							<p className="text-sub text-[11px]">resistance</p>
							<div className="mt-1">
								<ResistanceProfile profile={item.resistance_profile} curve={item.resistance_curve} />
							</div>
						</div>
					</div>

					{/* ── Your rating ── */}
					<div className="bg-sub-alt flex items-center gap-4 rounded-2xl px-4 py-3">
						<p className="text-sub shrink-0 text-xs">your rating</p>
						<RatingStars
							avgRating={avgRating || 0}
							userRating={item.user_rating ? Number(item.user_rating) : undefined}
							onRate={handleRate}
						/>
					</div>

					{/* ── Found in ── */}
					<div className="bg-surface rounded-2xl p-4">
						<div className="mb-3 flex items-center justify-between">
							<h2 className="text-main text-sm font-semibold">
								Found in ({gyms.length} {gyms.length === 1 ? 'gym' : 'gyms'})
							</h2>
							<button
								onClick={() =>
									requireAuth('assign equipment to a gym') &&
									router.push(`/add?equipmentId=${item.id}`)
								}
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

					{/* ── Variations ── */}
					<VariantsCard
						equipmentId={item.id}
						variants={item.variants || []}
						canSubmit={!!user}
						canDelete={user?.role === 'admin' || user?.role === 'super_admin'}
					/>
				</div>
			</div>

			{/* ── Best in Class Modal ── */}
			{showBestInClass && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
					<div className="bg-surface relative w-full max-w-md rounded-2xl p-5 shadow-2xl">
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
							<p className="text-sub mb-2 text-[11px] uppercase tracking-wide">Suggested exercise</p>
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
							<div className="bg-sub-alt mb-3 rounded-xl px-3 py-2.5 text-xs">
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

/* ── Variants ── */

const VARIATION_TYPES: EquipmentVariant['variation_type'][] = ['grip', 'unilateral', 'incline'];

const VARIATION_GROUP_LABEL: Record<EquipmentVariant['variation_type'], string> = {
	grip: 'grips',
	unilateral: 'arms',
	incline: 'incline'
};

/* Maps a free-form variant label to a small line glyph. Falls back to a dot. */
function VariantGlyph({ variant }: { variant: EquipmentVariant }) {
	const l = variant.label.toLowerCase();
	const has = (...keys: string[]) => keys.some((k) => l.includes(k));

	// Unilateral arms render as two independent bars vs. a single fixed bar.
	if (variant.variation_type === 'unilateral') {
		const split = !has('bi', 'together', 'fixed', 'converg');
		return (
			<svg viewBox="0 0 32 32" className="h-7 w-12" fill="none" stroke="currentColor">
				{split ? (
					<>
						<line x1="11" y1="9" x2="11" y2="23" strokeWidth="3" strokeLinecap="round" />
						<line x1="21" y1="9" x2="21" y2="23" strokeWidth="3" strokeLinecap="round" />
					</>
				) : (
					<line x1="16" y1="9" x2="16" y2="23" strokeWidth="3" strokeLinecap="round" />
				)}
			</svg>
		);
	}

	// Grip and incline render as a single bar rotated to suggest orientation/angle.
	let angle: number | null = null;
	if (variant.variation_type === 'grip') {
		if (has('horizontal')) angle = 90;
		else if (has('angl', '45', 'diagonal')) angle = 45;
		else if (has('neutral', 'vertical', 'parallel')) angle = 0;
		else angle = 0;
	} else {
		// incline
		if (has('flat', 'horizontal')) angle = 90;
		else if (has('decline')) angle = 135;
		else if (has('vertical', 'upright', '90')) angle = 0;
		else if (has('incline', '45', 'angl')) angle = 45;
		else angle = 45;
	}

	if (angle === null) {
		return (
			<svg viewBox="0 0 32 32" className="h-7 w-12" fill="currentColor">
				<circle cx="16" cy="16" r="3.5" />
			</svg>
		);
	}

	return (
		<svg viewBox="0 0 32 32" className="h-7 w-12" fill="none" stroke="currentColor">
			<line
				x1="16"
				y1="8"
				x2="16"
				y2="24"
				strokeWidth="3"
				strokeLinecap="round"
				transform={`rotate(${angle} 16 16)`}
			/>
		</svg>
	);
}

function VariantsCard({
	equipmentId,
	variants,
	canSubmit,
	canDelete
}: {
	equipmentId: number;
	variants: EquipmentVariant[];
	canSubmit: boolean;
	canDelete: boolean;
}) {
	const [list, setList] = useState<EquipmentVariant[]>(variants);
	const [open, setOpen] = useState(false);
	const [label, setLabel] = useState('');
	const [type, setType] = useState<EquipmentVariant['variation_type']>('grip');
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!label.trim()) return;
		setSubmitting(true);
		setError(null);
		try {
			await createVariant(equipmentId, {
				label: label.trim(),
				variation_type: type
			});
			setSubmitted(true);
			setOpen(false);
			setLabel('');
			setType('grip');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to submit');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (variantId: number) => {
		try {
			await deleteVariant(variantId);
			setList((prev) => prev.filter((v) => v.id !== variantId));
		} catch (err) {
			console.error('Failed to delete variant:', err);
		}
	};

	return (
		<div className="bg-surface rounded-2xl p-4">
			<div className="mb-3 flex items-center justify-between">
				<h2 className="text-main text-sm font-semibold">Variations</h2>
				{canSubmit && !open && (
					<button
						onClick={() => {
							setOpen(true);
							setSubmitted(false);
						}}
						className="text-sub hover:text-main flex items-center gap-1 text-xs transition"
					>
						<Plus className="h-3.5 w-3.5" />
						Suggest
					</button>
				)}
			</div>

			{list.length === 0 ? (
				<p className="text-sub text-sm">No variations listed yet.</p>
			) : (
				<div className="space-y-2">
					{VARIATION_TYPES.map((groupType) => {
						const items = list.filter((v) => v.variation_type === groupType);
						if (items.length === 0) return null;
						return (
							<div key={groupType} className="bg-sub-alt rounded-xl p-3">
								<p className="text-main mb-3 text-xs font-semibold lowercase">
									{VARIATION_GROUP_LABEL[groupType]}
								</p>
								<div className="flex flex-wrap gap-x-5 gap-y-3">
									{items.map((v) => (
										<div
											key={v.id}
											className="group/var relative flex flex-col items-center gap-1.5"
										>
											<span className="text-main flex h-7 items-center justify-center">
												<VariantGlyph variant={v} />
											</span>
											<span className="text-sub text-[11px]">{v.label}</span>
											{v.is_default && (
												<span className="text-sub text-[9px] uppercase tracking-wide">default</span>
											)}
											{canDelete && (
												<button
													onClick={() => handleDelete(v.id)}
													className="bg-surface text-sub absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full transition group-hover/var:flex hover:text-red-400"
												>
													<X className="h-2.5 w-2.5" />
												</button>
											)}
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{submitted && <p className="mt-3 text-xs text-green-400">Variation submitted for review.</p>}

			{open && (
				<div className="mt-3 space-y-2">
					<input
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="Label (e.g. Wide grip)"
						className="bg-sub-alt text-main w-full rounded-lg px-3 py-2 text-xs outline-none"
					/>
					<select
						value={type}
						onChange={(e) => setType(e.target.value as EquipmentVariant['variation_type'])}
						className="bg-sub-alt text-main w-full rounded-lg px-3 py-2 text-xs outline-none"
					>
						{VARIATION_TYPES.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
					{error && <p className="text-xs text-red-400">{error}</p>}
					<div className="flex justify-end gap-2">
						<button onClick={() => setOpen(false)} className="text-sub hover:text-main text-xs">
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={submitting || !label.trim()}
							className="bg-main text-surface rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
						>
							{submitting ? '...' : 'Submit'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
