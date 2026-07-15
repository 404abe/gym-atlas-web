// types/equipment.ts
export interface EquipmentVariant {
	id: number;
	label: string;
	variation_type: 'grip' | 'unilateral' | 'incline';
	is_default: boolean;
}

/** The movement a machine trains (e.g. "T-bar row"). */
export interface ExerciseRef {
	id: string;
	name: string;
}

export interface Equipment {
	created_at: string | number | Date;
	id: number;
	brand: string;
	series: string;
	name: string;
	slug: string;
	type: 'pin_loaded' | 'plate_loaded';
	weight_stack?: number | null;
	resistance_profile?: 'constant' | 'ascending' | 'descending' | 'adjustable' | 'custom';
	resistance_curve?: number[];
	rating?: number;
	avg_rating?: number;
	user_rating?: number;
	is_favorite?: boolean;
	image_url?: string;
	variants: EquipmentVariant[];
	// Populated by `/equipment` from equipment.exercise_id / secondary_exercise_id
	// when set. Older/uncategorized machines may still lack it, in which case
	// exerciseForMachine() (lib/gym-filter.ts) falls back to a name-based guess.
	exercise?: ExerciseRef | null;
	secondary_exercise?: ExerciseRef | null;
}
