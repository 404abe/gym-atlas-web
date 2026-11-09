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

/**
 * Compact (phone/tablet) screens use the classic Light and Dark styles. Standard
 * is a 3D, dynamically lit basemap with far more layers; even with its 3D objects
 * and POI labels switched off it was still too heavy for a phone GPU to pan and
 * zoom smoothly under several hundred DOM markers. The classic styles are flat,
 * minimal and cheap, and the gym pins carry the visual weight here anyway.
 */
const COMPACT_LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';
const COMPACT_DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

export function getMapStyle(theme: string, compact = false) {
	if (compact) return theme === 'light' ? COMPACT_LIGHT_STYLE : COMPACT_DARK_STYLE;
	return theme === 'light' ? LIGHT_STYLE : DARK_STYLE;
}

/**
 * Class for the map's wrapper: light mode gets the "Ocean" tint (a CSS filter in
 * globals.css, since Standard has no such theme). Compact screens skip it: a CSS
 * filter on a WebGL canvas is re-composited every frame, which a phone GPU feels.
 */
export function getMapThemeClass(theme: string, compact = false) {
	return theme === 'light' && !compact ? 'map-ocean-theme' : undefined;
}
