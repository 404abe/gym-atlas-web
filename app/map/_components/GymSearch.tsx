'use client';

import { Target, Plus, X, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Gym } from '@/types/gym';
import { API_URL } from '@/lib/config';
import { matchesSearch } from '@/lib/utils';

type Equipment = {
	id: number;
	name: string;
	brand: string;
	series: string;
	slug: string;
};

export default function GymSearch({ onResults }: { onResults: (gyms: Gym[] | null) => void }) {
	const [machineInputs, setMachineInputs] = useState<string[]>(['']);
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [loading, setLoading] = useState(false);
	const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

	const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const formatSlug = (slug?: string) => {
		if (!slug) return 'Unknown';
		return slug
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	};

	useEffect(() => {
		const load = async () => {
			const res = await fetch(`${API_URL}/equipment`);
			const data = await res.json();
			setEquipment(data.data ?? data);
		};
		load();
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (openDropdownIndex !== null) {
				const dropdown = dropdownRefs.current[openDropdownIndex];
				const input = inputRefs.current[openDropdownIndex];
				if (
					dropdown &&
					!dropdown.contains(event.target as Node) &&
					input &&
					!input.contains(event.target as Node)
				) {
					setOpenDropdownIndex(null);
				}
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [openDropdownIndex]);

	const updateMachineInput = (index: number, value: string) => {
		const updated = [...machineInputs];
		updated[index] = value;
		setMachineInputs(updated);
		if (value.trim()) setOpenDropdownIndex(index);
		else setOpenDropdownIndex(null);
	};

	const addFilter = () => {
		setMachineInputs((prev) => [...prev, '']);
		setOpenDropdownIndex(null);
	};

	const removeFilter = (index: number) => {
		setMachineInputs((prev) => {
			const updated = prev.filter((_, i) => i !== index);
			return updated.length ? updated : [''];
		});
		setOpenDropdownIndex(null);
	};

	const handleSuggestionClick = (index: number, suggestion: Equipment) => {
		const updated = [...machineInputs];
		updated[index] = formatSlug(suggestion.slug);
		setMachineInputs(updated);
		setOpenDropdownIndex(null);
		inputRefs.current[index]?.focus();
	};

	const handleInputBlur = (index: number) => {
		setTimeout(() => {
			if (openDropdownIndex === index) setOpenDropdownIndex(null);
		}, 200);
	};

	const getSuggestions = (value: string) =>
		value.trim()
			? equipment.filter((item) => matchesSearch(value, item.brand, item.series, item.name))
			: [];

	const handleSearch = async () => {
		const activeFilters = machineInputs.map((f) => f.trim()).filter(Boolean);
		if (activeFilters.length === 0) {
			onResults(null);
			return;
		}
		try {
			setLoading(true);
			const res = await fetch(`${API_URL}/gyms/search`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ machines: activeFilters })
			});
			const data = await res.json();
			console.log('search result:', data); // add here
			const result = Array.isArray(data) ? data : (data.data ?? []);
			onResults(Array.isArray(result) ? result : []);
			setOpenDropdownIndex(null);
		} catch (err) {
			console.error(err);
			onResults([]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div id="GymSearch" className="bg-sub-alt rounded-2xl p-4">
			<h2 className="text-main mb-3 text-sm font-semibold">Find a machine</h2>

			{machineInputs.map((value, index) => {
				const suggestions = getSuggestions(value);
				const showDropdown = openDropdownIndex === index && suggestions.length > 0 && value.trim();

				return (
					<div key={index} className="relative mb-2">
						<div className="bg-main/5 flex items-center gap-2 rounded-lg px-3 py-2">
							<Target className="text-sub h-3.5 w-3.5 shrink-0" />
							<input
								ref={(el) => {
									inputRefs.current[index] = el;
								}}
								value={value}
								placeholder="Search machine..."
								onChange={(e) => updateMachineInput(index, e.target.value)}
								onFocus={() => {
									if (value.trim()) setOpenDropdownIndex(index);
								}}
								onBlur={() => handleInputBlur(index)}
								className="text-main placeholder:text-sub flex-1 bg-transparent text-sm outline-none"
							/>
							{machineInputs.length > 1 && (
								<button onClick={() => removeFilter(index)} aria-label="Remove filter">
									<X className="text-sub hover:text-main h-3.5 w-3.5" />
								</button>
							)}
						</div>

						{showDropdown && (
							<div
								ref={(el) => {
									dropdownRefs.current[index] = el;
								}}
								className="bg-sub-alt absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl shadow-lg"
							>
								{suggestions.slice(0, 8).map((item) => (
									<div
										key={item.id}
										onMouseDown={(e) => {
											e.preventDefault();
											handleSuggestionClick(index, item);
										}}
										className="hover:bg-main/5 cursor-pointer px-3 py-2"
									>
										<p className="text-main text-sm">{formatSlug(item.slug)}</p>
										<p className="text-sub text-xs">
											{item.brand} · {item.series}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}

			<button
				onClick={addFilter}
				className="text-sub hover:text-main mt-1 flex items-center gap-1.5 text-xs transition"
			>
				<Plus className="h-3.5 w-3.5" />
				Add machine
			</button>

			<button
				onClick={handleSearch}
				className="bg-main text-bg mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition hover:opacity-90"
			>
				<Search className="h-3.5 w-3.5" />
				{loading ? 'Searching...' : 'Search'}
			</button>
		</div>
	);
}
