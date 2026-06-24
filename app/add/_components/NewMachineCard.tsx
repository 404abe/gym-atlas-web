'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ChevronDown, ExternalLink, Loader2, Plus } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import {
	fetchBestInClassCategories,
	createEquipment,
	uploadEquipmentImage,
	rateEquipment,
	setBestInClass,
	checkEquipmentDuplicate
} from '@/lib/api';
import type { Brand, DuplicateMatch } from '@/lib/api';
import type { BestInClassCategory } from '@/types/bestInClass';
import ImageTile from './ImageTile';
import TypeButtons from './TypeButtons';
import ResistanceButtons from './ResistanceButtons';
import BrandPickerModal from './BrandPickerModal';
import SeriesPickerModal from './SeriesPickerModal';
import { DEFAULT_CURVE } from '@/components/ui/CustomCurveEditor';
import RatingRow from './RatingRow';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { getEquipmentCategorySuggestions } from '@/lib/equipment-categories';

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
	onCreated: (equipment: Equipment) => void;
};

// ── Constants ────────────────────────────────────────────────────────────────

const tileCls = 'bg-sub-alt flex flex-col justify-between rounded-2xl p-3';
const labelCls = 'text-sub text-[11px]';
const bareInputCls =
	'bg-transparent text-main placeholder:text-sub w-full border-none outline-none font-[inherit]';

const toSlug = (str: string) =>
	str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

// ── Subcomponents ────────────────────────────────────────────────────────────

function SubmitButton({
	isValid,
	isCreating,
	onClick,
	className = ''
}: {
	isValid: boolean;
	isCreating: boolean;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={!isValid || isCreating}
			className={`bg-main text-bg flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
		>
			{isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
			{isCreating ? 'Creating...' : 'Create machine'}
		</button>
	);
}

function PickerButton({
	label,
	value,
	disabled,
	tooltip,
	onClick
}: {
	label: string;
	value: string;
	disabled?: boolean;
	tooltip?: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={tooltip}
			className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
				disabled
					? 'text-sub cursor-not-allowed opacity-40'
					: value
						? 'text-main hover:bg-sub-alt'
						: 'text-sub hover:text-main hover:bg-sub-alt'
			}`}
		>
			<span>{value || label}</span>
			<ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
		</button>
	);
}

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
				className="text-sub hover:text-main transition text-xs"
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>
	);
}

