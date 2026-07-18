'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, Plus, Search, X } from 'lucide-react';
import { fetchBrands, createBrand, uploadBrandLogo } from '@/lib/api';
import type { Brand } from '@/lib/api';

type Props = {
	selected: Brand | null;
	onConfirm: (brand: Brand) => void;
	onClose: () => void;
};

type View = 'grid' | 'add';

function abbrev(name: string): string {
	return name.slice(0, 3).toUpperCase();
}

// ── Brand tile ────────────────────────────────────────────────────────────────

function BrandTile({
	brand,
	isSelected,
	onSelect
}: {
	brand: Brand;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`flex flex-col overflow-hidden rounded-xl border text-left transition ${
				isSelected
					? 'border-main bg-sub-alt'
					: 'border-border hover:border-sub hover:bg-sub-alt'
			}`}
		>
			{/* Logo / abbrev area */}
			<div
				className={`flex aspect-square w-full items-center justify-center overflow-hidden ${
					brand.logo_url ? 'bg-white' : isSelected ? 'bg-main' : 'bg-sub-alt'
				}`}
			>
				{brand.logo_url ? (
					<img
						src={brand.logo_url}
						alt={brand.name}
						className="h-full w-full object-contain p-2"
					/>
				) : (
					<span
						className={`font-mono text-sm font-semibold ${
							isSelected ? 'text-bg' : 'text-sub'
						}`}
					>
						{abbrev(brand.name)}
					</span>
				)}
			</div>
			{/* Name + count */}
			<div className="flex flex-col gap-0.5 p-2">
				<span className="text-main line-clamp-1 text-xs font-medium leading-tight">
					{brand.name}
				</span>
				<span className="text-sub text-[10px]">{brand.equipment_count} machines</span>
			</div>
		</button>
	);
}

// ── Add brand sub-flow ────────────────────────────────────────────────────────

function AddBrandView({
	onBack,
	onCreated
}: {
	onBack: () => void;
	onCreated: (brand: Brand) => void;
}) {
	const [brandName, setBrandName] = useState('');
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const nameRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		nameRef.current?.focus();
	}, []);

	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setLogoFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const handleSubmit = async () => {
		if (!brandName.trim() || submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			const brand = await createBrand(brandName.trim());
			let finalBrand = brand;
			if (logoFile) {
				finalBrand = await uploadBrandLogo(brand.id, logoFile);
			}
			onCreated({ ...finalBrand, equipment_count: 0 });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create brand');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex flex-col gap-4 px-5 py-5">
				{/* Brand name */}
				<div className="flex flex-col gap-1.5">
					<label className="text-sub text-[11px]">Brand name</label>
					<input
						ref={nameRef}
						value={brandName}
						onChange={(e) => setBrandName(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
						placeholder="e.g. Life Fitness"
						className="border-border bg-sub-alt text-main placeholder:text-sub w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-main"
					/>
				</div>

				{/* Logo upload */}
				<div className="flex flex-col gap-1.5">
					<label className="text-sub text-[11px]">Logo (optional)</label>
					<label className="border-border hover:border-sub flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition">
						{logoPreview ? (
							<img
								src={logoPreview}
								alt="Logo preview"
								className="h-9 w-9 rounded object-contain"
							/>
						) : (
							<div className="bg-sub-alt border-border flex h-9 w-9 items-center justify-center rounded border">
								<Plus className="text-sub h-4 w-4" />
							</div>
						)}
						<span className="text-sub text-xs">
							{logoFile ? logoFile.name : 'Choose image…'}
						</span>
						<input
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleLogoChange}
						/>
					</label>
				</div>

				{error && <p className="text-sub text-xs">{error}</p>}
			</div>

			<div className="border-border mt-auto flex items-center justify-end gap-2 border-t px-5 py-4">
				<button
					type="button"
					onClick={onBack}
					className="border-border text-sub hover:text-main rounded-xl border px-4 py-2 text-sm transition"
				>
					Back
				</button>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!brandName.trim() || submitting}
					className="bg-main text-bg flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
					{submitting ? 'Creating…' : 'Create brand'}
				</button>
			</div>
		</div>
	);
}

// ── Modal shell ───────────────────────────────────────────────────────────────

export default function BrandPickerModal({ selected, onConfirm, onClose }: Props) {
	const [view, setView] = useState<View>('grid');
	const [brands, setBrands] = useState<Brand[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [pending, setPending] = useState<Brand | null>(selected);
	const searchRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let cancelled = false;
		fetchBrands()
			.then((data) => { if (!cancelled) setBrands(data); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	useEffect(() => {
		if (view === 'grid') searchRef.current?.focus();
	}, [view]);

	const filtered = search.trim()
		? brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
		: brands;

	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) onClose();
		},
		[onClose]
	);

	const handleBrandCreated = (brand: Brand) => {
		setBrands((prev) => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)));
		setPending(brand);
		setView('grid');
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={handleOverlayClick}
		>
			<div
				className="bg-surface border-border flex w-full max-w-md flex-col rounded-2xl border shadow-xl"
				style={{ maxHeight: '80vh' }}
			>
				{/* Header */}
				<div className="border-border flex items-center gap-3 border-b px-5 py-4">
					{view === 'add' && (
						<button
							type="button"
							onClick={() => setView('grid')}
							aria-label="Back"
							className="text-sub hover:text-main shrink-0 rounded-lg p-0.5 transition"
						>
							<ArrowLeft className="h-4 w-4" />
						</button>
					)}
					<h2 className="text-main flex-1 text-base font-semibold">
						{view === 'add' ? 'Add brand' : 'Select brand'}
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="text-sub hover:text-main shrink-0 rounded-lg p-1 transition"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{view === 'add' ? (
					<AddBrandView onBack={() => setView('grid')} onCreated={handleBrandCreated} />
				) : (
					<>
						{/* Search */}
						<div className="border-border border-b px-5 py-3">
							<div className="border-border bg-sub-alt flex items-center gap-2 rounded-lg border px-3 py-2">
								<Search className="text-sub h-3.5 w-3.5 shrink-0" />
								<input
									ref={searchRef}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search brands…"
									className="text-main placeholder:text-sub w-full bg-transparent text-sm outline-none"
								/>
							</div>
						</div>

						{/* Grid */}
						<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
							{loading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="text-sub h-5 w-5 animate-spin" />
								</div>
							) : (
								<div className="grid grid-cols-3 gap-2">
									{filtered.map((brand) => (
										<BrandTile
											key={brand.id}
											brand={brand}
											isSelected={pending?.id === brand.id}
											onSelect={() => setPending(brand)}
										/>
									))}

									{/* Add brand tile */}
									<button
										type="button"
										onClick={() => setView('add')}
										className="flex flex-col overflow-hidden rounded-xl transition hover:bg-sub-alt"
										style={{ border: '0.5px dashed var(--color-sub)' }}
									>
										<div className="bg-sub-alt flex aspect-square w-full items-center justify-center">
											<Plus className="text-sub h-5 w-5" />
										</div>
										<div className="p-2">
											<span className="text-sub text-xs font-medium">Add brand</span>
										</div>
									</button>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="border-border flex items-center justify-end gap-2 border-t px-5 py-4">
							<button
								type="button"
								onClick={onClose}
								className="border-border text-sub hover:text-main rounded-xl border px-4 py-2 text-sm transition"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => { if (pending) onConfirm(pending); }}
								disabled={!pending}
								className="bg-main text-bg rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Confirm
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
