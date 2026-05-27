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
}

export interface GymEquipment {
	equipment_id: number;
	brand: string;
	series: string;
	name: string;
	full_name: string;
	quantity: number;
}

export interface GymWithQuantity {
	id: number;
	name: string;
	city?: string;
	quantity: number;
	avg_rating?: number;
}
