export interface Gym {
	created_at: string | number | Date;
	is_favorite: boolean;
	id: number;
	name: string;
	slug?: string;
	address?: string | null;
	city?: string;
	country?: string;
	instagram?: string | null;
	lat: number;
	lng: number;
	total_equipment: number;
	unique_machines: number;
	rating?: number;
	avg_rating?: number;
	user_rating?: number;
	favourites?: number;
	image_url?: string;
	opening_hours?: {
		openNow: boolean;
		periods: {
			open: { day: number; hour: number; minute: number };
			close?: { day: number; hour: number; minute: number };
		}[];
		nextCloseTime?: string;
		weekdayDescriptions?: string[];
	};
	hours_updated_at?: string;
	equipment_images?: string[];
	free_weights?: GymFreeWeights | null;
}

export interface GymFreeWeights {
	gym_id: number;
	dumbbell_min_kg: number | null;
	dumbbell_max_kg: number | null;
	dumbbell_racks: number;
	squat_racks: number;
	flat_benches: number;
	incline_benches: number;
	platforms: number;
	preacher_curl_stations: number;
	verified: boolean;
	updated_at?: string;
}

export type GymFreeWeightsInput = Omit<GymFreeWeights, 'gym_id' | 'verified' | 'updated_at'>;

export interface GymEquipment {
	equipment_id: number;
	brand: string;
	series: string;
	name: string;
	full_name: string;
	quantity: number;
	image_url?: string | null;
	status?: 'approved' | 'pending';
}

export interface GymWithQuantity {
	id: number;
	name: string;
	city?: string;
	quantity: number;
	avg_rating?: number;
}
