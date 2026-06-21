export interface PendingGym {
	id: number;
	name: string;
	city?: string;
	country?: string;
	address?: string;
	instagram?: string;
	created_at: string;
	submitted_by?: string;
}

export interface PendingEquipment {
	id: number;
	brand: string;
	series: string;
	name: string;
	type: string;
	created_at: string;
	submitted_by?: string;
	image_url?: string;
}

export interface PendingSuggestion {
	id: number;
	gym_name: string;
	equipment_name: string;
	equipment_image_url?: string;
	quantity: number;
	created_at: string;
	submitted_by?: string;
}

export interface PendingPhoto {
	id: number;
	brand: string;
	series: string | null;
	name: string;
	image_url: string;
	photo_uploaded_at: string;
	submitted_by?: string;
}

export interface PendingVariant {
	id: number;
	equipment_id: number;
	equipment_name: string;
	equipment_image_url?: string;
	label: string;
	variation_type: 'grip' | 'unilateral' | 'incline';
	is_default: boolean;
	created_at: string;
	submitted_by?: string;
}

export interface PendingWeightStack {
	id: number;
	brand: string;
	series: string | null;
	name: string;
	image_url?: string;
	weight_stack: number | null;
	pending_weight_stack: number;
	submitted_by?: string;
}

export interface PendingGymInstagram {
	id: number;
	name: string;
	city?: string;
	country?: string;
	image_url?: string;
	instagram: string | null;
	pending_instagram: string;
	submitted_by?: string;
}

export interface PendingFreeWeights {
	id: number;
	gym_id: number;
	gym_name: string;
	city?: string;
	country?: string;
	image_url?: string;
	dumbbell_min_kg: number | null;
	dumbbell_max_kg: number | null;
	dumbbell_racks: number;
	squat_racks: number;
	flat_benches: number;
	incline_benches: number;
	platforms: number;
	preacher_curl_stations: number;
	submitted_by?: string;
	created_at: string;
}

export interface AdminUser {
	id: string;
	email: string;
	role: 'user' | 'admin' | 'super_admin';
	created_at: string;
}
