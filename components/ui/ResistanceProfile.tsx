'use client';

import { Minus, SlidersHorizontal, TrendingDown, TrendingUp } from 'lucide-react';

type ResistanceProfileProps = {
	profile?: 'constant' | 'ascending' | 'descending' | 'adjustable';
};

export default function ResistanceProfile({ profile }: ResistanceProfileProps) {
	if (!profile || profile === 'constant') {
		return (
			<div className="flex items-center gap-2">
				<Minus className="h-3.5 w-3.5 text-gray-500" />
				<svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
					<line x1="0" y1="8" x2="40" y2="8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
				</svg>
				<span className="hidden text-xs text-gray-500 sm:inline">Constant</span>
			</div>
		);
	}

	if (profile === 'ascending') {
		return (
			<div className="flex items-center gap-2">
				<TrendingUp className="h-3.5 w-3.5 text-green-600" />
				<svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
					<polyline points="0,14 15,10 30,4 40,0" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className="hidden text-xs text-green-600 sm:inline">Ascending</span>
			</div>
		);
	}

	if (profile === 'descending') {
		return (
			<div className="flex items-center gap-2">
				<TrendingDown className="h-3.5 w-3.5 text-red-500" />
				<svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
					<polyline points="0,0 10,4 25,10 40,14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className="hidden text-xs text-red-500 sm:inline">Descending</span>
			</div>
		);
	}

	if (profile === 'adjustable') {
		return (
			<div className="flex items-center gap-2">
				<SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
				<svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
					<polyline points="0,11 10,5 20,11 30,5 40,11" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<span className="hidden text-xs text-blue-500 sm:inline">Adjustable</span>
			</div>
		);
	}

	return null;
}
