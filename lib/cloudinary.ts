/**
 * Cloudinary delivery transformations for images rendered outside next/image.
 *
 * Most gym photos go through next/image, which resizes them for us. Map markers
 * can't: there are hundreds on screen at once and next/image's per-image
 * machinery costs more than it saves at that count, so they use a plain <img>.
 * Without a transformation that means the full-size original gets downloaded and
 * decoded into a 46px circle, which is the single most expensive thing about
 * rendering a large marker set.
 *
 * Non-Cloudinary URLs (the dead Azure Blob ones, data URLs, anything unexpected)
 * are returned untouched.
 */

/**
 * Cloudinary transformation keys, as they appear at the start of a URL segment
 * or after a comma. Used to detect a URL that already carries a transformation
 * so we never stack a second one on top of it.
 */
const TRANSFORM_KEY =
	/(^|,)(a|ar|b|bo|br|c|co|cs|d|dl|dn|dpr|du|e|eo|f|fl|fn|g|h|if|l|o|pg|q|r|so|t|u|vc|w|x|y|z)_/;

export type CloudinaryThumbOptions = {
	/** Rendered CSS size in px. The request asks for 2x this, for retina screens. */
	size: number;
};

export function cloudinaryThumb(
	url: string | null | undefined,
	{ size }: CloudinaryThumbOptions
): string | undefined {
	if (!url) return undefined;
	if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

	const marker = '/upload/';
	const splitAt = url.indexOf(marker);
	const head = url.slice(0, splitAt);
	const tail = url.slice(splitAt + marker.length);

	// Already transformed (either by us on a previous pass, or at upload time).
	const firstSegment = tail.slice(0, tail.indexOf('/') === -1 ? undefined : tail.indexOf('/'));
	if (TRANSFORM_KEY.test(firstSegment)) return url;

	const pixels = Math.round(size * 2);
	return `${head}${marker}c_fill,g_auto,w_${pixels},h_${pixels},f_auto,q_auto/${tail}`;
}
