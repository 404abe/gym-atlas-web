'use client';

import { useEffect, useRef, useState } from 'react';

const TYPE_MS = 28; // per character while typing
const ERASE_MS = 16; // per character while erasing
const HOLD_MS = 1400; // pause on the full word
const NEXT_MS = 400; // pause after erase, before the next word

function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * Typewriter that cycles through `examples` forever: type a word, hold, erase,
 * advance, repeat. Pass `paused` to freeze it (e.g. while a field is focused or
 * an overlay is open); it resumes on the current word when unpaused. Honors
 * `prefers-reduced-motion` by showing the first example statically.
 *
 * `examples` must be a stable reference (module constant or memoized) — a fresh
 * array each render restarts the animation.
 */
export function useCyclingPlaceholder(examples: string[], paused = false): string {
	const [display, setDisplay] = useState('');
	// Survives re-renders and pause/resume so we continue where we left off.
	const wordIndex = useRef(0);

	useEffect(() => {
		if (examples.length === 0) return;

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout>;

		if (prefersReducedMotion()) {
			// Show the resting prompt statically. Deferred so the only setState is
			// in an async callback — and so SSR/first paint stays '' (no mismatch).
			timer = setTimeout(() => !cancelled && setDisplay(examples[0]), 0);
			return () => {
				cancelled = true;
				clearTimeout(timer);
			};
		}

		if (paused) return; // freeze the current frame; no timers running

		const typeWord = () => {
			const word = examples[wordIndex.current % examples.length];
			let i = 0;

			const typeChar = () => {
				if (cancelled) return;
				i += 1;
				setDisplay(word.slice(0, i));
				timer = setTimeout(
					i < word.length ? typeChar : startErase,
					i < word.length ? TYPE_MS : HOLD_MS
				);
			};

			const startErase = () => {
				if (cancelled) return;
				const eraseChar = () => {
					if (cancelled) return;
					i -= 1;
					setDisplay(word.slice(0, i));
					if (i > 0) {
						timer = setTimeout(eraseChar, ERASE_MS);
					} else {
						wordIndex.current = (wordIndex.current + 1) % examples.length;
						timer = setTimeout(typeWord, NEXT_MS);
					}
				};
				eraseChar();
			};

			typeChar();
		};

		typeWord();

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [examples, paused]);

	return display;
}
