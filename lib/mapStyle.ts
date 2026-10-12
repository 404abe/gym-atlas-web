import type { StyleSpecification } from 'mapbox-gl';

/**
 * Mapbox Standard with its basemap config baked in. react-map-gl has no prop for
 * style config, so Standard is imported into a wrapper style instead, which lets
 * the config ride along declaratively with mapStyle.
 */
function standardStyle(lightPreset: 'day' | 'night'): StyleSpecification {
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
					showPointOfInterestLabels: true
				}
			}
		],
		sources: {},
		layers: []
	};
}

// Module-level so each style's identity is stable and react-map-gl doesn't
// re-diff the style on every render.
const LIGHT_STYLE = standardStyle('day');
const DARK_STYLE = standardStyle('night');

export function getMapStyle(theme: string) {
	return theme === 'light' ? LIGHT_STYLE : DARK_STYLE;
}

/**
 * Class for the map's wrapper: light mode gets the "Ocean" tint (a CSS filter in
 * globals.css, since Standard has no such theme).
 */
export function getMapThemeClass(theme: string) {
	return theme === 'light' ? 'map-ocean-theme' : undefined;
}
