import type { ExerciseRef } from './equipment';

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
	// TODO(backend): `/gyms` does not return the gym's machine list or its derived
	// exercises. When the API exposes them, a gym's available exercises are:
	//   gym.exercises = unique(gym.machines.map(m => m.exercise))
	// See deriveGymExercises() in lib/gym-filter.ts. Until then, matching gyms for
	// a filter are resolved on demand via POST /gyms/search (GymFilterContext).
	machines?: GymEquipment[];
	exercises?: ExerciseRef[];
}

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
