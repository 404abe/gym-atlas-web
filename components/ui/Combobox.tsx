'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { matchesSearch } from '@/lib/utils';

type ComboboxProps = {
	value: string;
	onChange: (val: string) => void;
	options: string[];
	placeholder: string;
	loading?: boolean;
	inputClassName?: string;
};

export default function Combobox({
	value,
	onChange,
	options,
	placeholder,
	loading = false,
	inputClassName = ''
}: ComboboxProps) {
	const [focused, setFocused] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const filtered = value ? options.filter((o) => matchesSearch(value, o)) : options;

	// Show dropdown if focused—even if no items match, so we can display a "No results" helper
	const showDropdown = focused;

	// Handle clicking outside the combobox container to close it safely
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setFocused(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={containerRef} className="relative">
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				placeholder={placeholder}
				className={inputClassName}
				autoComplete="off"
				spellCheck={false}
			/>

			{showDropdown && (
				<div className="bg-surface absolute left-0 top-full z-50 mt-1 max-h-48 w-40 overflow-y-auto rounded-xl shadow-lg">
					{loading ? (
						<div className="text-sub flex items-center gap-2 px-3 py-2 text-xs">
							<Loader2 className="h-3 w-3 animate-spin" />
							Loading...
						</div>
					) : filtered.length > 0 ? (
						filtered.map((opt) => (
							<button
								key={opt}
								type="button"
								onClick={() => {
									onChange(opt);
									setFocused(false);
								}}
								className={`text-main hover:bg-sub-alt w-full px-3 py-2 text-left text-sm transition ${
									opt === value ? 'bg-sub-alt font-medium' : ''
								}`}
							>
								{opt}
							</button>
						))
					) : (
						// Helpful fallback states so the container doesn't display empty space
						<div className="text-sub px-3 py-2 text-xs italic">No results found</div>
					)}
				</div>
			)}
		</div>
	);
}
