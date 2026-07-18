'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

type RatingRowProps = {
	rating: number;
	setRating: (r: number) => void;
};

export default function RatingRow({ rating, setRating }: RatingRowProps) {
	const [hoverRating, setHoverRating] = useState(0);
	return (
		<div className="flex gap-1">
			{[1, 2, 3, 4, 5].map((s) => (
				<button
					key={s}
					type="button"
					onMouseEnter={() => setHoverRating(s)}
					onMouseLeave={() => setHoverRating(0)}
					onClick={() => setRating(s === rating ? 0 : s)}
					aria-label={`Rate ${s} star${s === 1 ? '' : 's'}`}
					className="p-0.5 transition"
				>
					<Star
						className={`h-4 w-4 transition ${
							s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-sub'
						}`}
					/>
				</button>
			))}
		</div>
	);
}
