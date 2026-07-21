'use client';

import { Star } from 'lucide-react';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { useState } from 'react';

type RatingStarsProps = {
	avgRating?: number;
	userRating?: number;
	onRate?: (rating: number) => void;
	gated?: boolean;
};

export default function RatingStars({
	avgRating = 0,
	userRating,
	onRate,
	gated = true
}: RatingStarsProps) {
	const { requireAuth } = useAuthGate();
	const [hoverRating, setHoverRating] = useState(0);

	const currentRating = Number(userRating) || 0;
	const hasUserRating = !!userRating;
	const displayRating = hoverRating || currentRating || Number(avgRating) || 0;

	const handleStarClick = (starValue: number) => {
		if (gated && !requireAuth('rate equipment')) return;
		const newRating = starValue === currentRating ? 0 : starValue;
		onRate?.(newRating);
	};

	const handleMouseEnter = (starValue: number) => setHoverRating(starValue);
	const handleMouseLeave = () => setHoverRating(0);

	return (
		<div className="flex items-center gap-1.5">
			<div className="flex">
				{[...Array(5)].map((_, i) => {
					const starNumber = i + 1;
					const isFilled = starNumber <= displayRating;
					const isUserRated = hasUserRating && starNumber <= currentRating;
					const isHovered = hoverRating > 0 && starNumber <= hoverRating;

					return (
						<button
							key={i}
							onClick={() => handleStarClick(starNumber)}
							onMouseEnter={() => handleMouseEnter(starNumber)}
							onMouseLeave={handleMouseLeave}
							className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
							aria-label={`Rate ${starNumber} stars`}
						>
							<Star
								className={`h-5 w-5 transition-colors ${
									isHovered
										? 'fill-amber-400 text-amber-400'
										: isUserRated
											? 'fill-amber-400 text-amber-400'
											: isFilled
												? 'fill-sub text-sub'
												: 'text-sub'
								}`}
							/>
						</button>
					);
				})}
			</div>
			{displayRating > 0 && (
				<span className="text-sub text-xs">
					{hasUserRating ? currentRating.toFixed(1) : `${Number(avgRating).toFixed(1)} avg`}
				</span>
			)}
		</div>
	);
}
