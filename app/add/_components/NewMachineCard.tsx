'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ChevronDown, ExternalLink, Loader2, Plus } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import {
	fetchMachineExercises,
	createEquipment,
	uploadEquipmentImage,
	rateEquipment,
	checkEquipmentDuplicate
} from '@/lib/api';
import type { Brand, DuplicateMatch } from '@/lib/api';
import ImageTile from './ImageTile';
import TypeButtons from './TypeButtons';
import ResistanceButtons from './ResistanceButtons';
import BrandPickerModal from './BrandPickerModal';
import SeriesPickerModal from './SeriesPickerModal';
import { DEFAULT_CURVE } from '@/components/ui/CustomCurveEditor';
import RatingRow from './RatingRow';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';

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

function ExerciseCombobox({
	label,
	exercises,
	search,
	onSearchChange,
	onSelect,
	show,
	setShow,
	onClear
}: {
	label: string;
	exercises: { id: string; name: string }[];
	search: string;
	onSearchChange: (value: string) => void;
	onSelect: (id: string, name: string) => void;
	show: boolean;
	setShow: (value: boolean) => void;
	onClear?: () => void;
}) {
	const filtered = exercises
		.filter((ex) => ex.name.toLowerCase().includes(search.trim().toLowerCase()))
		.slice(0, 8);

	return (
		<div className="bg-sub-alt relative rounded-2xl p-3">
			<div className="flex items-center justify-between">
				<p className="text-sub mb-2 text-[11px]">{label}</p>
				{onClear && (
					<button
						type="button"
						onClick={onClear}
						className="text-sub hover:text-main -mt-1 text-xs transition"
						aria-label="Clear secondary exercise"
					>
						✕
					</button>
				)}
			</div>
			<input
				value={search}
				onChange={(e) => {
					onSearchChange(e.target.value);
					setShow(true);
				}}
				onFocus={() => setShow(true)}
				onBlur={() => setTimeout(() => setShow(false), 150)}
				placeholder="Search exercises"
				className="bg-transparent text-main placeholder:text-sub w-full border-none outline-none text-sm"
			/>
			{show && filtered.length > 0 && (
				<div className="bg-sub-alt absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl shadow-lg">
					{filtered.map((ex) => (
						<div
							key={ex.id}
							onMouseDown={(e) => {
								e.preventDefault();
								onSelect(ex.id, ex.name);
								setShow(false);
							}}
							className="hover:bg-main/10 text-main cursor-pointer px-3 py-2 text-sm"
						>
							{ex.name}
						</div>
					))}
				</div>
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
	const [exerciseSearch, setExerciseSearch] = useState('');
	const [secondarySearch, setSecondarySearch] = useState('');
	const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
	const [selectedExerciseName, setSelectedExerciseName] = useState('');
	const [selectedSecondaryId, setSelectedSecondaryId] = useState<string | null>(null);
	const [selectedSecondaryName, setSelectedSecondaryName] = useState('');
	const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
	const [showSecondaryDropdown, setShowSecondaryDropdown] = useState(false);

	const [showBrandModal, setShowBrandModal] = useState(false);
	const [showSeriesModal, setShowSeriesModal] = useState(false);

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

	const slug = [selectedBrand?.name ?? '', series, name].filter(Boolean).map(toSlug).join('-');
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

	const handleBrandConfirm = (brand: Brand) => {
		setSelectedBrand(brand);
		setSeries('');
		setDuplicateMatch(null);
		setDuplicateDismissed(false);
		setShowBrandModal(false);
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
			setExerciseSearch('');
			setSecondarySearch('');
			setSelectedExerciseId(null);
			setSelectedExerciseName('');
			setSelectedSecondaryId(null);
			setSelectedSecondaryName('');
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

	const exercisePickers = (
		<div className="flex flex-col gap-3">
			<ExerciseCombobox
				label="primary exercise"
				exercises={exercises}
				search={exerciseSearch}
				onSearchChange={(value) => {
					setExerciseSearch(value);
					setSelectedExerciseId(null);
					setSelectedExerciseName('');
				}}
				onSelect={(id, exName) => {
					setSelectedExerciseId(id);
					setSelectedExerciseName(exName);
					setExerciseSearch(exName);
				}}
				show={showExerciseDropdown}
				setShow={setShowExerciseDropdown}
			/>
			{selectedExerciseId && (
				<ExerciseCombobox
					label="secondary exercise"
					exercises={exercises}
					search={secondarySearch}
					onSearchChange={(value) => {
						setSecondarySearch(value);
						setSelectedSecondaryId(null);
						setSelectedSecondaryName('');
					}}
					onSelect={(id, exName) => {
						setSelectedSecondaryId(id);
						setSelectedSecondaryName(exName);
						setSecondarySearch(exName);
					}}
					show={showSecondaryDropdown}
					setShow={setShowSecondaryDropdown}
					onClear={() => {
						setSelectedSecondaryId(null);
						setSelectedSecondaryName('');
						setSecondarySearch('');
					}}
				/>
			)}
		</div>
	);

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

					{exercisePickers}

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

					{exercisePickers}

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
