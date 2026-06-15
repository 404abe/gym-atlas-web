// types/equipment.ts
export interface EquipmentVariant {
	id: number;
	label: string;
	variation_type: 'grip' | 'unilateral' | 'incline';
	is_default: boolean;
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
}
