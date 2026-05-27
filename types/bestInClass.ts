export interface BestInClassCategory {
	id: number;
	name: string;
	slug: string;
	type: 'muscle_group' | 'exercise';
}

export interface BestInClass {
	id: number;
	category_name: string;
	category_slug: string;
	category_type: 'muscle_group' | 'exercise';
	equipment_id: number;
	brand: string;
	series?: string;
	equipment_name: string;
	image_url?: string;
}

export interface BestInClassEntry {
	category_id: number;
	equipment_id: number;
}
