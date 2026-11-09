import type { Equipment } from '@/types/equipment';
import type { BestInClassCategory } from '@/types/bestInClass';
import { getEquipmentCategorySuggestions } from '@/lib/equipment-categories';

/**
 * Whether a machine belongs under a Best in Class category.
 * Shared by the /data filters and the Best in Class machine picker.
 */
export function matchesBestInClassCategory(e: Equipment, cat: BestInClassCategory): boolean {
	if (cat.type === 'exercise') {
		return cat.id === e.exercise?.category_id || cat.id === e.secondary_exercise?.category_id;
	}
	// muscle_group matching still relies on the name-based heuristic — there's
	// no DB link from exercises to muscle groups yet.
	const catName = cat.name.toLowerCase();
	const eqName = e.name?.toLowerCase() ?? '';
	if (eqName.includes(catName) || catName.includes(eqName)) return true;
	const suggested = getEquipmentCategorySuggestions(e.name ?? '');
	if (suggested) return suggested.muscles.includes(cat.name);
	return false;
}
