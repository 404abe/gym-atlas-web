import type { StyleSpecification } from 'mapbox-gl';

/**
 * Mapbox Standard with its basemap config baked in. react-map-gl has no prop for
 * style config, so Standard is imported into a wrapper style instead, which lets
 * the config ride along declaratively with mapStyle.
 *
 * `compact` is the phone/tablet variant. Standard's 3D objects (buildings,
 * landmarks, trees, with shadows and ambient occlusion) and dense POI/transit
 * labels are the heaviest part of the basemap for a mobile GPU, and at the zooms
 * people use this map they add little, so compact turns them off.
 */
function standardStyle(lightPreset: 'day' | 'night', compact: boolean): StyleSpecification {
	return {
		version: 8,
		imports: [
			{
				id: 'basemap',
				url: 'mapbox://styles/mapbox/standard',
				config: {
					lightPreset,
					theme: 'default',
					showPlaceLabels: true,
					showPointOfInterestLabels: !compact,
					showTransitLabels: !compact,
					show3dObjects: !compact
				}
			}
		],
		sources: {},
		layers: []
	};
}

// Module-level so each style's identity is stable and react-map-gl doesn't
// re-diff the style on every render.
const STYLES = {
	light: standardStyle('day', false),
	dark: standardStyle('night', false),
	lightCompact: standardStyle('day', true),
	darkCompact: standardStyle('night', true)
};

export function getMapStyle(theme: string, compact = false) {
	if (theme === 'light') return compact ? STYLES.lightCompact : STYLES.light;
	return compact ? STYLES.darkCompact : STYLES.dark;
}

/**
 * Class for the map's wrapper: light mode gets the "Ocean" tint (a CSS filter in
 * globals.css, since Standard has no such theme). Compact screens skip it: a CSS
 * filter on a WebGL canvas is re-composited every frame, which a phone GPU feels.
 */
export function getMapThemeClass(theme: string, compact = false) {
	return theme === 'light' && !compact ? 'map-ocean-theme' : undefined;
}
