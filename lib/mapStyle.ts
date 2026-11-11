import type { StyleSpecification } from 'mapbox-gl';

/**
 * Mapbox Standard with its basemap config baked in. react-map-gl has no prop for
 * style config, so Standard is imported into a wrapper style instead, which lets
 * the config ride along declaratively with mapStyle.
 *
 * Phones use the same Standard colours as desktop, but with 3D objects switched
 * off to keep panning smooth under the DOM markers.
 */
function standardStyle(lightPreset: 'day' | 'night', compact = false): StyleSpecification {
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
					...(compact ? { show3dObjects: false } : {})
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
const COMPACT_LIGHT_STYLE = standardStyle('day', true);
const COMPACT_DARK_STYLE = standardStyle('night', true);

export function getMapStyle(theme: string, compact = false) {
	if (compact) return theme === 'light' ? COMPACT_LIGHT_STYLE : COMPACT_DARK_STYLE;
	return theme === 'light' ? LIGHT_STYLE : DARK_STYLE;
}

/**
 * Class for the map's wrapper: light mode gets the "Ocean" tint (a CSS filter in
 * globals.css, since Standard has no such theme). Applied on phones too so the
 * colours match desktop.
 */
export function getMapThemeClass(theme: string, _compact = false) {
	return theme === 'light' ? 'map-ocean-theme' : undefined;
}
