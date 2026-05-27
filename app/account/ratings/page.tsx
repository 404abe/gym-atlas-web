'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchUserRatingsGyms, fetchUserRatingsEquipment } from '@/lib/api';
import Link from 'next/link';
import { MapPin, Dumbbell, Star } from 'lucide-react';
import type { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';

type RatedGym = Pick<Gym, 'id' | 'name' | 'city' | 'country'> & { rating: number };
type RatedEquip = Pick<Equipment, 'id' | 'name' | 'brand' | 'series' | 'slug' | 'image_url'> & { rating: number };

function StarRating({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					className={`h-3 w-3 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-sub opacity-30'}`}
				/>
			))}
		</div>
	);
}

export default function RatingsPage() {
	const { user, loading: authLoading } = useAuth();
	const [tab, setTab] = useState<'gyms' | 'equipment'>('gyms');
	const [gyms, setGyms] = useState<RatedGym[]>([]);
	const [equipment, setEquipment] = useState<RatedEquip[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (authLoading) return;
		if (!user) {
			setLoading(false);
			return;
		}
		Promise.all([fetchUserRatingsGyms(user.id), fetchUserRatingsEquipment(user.id)])
			.then(([gymData, equipData]) => {
				setGyms((gymData as RatedGym[]) ?? []);
				setEquipment((equipData as RatedEquip[]) ?? []);
			})
			.finally(() => setLoading(false));
	}, [user, authLoading]);

	return (
		<div className="space-y-4">
			{/* Tabs */}
			<div className="bg-main/5 flex w-fit items-center rounded-xl p-1">
				<button
					onClick={() => setTab('gyms')}
					className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
						tab === 'gyms' ? 'bg-main text-bg' : 'text-sub hover:text-main'
					}`}
				>
					Gyms {!loading && <span className="ml-1 opacity-60">{gyms.length}</span>}
				</button>
				<button
					onClick={() => setTab('equipment')}
					className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
						tab === 'equipment' ? 'bg-main text-bg' : 'text-sub hover:text-main'
					}`}
				>
					Equipment {!loading && <span className="ml-1 opacity-60">{equipment.length}</span>}
				</button>
			</div>

			{loading ? (
				<p className="text-sub text-sm">Loading...</p>
			) : tab === 'gyms' ? (
				<div className="space-y-2">
					{gyms.length === 0 ? (
						<p className="text-sub text-sm">No gym ratings yet.</p>
					) : (
						gyms.map((g) => (
							<Link
								key={g.id}
								href={`/gyms/${g.id}`}
								className="bg-sub-alt hover:bg-main/5 flex items-center justify-between rounded-xl px-4 py-3 transition"
							>
								<div className="flex items-center gap-3">
									<div className="bg-main/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
										<MapPin className="text-sub h-4 w-4" />
									</div>
									<div>
										<p className="text-main text-sm font-medium">{g.name}</p>
										<p className="text-sub text-xs">
											{g.city}, {g.country}
										</p>
									</div>
								</div>
								<StarRating rating={g.rating} />
							</Link>
						))
					)}
				</div>
			) : (
				<div className="space-y-2">
					{equipment.length === 0 ? (
						<p className="text-sub text-sm">No equipment ratings yet.</p>
					) : (
						equipment.map((e) => (
							<Link
								key={e.id}
								href={`/equipment/${e.id}`}
								className="bg-sub-alt hover:bg-main/5 flex items-center justify-between rounded-xl px-4 py-3 transition"
							>
								<div className="flex items-center gap-3">
									{e.image_url ? (
										<img
											src={e.image_url}
											alt={e.name}
											className="h-9 w-9 shrink-0 rounded-lg object-cover"
										/>
									) : (
										<div className="bg-main/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
											<Dumbbell className="text-sub h-4 w-4" />
										</div>
									)}
									<div>
										<p className="text-main text-sm font-medium">{e.name}</p>
										<p className="text-sub text-xs">
											{e.brand}
											{e.series ? ` · ${e.series}` : ''}
										</p>
									</div>
								</div>
								<StarRating rating={e.rating} />
							</Link>
						))
					)}
				</div>
			)}
		</div>
	);
}
