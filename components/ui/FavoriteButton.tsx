'use client';

import { Heart } from 'lucide-react';
import { useAuthGate } from '@/app/contexts/AuthGateContext';

type FavoriteButtonProps = {
	isFavorite?: boolean;
	onToggle?: () => void;
	requireAuth?: boolean;
};

export default function FavoriteButton({
	isFavorite,
	onToggle,
	requireAuth: gated = true
}: FavoriteButtonProps) {
	const { requireAuth } = useAuthGate();

	const handleClick = () => {
		if (gated && !requireAuth('save favourites')) return;
		onToggle?.();
	};

	return (
		<button onClick={handleClick} className="transition-transform hover:scale-110 active:scale-95">
			<Heart
				className={`h-4 w-4 transition-colors ${
					isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
				}`}
			/>
		</button>
	);
}
