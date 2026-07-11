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
	// TODO(backend): the machine → exercise relationship is stored in the DB
	// (equipment.exercise_id / secondary_exercise_id) but is NOT returned by the
	// `/equipment` read endpoint yet. Until it is, the exercise for a machine is
	// inferred client-side from its name via predictExercise() — see
	// lib/gym-filter.ts. Populate these once the API exposes the fields.
	exercise?: ExerciseRef | null;
	secondary_exercise?: ExerciseRef | null;
}