function MuscleGroupButtons({
	categories,
	selectedIds,
	onToggle,
	loading
}: {
	categories: BestInClassCategory[];
	selectedIds: number[];
	onToggle: (id: number) => void;
	loading: boolean;
}) {
	if (loading) {
		return <p className="text-sub mt-2 text-xs">Loading muscle groups...</p>;
	}

	return (
		<div className="mt-2 flex flex-wrap gap-2">
			{categories.map((category) => {
				const selected = selectedIds.includes(category.id);
				return (
					<button
						key={category.id}
						type="button"
						onClick={() => onToggle(category.id)}
						className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
							selected
								? 'bg-main text-bg border-transparent'
								: 'border-border text-sub hover:text-main'
						}`}
					>
						{category.name}
					</button>
				);
			})}
			{categories.length === 0 && (
				<p className="text-sub py-1 text-xs">No muscle groups available yet.</p>
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

	const [muscleGroups, setMuscleGroups] = useState<BestInClassCategory[]>([]);
	const [muscleGroupsLoading, setMuscleGroupsLoading] = useState(true);
	const [selectedMuscleIds, setSelectedMuscleIds] = useState<number[]>([]);

	const [showBrandModal, setShowBrandModal] = useState(false);
	const [showSeriesModal, setShowSeriesModal] = useState(false);

	const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch>(null);
	const [duplicateDismissed, setDuplicateDismissed] = useState(false);
	const duplicateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetchBestInClassCategories()
			.then((data) => {
				if (!cancelled) {
					setMuscleGroups(
						(data.categories ?? []).filter((c) => c.type === 'muscle_group')
					);
				}
			})
			.catch(() => {
				if (!cancelled) addToast('Failed to load muscle groups', 'error');
			})
			.finally(() => {
				if (!cancelled) setMuscleGroupsLoading(false);
			});
		return () => { cancelled = true; };
	}, [addToast]);

	// Muscle group suggestions based on name
	useEffect(() => {
		if (muscleGroupsLoading) return;
		const suggested = getEquipmentCategorySuggestions(name);
		if (!suggested) {
			setSelectedMuscleIds([]);
			return;
		}
		const ids = muscleGroups
			.filter((mg) => suggested.muscles.includes(mg.name))
			.map((mg) => mg.id);
		setSelectedMuscleIds(ids);
	}, [name, muscleGroups, muscleGroupsLoading]);

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

	const slug = [selectedBrand?.name ?? '', series, name].filter(Boolean).map(toSlug).join('-');
	const isValid = !!name && !!selectedBrand && !!series && !!type;
	const showDuplicate = !!duplicateMatch && !duplicateDismissed;

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setImagePreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const handleBrandConfirm = (brand: Brand) => {
		setSelectedBrand(brand);
		setSeries('');
		setDuplicateMatch(null);
		setDuplicateDismissed(false);
		setShowBrandModal(false);
	};

	const toggleMuscleGroup = (id: number) => {
		setSelectedMuscleIds((current) =>
			current.includes(id) ? current.filter((sid) => sid !== id) : [...current, id]
		);
	};

	const handleCreate = async () => {
		if (!isValid || isCreating || !selectedBrand) return;
		if (!requireAuth('add a machine')) return;
		setIsCreating(true);
		try {
			let failedToAssignMuscles = false;
			const created = await createEquipment({
				name,
				brand: selectedBrand.name,
				brand_id: selectedBrand.id,
				series,
				type,
				resistance_profile: resistance || undefined,
				resistance_curve: resistance === 'custom' ? resistanceCurve : undefined,
			});

			if (imageFile && created.id) await uploadEquipmentImage(created.id, imageFile);
			if (userRating > 0 && created.id) await rateEquipment(created.id, userRating);
			if (created.id && selectedMuscleIds.length > 0) {
				try {
					await Promise.all(
						selectedMuscleIds.map((categoryId) => setBestInClass(categoryId, created.id))
					);
				} catch {
					failedToAssignMuscles = true;
				}
			}

			onCreated(created);
			addToast(
				failedToAssignMuscles
					? `"${selectedBrand.name} ${series} ${name}" submitted, but muscle groups failed to save`
					: `"${selectedBrand.name} ${series} ${name}" submitted for review`,
				failedToAssignMuscles ? 'error' : 'success'
			);

			setSelectedBrand(null);
			setSeries('');
			setName('');
			setType(null);
			setResistance(null);
			setResistanceCurve(DEFAULT_CURVE);
			setUserRating(0);
			setImageFile(null);
			setImagePreview(null);
			setSelectedMuscleIds([]);
			setDuplicateMatch(null);
			setDuplicateDismissed(false);
		} catch (error) {
			console.error(error);
			addToast('Failed to create equipment', 'error');
		} finally {
			setIsCreating(false);
		}
	};

	const submitProps = { isValid, isCreating, onClick: handleCreate };

	const brandSeriesRow = (
		<div className="flex items-center gap-1.5">
			<PickerButton
				label="Brand"
				value={selectedBrand?.name ?? ''}
				onClick={() => setShowBrandModal(true)}
			/>
			<span className="text-sub text-xs">·</span>
			<PickerButton
				label="Series"
				value={series}
				disabled={!selectedBrand}
				tooltip={!selectedBrand ? 'Select a brand first' : undefined}
				onClick={() => setShowSeriesModal(true)}
			/>
		</div>
	);

	return (
		<>
			<div className="mx-auto w-full max-w-2xl">
				{/* Duplicate banner */}
				{showDuplicate && duplicateMatch && (
					<div className="mb-3">
						<DuplicateBanner
							match={duplicateMatch}
							onDismiss={() => setDuplicateDismissed(true)}
						/>
					</div>
				)}

				{/* ── Desktop Layout ── */}
				<div className="hidden flex-col gap-3 sm:flex">
					<div className="grid grid-cols-2 gap-3">
						<ImageTile
							preview={imagePreview}
							onImageChange={handleImageChange}
							className="aspect-square w-full"
						/>

						<div className="flex flex-col gap-3">
							<div className="bg-surface flex flex-1 flex-col justify-between rounded-2xl p-5">
								<div className="flex flex-col gap-3">
									{brandSeriesRow}
									<input
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Machine name"
										className={`${bareInputCls} text-main text-2xl font-semibold leading-tight`}
									/>
								</div>
								{slug && <p className="text-sub mt-2 truncate text-[11px]">{slug}</p>}
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className={tileCls}>
									<p className={labelCls}>type</p>
									<TypeButtons type={type} setType={setType} col />
								</div>
								<div className={tileCls}>
									<p className={labelCls}>resistance</p>
									<ResistanceButtons
										resistance={resistance}
										setResistance={setResistance}
										curve={resistanceCurve}
										onCurveChange={setResistanceCurve}
										col
									/>
								</div>
							</div>
						</div>
					</div>

					<div className={tileCls}>
						<p className={labelCls}>muscle groups</p>
						<MuscleGroupButtons
							categories={muscleGroups}
							selectedIds={selectedMuscleIds}
							onToggle={toggleMuscleGroup}
							loading={muscleGroupsLoading}
						/>
					</div>

					<div className="bg-sub-alt flex items-center gap-4 rounded-2xl px-4 py-3">
						<p className={`${labelCls} shrink-0`}>your rating</p>
						<RatingRow rating={userRating} setRating={setUserRating} />
					</div>

					<SubmitButton {...submitProps} />
				</div>

				{/* ── Mobile Stack Layout ── */}
				<div className="flex flex-col gap-3 sm:hidden">
					<ImageTile
						preview={imagePreview}
						onImageChange={handleImageChange}
						className="aspect-square w-full"
					/>

					<div className="bg-surface flex flex-col justify-between rounded-2xl p-5">
						<div className="flex flex-col gap-3">
							{brandSeriesRow}
							<input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Machine name"
								className={`${bareInputCls} text-main text-2xl font-semibold leading-tight`}
							/>
						</div>
						{slug && <p className="text-sub mt-2 truncate text-[11px]">{slug}</p>}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className={tileCls}>
							<p className={labelCls}>type</p>
							<TypeButtons type={type} setType={setType} col />
						</div>
						<div className={tileCls}>
							<p className={labelCls}>resistance</p>
							<ResistanceButtons
								resistance={resistance}
								setResistance={setResistance}
								curve={resistanceCurve}
								onCurveChange={setResistanceCurve}
								col
							/>
						</div>
					</div>

					<div className={tileCls}>
						<p className={labelCls}>muscle groups</p>
						<MuscleGroupButtons
							categories={muscleGroups}
							selectedIds={selectedMuscleIds}
							onToggle={toggleMuscleGroup}
							loading={muscleGroupsLoading}
						/>
					</div>

					<div className="bg-sub-alt flex items-center gap-4 rounded-2xl px-4 py-3">
						<p className={`${labelCls} shrink-0`}>your rating</p>
						<RatingRow rating={userRating} setRating={setUserRating} />
					</div>

					<SubmitButton {...submitProps} />
				</div>
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
		</>
	);
}
