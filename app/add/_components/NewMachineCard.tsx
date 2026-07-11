'use client';

import { useState, useEffect, useRef } from 'react';
import {
	AlertTriangle,
	ChevronDown,
	Disc,
	ExternalLink,
	ImagePlus,
	Layers,
	Loader2,
	Pencil,
	Plus,
	X
} from 'lucide-react';
import { Equipment } from '@/types/equipment';
import {
	fetchMachineExercises,
	createEquipment,
	uploadEquipmentImage,
	rateEquipment,
	checkEquipmentDuplicate
} from '@/lib/api';
import type { Brand, DuplicateMatch } from '@/lib/api';
import BrandPickerModal from './BrandPickerModal';
import SeriesPickerModal from './SeriesPickerModal';
import ExercisePickerModal from './ExercisePickerModal';
import { DEFAULT_CURVE } from '@/components/ui/CustomCurveEditor';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { predictExercise } from '@/lib/exercise-match';

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
	onCreated: (equipment: Equipment) => void;
};

type ExerciseSlot = 'primary' | 'secondary';

// ── Constants ────────────────────────────────────────────────────────────────

const cellCls = 'bg-sub-alt border-border flex flex-col gap-3 overflow-hidden rounded-2xl border p-4';
const labelCls = 'text-sub text-[10px] font-medium uppercase tracking-widest';
const tileBase =
	'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[10px] border transition';
const tileActive = 'bg-main/8 border-main/40 text-main';
const tileIdle = 'border-border text-sub hover:text-main';

const RESISTANCE_TILES = [
	{ key: 'constant', label: 'Constant', stroke: 'currentColor', d: 'M3,10 L33,10' },
	{ key: 'ascending', label: 'Ascending', stroke: '#378ADD', d: 'M3,15 C13,15 23,5 33,5' },
	{ key: 'descending', label: 'Descending', stroke: '#E24B4A', d: 'M3,5 C13,5 23,15 33,15' },
	{ key: 'adjustable', label: 'Adjustable', stroke: '#1D9E75', d: 'M3,14 C8,14 12,5 18,5 C24,5 28,14 33,14' }
] as const;

const toSlug = (str: string) =>
	str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

// ── Subcomponents ────────────────────────────────────────────────────────────

function DuplicateBanner({
	match,
	onDismiss
}: {
	match: NonNullable<DuplicateMatch>;
	onDismiss: () => void;
}) {
	return (
		<div className="border-border bg-sub-alt flex items-start gap-3 rounded-xl border px-4 py-3">
			<AlertTriangle className="text-sub mt-0.5 h-4 w-4 shrink-0" />
			<div className="text-main flex-1 text-sm">
				<span className="font-medium">Possible duplicate — </span>
				<span className="text-sub">{match.name} already exists in the library. </span>
				<a
					href={`/equipment/${match.slug}`}
					target="_blank"
					rel="noreferrer"
					className="text-main inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
				>
					View it <ExternalLink className="h-3 w-3" />
				</a>
			</div>
			<button
				type="button"
				onClick={onDismiss}
				className="text-sub hover:text-main text-xs transition"
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>
	);
}

function PickerField({
	value,
	placeholder,
	disabled,
	title,
	onClick
}: {
	value: string;
	placeholder: string;
	disabled?: boolean;
	title?: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={`border-border flex flex-1 items-center justify-between gap-1 rounded-[10px] border px-3 py-2 text-xs transition ${
				disabled ? 'text-sub cursor-not-allowed opacity-40' : 'hover:border-sub'
			}`}
		>
			<span className={value ? 'text-main truncate' : 'text-sub truncate'}>
				{value || placeholder}
			</span>
			<ChevronDown className="text-sub h-3 w-3 shrink-0 opacity-60" />
		</button>
	);
}

