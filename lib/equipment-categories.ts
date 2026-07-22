export const EQUIPMENT_CATEGORY_MAP: Record<string, { muscles: string[]; exercises: string[] }> = {
	'Chest Press': {
		muscles: ['Chest', 'Triceps', 'Shoulders'],
		exercises: ['Chest Press', 'Incline Chest Press', 'Chest Fly']
	},
	'Overhead Press': {
		muscles: ['Shoulders', 'Triceps'],
		exercises: ['Overhead Press', 'Shoulder Press']
	},
	'Shoulder Press': {
		muscles: ['Shoulders', 'Triceps'],
		exercises: ['Shoulder Press', 'Lateral Raise']
	},
	'Leg Press': {
		muscles: ['Quads', 'Glutes', 'Hamstrings'],
		exercises: ['Leg Press', 'Hack Squat', 'Pendulum Squat']
	},
	'Lat Pulldown': {
		muscles: ['Lats', 'Upper Back', 'Biceps'],
		exercises: ['Lat Pulldown']
	},
	'Leg Extension': { muscles: ['Quads'], exercises: ['Leg Extension'] },
	'Leg Curl': {
		muscles: ['Hamstrings'],
		exercises: ['Lying Hamstring Curl', 'Seated Hamstring Curl']
	},
	'Seated Row': {
		muscles: ['Upper Back', 'Lats', 'Biceps'],
		exercises: ['Lat Row', 'Upper Back Row', 'T-Bar Row']
	},
	'Calf Raise': {
		muscles: ['Calves'],
		exercises: ['Seated Calf Raise', 'Standing Calf Raise']
	},
	'Bicep Curl': { muscles: ['Biceps'], exercises: ['Bicep Curl'] },
	'Tricep Extension': {
		muscles: ['Triceps'],
		exercises: ['Tricep Extension', 'Tricep Pushdown']
	},
	'Ab Crunch': { muscles: ['Abs'], exercises: ['Ab Crunch'] },
	'Glute Kickback': { muscles: ['Glutes'], exercises: ['Glute Kickback'] },
	'Hip Abduction': { muscles: ['Glutes'], exercises: ['Hip Abduction'] },
	'Hip Adduction': { muscles: ['Glutes'], exercises: ['Hip Adduction'] },
	'Hip Thrust': {
		muscles: ['Glutes', 'Hamstrings'],
		exercises: ['Hip Thrust']
	},
	'Seated Dip': { muscles: ['Triceps', 'Chest'], exercises: ['Seated Dip'] }
};

export const EQUIPMENT_CATEGORY_DEFAULT = {
	muscles: ['Chest', 'Triceps', 'Shoulders'],
	exercises: ['Chest Press', 'Incline Chest Press', 'Chest Fly']
};

export function getMusclesForExercise(exerciseName: string): string[] {
	const lower = exerciseName.toLowerCase();
	for (const entry of Object.values(EQUIPMENT_CATEGORY_MAP)) {
		if (entry.exercises.some((ex) => ex.toLowerCase() === lower)) {
			return entry.muscles;
		}
	}
	return [];
}

export function getEquipmentCategorySuggestions(
	name: string,
	{ fallback }: { fallback: boolean } = { fallback: false }
) {
	const lower = name.toLowerCase();
	const key = Object.keys(EQUIPMENT_CATEGORY_MAP).find((k) => lower.includes(k.toLowerCase()));
	if (key) return EQUIPMENT_CATEGORY_MAP[key];
	return fallback ? EQUIPMENT_CATEGORY_DEFAULT : null;
}
