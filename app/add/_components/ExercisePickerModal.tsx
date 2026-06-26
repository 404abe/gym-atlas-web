'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

type Exercise = { id: string; name: string };

type Props = {
	title: string;
	exercises: Exercise[];
	selectedId: string | null;
	/** Hide an already-picked exercise (e.g. the primary when choosing a secondary). */
	excludeId?: string | null;
	onConfirm: (id: string, name: string) => void;
	onClose: () => void;
};

export default function ExercisePickerModal({
	title,
	exercises,
	selectedId,
	excludeId,
	onConfirm,
	onClose
}: Props) {
	const [search, setSearch] = useState('');
	const [pendingId, setPendingId] = useState<string | null>(selectedId);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const trimmed = search.trim().toLowerCase();
	const filtered = exercises
		.filter((ex) => ex.id !== excludeId)
		.filter((ex) => ex.name.toLowerCase().includes(trimmed));

	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) onClose();
		},
		[onClose]
	);

	const handleConfirm = () => {
		const match = exercises.find((ex) => ex.id === pendingId);
		if (match) onConfirm(match.id, match.name);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={handleOverlayClick}
		>
			<div
				className="bg-surface border-border flex w-full max-w-sm flex-col rounded-2xl border shadow-xl"
				style={{ maxHeight: '80vh' }}
			>
				{/* Header */}
				<div className="border-border flex items-center justify-between border-b px-5 py-4">
					<h2 className="text-main text-base font-semibold">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-sub hover:text-main rounded-lg p-1 transition"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Search */}
				<div className="border-border border-b px-5 py-3">
					<div className="border-border bg-sub-alt flex items-center gap-2 rounded-lg border px-3 py-2">
						<Search className="text-sub h-3.5 w-3.5 shrink-0" />
						<input
							ref={inputRef}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search exercises…"
							className="text-main placeholder:text-sub w-full bg-transparent text-sm outline-none"
						/>
					</div>
				</div>

				{/* List */}
				<div className="min-h-0 flex-1 overflow-y-auto">
					<div className="divide-border divide-y">
						{filtered.map((ex) => {
							const isSelected = ex.id === pendingId;
							return (
								<button
									key={ex.id}
									type="button"
									onClick={() => setPendingId(ex.id)}
									className={`flex w-full items-center px-5 py-3 text-left transition ${
										isSelected ? 'bg-sub-alt' : 'hover:bg-sub-alt'
									}`}
								>
									<span className={`text-sm font-medium ${isSelected ? 'text-main' : 'text-sub'}`}>
										{ex.name}
									</span>
								</button>
							);
						})}

						{filtered.length === 0 && (
							<p className="text-sub py-4 text-center text-sm">No exercises found</p>
						)}
					</div>
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
						onClick={handleConfirm}
						disabled={!pendingId}
						className="bg-main text-bg rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