function ExerciseRow({
	name,
	slot,
	onEdit,
	onRemove
}: {
	name: string;
	slot: ExerciseSlot;
	onEdit: () => void;
	onRemove?: () => void;
}) {
	const isPrimary = slot === 'primary';
	return (
		<div className="border-border flex items-center gap-2 rounded-[10px] border px-3 py-2">
			<button
				type="button"
				onClick={onEdit}
				className="flex min-w-0 flex-1 items-center gap-2 text-left"
			>
				<span
					className="h-2 w-2 shrink-0 rounded-full"
					style={{ backgroundColor: isPrimary ? '#378ADD' : 'var(--color-sub)' }}
				/>
				<span className={`flex-1 truncate text-sm ${name ? 'text-main' : 'text-sub'}`}>
					{name || 'Select exercise'}
				</span>
				<span className="text-sub text-[9px] font-medium uppercase tracking-wider">
					{slot}
				</span>
				<Pencil className="text-sub h-3 w-3 shrink-0" />
			</button>
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					aria-label="Remove secondary exercise"
					className="text-sub hover:text-main shrink-0 transition"
				>
					<X className="h-3.5 w-3.5" />
				</button>
			)}
		</div>
	);
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function NewMachineCard({ onCreated }: Props) {
	const { addToast } = useToastContext();
	const { requireAuth } = useAuthGate();

	const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
	const [series, setSeries] = useState('');
	const [name, setName] = useState('');
	const [type, setType] = useState<Equipment['type'] | null>(null);
	const [resistance, setResistance] = useState<Equipment['resistance_profile'] | null>(null);
	const [resistanceCurve, setResistanceCurve] = useState<number[]>(DEFAULT_CURVE);
	const [userRating, setUserRating] = useState(0);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
	const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
	const [selectedExerciseName, setSelectedExerciseName] = useState('');
	const [selectedSecondaryId, setSelectedSecondaryId] = useState<string | null>(null);
	const [selectedSecondaryName, setSelectedSecondaryName] = useState('');
	// Once the user edits the primary picker manually, stop auto-predicting from the name.
	const [exerciseTouched, setExerciseTouched] = useState(false);

	const [showBrandModal, setShowBrandModal] = useState(false);
	const [showSeriesModal, setShowSeriesModal] = useState(false);
	const [exerciseModal, setExerciseModal] = useState<ExerciseSlot | null>(null);

	const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch>(null);
	const [duplicateDismissed, setDuplicateDismissed] = useState(false);
	const duplicateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetchMachineExercises()
			.then((data) => {
				if (!cancelled) setExercises(data);
			})
			.catch(() => {
				if (!cancelled) addToast('Failed to load exercises', 'error');
			});
		return () => { cancelled = true; };
	}, [addToast]);

	// Duplicate detection — debounced 600ms
	useEffect(() => {
		if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);

		if (!selectedBrand || !name.trim() || name.trim().length < 3) {
			setDuplicateMatch(null);
			setDuplicateDismissed(false);
			return;
		}

		duplicateTimerRef.current = setTimeout(async () => {
			try {
				const result = await checkEquipmentDuplicate(selectedBrand.id, series, name.trim());
				setDuplicateMatch(result.match);
				setDuplicateDismissed(false);
			} catch {
				// silently ignore
			}
		}, 600);

		return () => {
			if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);
		};
	}, [selectedBrand, series, name]);

	const isValid = !!name && !!selectedBrand && !!series && !!type && !!selectedExerciseId;
	const showDuplicate = !!duplicateMatch && !duplicateDismissed;

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setImagePreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const handleNameChange = (value: string) => {
		setName(value);
		// Auto-fill the primary exercise from the name until the user picks one themselves.
		if (exerciseTouched) return;
		const match = predictExercise(value, exercises);
		if (match) {
			setSelectedExerciseId(match.id);
			setSelectedExerciseName(match.name);
		} else {
			setSelectedExerciseId(null);
			setSelectedExerciseName('');
		}
	};

	const handleBrandConfirm = (brand: Brand) => {
		setSelectedBrand(brand);
		setSeries('');
		setDuplicateMatch(null);
		setDuplicateDismissed(false);
		setShowBrandModal(false);
	};

	const handleExerciseConfirm = (id: string, exName: string) => {
		if (exerciseModal === 'primary') {
			setExerciseTouched(true);
			setSelectedExerciseId(id);
			setSelectedExerciseName(exName);
		} else if (exerciseModal === 'secondary') {
			setSelectedSecondaryId(id);
			setSelectedSecondaryName(exName);
		}
		setExerciseModal(null);
	};

	const clearSecondary = () => {
		setSelectedSecondaryId(null);
		setSelectedSecondaryName('');
	};

	const handleCreate = async () => {
		if (!isValid || isCreating || !selectedBrand) return;
		if (!requireAuth('add a machine')) return;
		setIsCreating(true);
		try {
			const created = await createEquipment({
				name,
				brand: selectedBrand.name,
				brand_id: selectedBrand.id,
				series,
				type,
				resistance_profile: resistance || undefined,
				resistance_curve: resistance === 'custom' ? resistanceCurve : undefined,
				exercise_id: selectedExerciseId ?? undefined,
				secondary_exercise_id: selectedSecondaryId || undefined,
			});

			if (imageFile && created.id) await uploadEquipmentImage(created.id, imageFile);
			if (userRating > 0 && created.id) await rateEquipment(created.id, userRating);

			onCreated(created);
			addToast(`"${selectedBrand.name} ${series} ${name}" submitted for review`, 'success');

			setSelectedBrand(null);
			setSeries('');
			setName('');
			setType(null);
			setResistance(null);
			setResistanceCurve(DEFAULT_CURVE);
			setUserRating(0);
			setImageFile(null);
			setImagePreview(null);
			setSelectedExerciseId(null);
			setSelectedExerciseName('');
			setSelectedSecondaryId(null);
			setSelectedSecondaryName('');
			setExerciseTouched(false);
			setDuplicateMatch(null);
			setDuplicateDismissed(false);
		} catch (error) {
			console.error(error);
			addToast('Failed to create equipment', 'error');
		} finally {
			setIsCreating(false);
		}
	};

	const slug = [selectedBrand?.name ?? '', series, name].filter(Boolean).map(toSlug).join('-');

	return (
		<>
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
				{/* Duplicate banner */}
				{showDuplicate && duplicateMatch && (
					<DuplicateBanner match={duplicateMatch} onDismiss={() => setDuplicateDismissed(true)} />
				)}

				{/* ── 2×2 Bento grid ── */}
				<div className="grid aspect-square grid-cols-2 grid-rows-2 gap-2">
					{/* Top-left — Photo */}
					<label className={`${cellCls} cursor-pointer p-3`}>
						<div className="border-border flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-dashed">
							{imagePreview ? (
								<img src={imagePreview} alt="cover preview" className="h-full w-full object-contain" />
							) : (
								<div className="flex flex-col items-center gap-2 px-4 text-center">
									<ImagePlus className="text-sub h-7 w-7 opacity-60" />
									<p className="text-main text-sm font-medium">Add cover photo</p>
									<p className="text-sub text-[11px]">JPG or PNG · up to 10 MB</p>
								</div>
							)}
						</div>
						<input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
					</label>

					{/* Top-right — Identity */}
					<div className={cellCls}>
						<div className="flex items-center gap-2">
							<PickerField
								value={selectedBrand?.name ?? ''}
								placeholder="Brand"
								onClick={() => setShowBrandModal(true)}
							/>
							<PickerField
								value={series}
								placeholder="Series"
								disabled={!selectedBrand}
								title={!selectedBrand ? 'Select a brand first' : undefined}
								onClick={() => setShowSeriesModal(true)}
							/>
						</div>

						<input
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Machine name"
							className="bg-transparent text-main placeholder:text-sub w-full border-none text-base font-semibold leading-tight outline-none"
						/>
						{slug && <p className="text-sub -mt-1 truncate text-[10px]">{slug}</p>}

						<div className="border-border border-t" />

						<div className="mt-auto grid grid-cols-2 gap-2">
							{(['pin_loaded', 'plate_loaded'] as const).map((t) => {
								const active = type === t;
								const Icon = t === 'pin_loaded' ? Layers : Disc;
								return (
									<button
										key={t}
										type="button"
										onClick={() => setType(t)}
										className={`${tileBase} ${active ? tileActive : tileIdle}`}
									>
										<Icon className="h-5 w-5" />
										<span className="text-[11px] font-medium">
											{t === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Bottom-left — Exercise */}
					<div className={cellCls}>
						<p className={labelCls}>Exercise</p>

						<div className="flex flex-1 flex-col gap-2">
							<ExerciseRow
								name={selectedExerciseName}
								slot="primary"
								onEdit={() => setExerciseModal('primary')}
							/>
							{selectedSecondaryId && (
								<ExerciseRow
									name={selectedSecondaryName}
									slot="secondary"
									onEdit={() => setExerciseModal('secondary')}
									onRemove={clearSecondary}
								/>
							)}
						</div>

						<button
							type="button"
							onClick={() => setExerciseModal('secondary')}
							disabled={!!selectedSecondaryId}
							className={`border-border text-sub hover:text-main mt-auto flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed px-3 py-2 text-xs transition ${
								selectedSecondaryId ? 'pointer-events-none opacity-40' : ''
							}`}
						>
							<Plus className="h-3.5 w-3.5" /> Add secondary exercise
						</button>
					</div>

					{/* Bottom-right — Resistance curve */}
					<div className={cellCls}>
						<p className={labelCls}>Resistance curve</p>
						<div className="grid flex-1 grid-cols-2 gap-2">
							{RESISTANCE_TILES.map(({ key, label, stroke, d }) => {
								const active = resistance === key;
								return (
									<button
										key={key}
										type="button"
										onClick={() => setResistance(active ? null : key)}
										className={`${tileBase} ${active ? tileActive : tileIdle}`}
									>
										<svg width="40" height="22" viewBox="0 0 36 20" fill="none" className="shrink-0">
											<path
												d={d}
												stroke={stroke}
												strokeWidth="1.75"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										<span className="text-[11px] font-medium">{label}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Submit */}
				<button
					type="button"
					onClick={handleCreate}
					disabled={!isValid || isCreating}
					className="bg-main text-bg flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
					{isCreating ? 'Creating...' : 'Create machine'}
				</button>
			</div>

			{/* ── Modals ── */}
			{showBrandModal && (
				<BrandPickerModal
					selected={selectedBrand}
					onConfirm={handleBrandConfirm}
					onClose={() => setShowBrandModal(false)}
				/>
			)}
			{showSeriesModal && selectedBrand && (
				<SeriesPickerModal
					brandId={selectedBrand.id}
					brandName={selectedBrand.name}
					selected={series}
					onConfirm={(s) => {
						setSeries(s);
						setShowSeriesModal(false);
					}}
					onClose={() => setShowSeriesModal(false)}
				/>
			)}
			{exerciseModal && (
				<ExercisePickerModal
					title={exerciseModal === 'primary' ? 'Select exercise' : 'Select secondary exercise'}
					exercises={exercises}
					selectedId={exerciseModal === 'primary' ? selectedExerciseId : selectedSecondaryId}
					excludeId={exerciseModal === 'primary' ? selectedSecondaryId : selectedExerciseId}
					onConfirm={handleExerciseConfirm}
					onClose={() => setExerciseModal(null)}
				/>
			)}
		</>
	);
}
