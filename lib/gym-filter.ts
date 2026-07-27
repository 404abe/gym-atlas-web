// Map-filter model: filter gyms by the *exercise* a machine trains (broadest),
// by *brand* (broad), or by a *specific machine* (narrow). Selecting a filter
// highlights the matching gym pins on the map and dims the rest — it never
// re-queries the gym list or navigates.
//
// NOTE ON DATA: `/equipment` now returns machine.exercise when
// equipment.exercise_id is set, but a gym's machine list still isn't exposed on
// `/gyms`. Machines without an assigned exercise_id (legacy entries) still fall
// back to a name-based guess via predictExercise(). Everything marked STUB below
// collapses further once `/gyms` exposes a per-gym machine list.

import type { Equipment, ExerciseRef } from '@/types/equipment';
import type { Brand } from './api';
import { predictExercise } from './exercise-match';
import { matchesSearch } from './utils';

export type FilterKind = 'exercises' | 'machines' | 'brands';

export interface ActiveFilter {
	kind: FilterKind;
	/** Stable identity — exercise id for exercises, machine slug for machines. */
	key: string;
	/** Human-readable label shown in the top-right card and map badge. */
	name: string;
	/** Thumbnail for the top-right card (machines only; exercises fall back to an icon). */
	imageUrl?: string | null;
	/** Secondary line in the card — machine series, or the exercise category. */
	subtitle?: string | null;
}

/** Stable unique id for a filter, used to key its resolved gym set. */
export const filterId = (filter: ActiveFilter): string => `${filter.kind}:${filter.key}`;

/** Brand + series + name, matching how `/gyms/search` compares machine names. */
export function machineFullName(machine: Equipment): string {
	return [machine.brand, machine.series, machine.name].filter(Boolean).join(' ');
}

/** Short label for a machine chip (brand + name, series is usually noise). */
export function machineLabel(machine: Equipment): string {
	return [machine.brand, machine.name].filter(Boolean).join(' ');
}

/**
 * The exercises a machine trains — primary first, then the secondary when set.
 * Both count for filtering: a chest-supported row still trains a row even when
 * that's only its secondary mapping. Falls back to a single name-based guess
 * for legacy machines that predate the exercise_id field.
 */
export function exercisesForMachine(
	machine: Equipment,
	allExercises: ExerciseRef[]
): ExerciseRef[] {
	const assigned = [machine.exercise, machine.secondary_exercise].filter(
		(exercise): exercise is ExerciseRef => Boolean(exercise)
	);
	if (assigned.length > 0) {
		// Both slots can hold the same exercise once two exercises have been
		// merged into one, so de-dupe rather than counting the machine twice.
		return [...new Map(assigned.map((exercise) => [exercise.id, exercise])).values()];
	}

	const predicted = predictExercise(machineFullName(machine), allExercises);
	return predicted ? [predicted] : [];
}

/**
 * Search predicate for an exercise: matches its display name or any alias, so a
 * name that was merged away still finds the exercise that absorbed it —
 * "chest supported" reaches T Bar Row.
 *
 * Each alias is tested on its own. Joining them into one string would let a
 * query match words spread across two unrelated aliases.
 */
export function matchesExercise(query: string, exercise: ExerciseRef): boolean {
	return (
		matchesSearch(query, exercise.name) ||
		(exercise.aliases ?? []).some((alias) => matchesSearch(query, alias))
	);
}

/** Every machine that trains the given exercise, primary or secondary. */
export function machinesForExercise(
	exercise: ExerciseRef,
	allEquipment: Equipment[],
	allExercises: ExerciseRef[]
): Equipment[] {
	return allEquipment.filter((machine) =>
		exercisesForMachine(machine, allExercises).some((e) => e.id === exercise.id)
	);
}

/**
 * A gym's available exercises, derived from its machines.
 *   gym.exercises = unique(gym.machines.map(m => m.exercise))
 * Used once `gym.machines` is populated by the backend; kept here so the data
 * model is in one place.
 */
export function deriveGymExercises(
	machines: Equipment[],
	allExercises: ExerciseRef[]
): ExerciseRef[] {
	const seen = new Map<string, ExerciseRef>();
	for (const machine of machines) {
		for (const exercise of exercisesForMachine(machine, allExercises)) {
			if (!seen.has(exercise.id)) seen.set(exercise.id, exercise);
		}
	}
	return [...seen.values()];
}

/** Popular exercises = those trained by the most machines in the catalogue. */
export function popularExercises(
	allEquipment: Equipment[],
	allExercises: ExerciseRef[],
	limit = 6
): ExerciseRef[] {
	// Counts both slots, so a combo machine counts towards each exercise it trains.
	const counts = new Map<string, number>();
	for (const machine of allEquipment) {
		for (const exercise of exercisesForMachine(machine, allExercises)) {
			counts.set(exercise.id, (counts.get(exercise.id) ?? 0) + 1);
		}
	}
	return allExercises
		.filter((exercise) => counts.has(exercise.id))
		.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
		.slice(0, limit);
}

/**
 * Popular machines = one representative machine per most-common brand, so the
 * chips read as recognisable pieces of kit (e.g. "Hammer Strength Row").
 */
export function popularMachines(allEquipment: Equipment[], limit = 6): Equipment[] {
	const brandCounts = new Map<string, number>();
	for (const machine of allEquipment) {
		if (machine.brand) brandCounts.set(machine.brand, (brandCounts.get(machine.brand) ?? 0) + 1);
	}
	const topBrands = [...brandCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([brand]) => brand);

	const chips: Equipment[] = [];
	for (const brand of topBrands) {
		const pick =
			allEquipment.find((m) => m.brand === brand && m.image_url) ??
			allEquipment.find((m) => m.brand === brand);
		if (pick) chips.push(pick);
	}
	return chips;
}

/** Popular brands = those with the most equipment in the catalogue. */
export function popularBrands(brands: Brand[], limit = 6): Brand[] {
	return [...brands].sort((a, b) => b.equipment_count - a.equipment_count).slice(0, limit);
}
