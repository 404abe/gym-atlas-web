'use client';

import { Star } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RatingStarsProps = {
	avgRating?: number;
	userRating?: number;
	onRate?: (rating: number) => void;
	requireAuth?: boolean;
};

export default function RatingStars({
	avgRating = 0,
	userRating,
	onRate,
	requireAuth = true
}: RatingStarsProps) {
	const { user } = useAuth();
	const router = useRouter();
	const [hoverRating, setHoverRating] = useState(0);

	const currentRating = Number(userRating) || 0;
	const hasUserRating = !!userRating;
	const displayRating = hoverRating || currentRating || Number(avgRating) || 0;

	const handleStarClick = (starValue: number) => {
		if (requireAuth && !user) {
			router.push('/login');
			return;
		}
		const newRating = starValue === currentRating ? 0 : starValue;
		onRate?.(newRating);
	};

	const handleMouseEnter = (starValue: number) => {
		if (user || !requireAuth) setHoverRating(starValue);
	};

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
										? 'fill-yellow-400 text-yellow-400'
										: isUserRated
											? 'fill-yellow-400 text-yellow-400'
											: isFilled
												? 'fill-gray-300 text-gray-300'
												: 'text-gray-200'
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
