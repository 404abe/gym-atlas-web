'use client';

import { useEffect, useRef, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { MapPin } from 'lucide-react';
import { fetchGymTicker, type GymTickerEntry } from '@/lib/api';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'] });

const TYPE_MS = 30;
const DELETE_MS = 16;
const HOLD_MS = 1400;
const PAUSE_MS = 300;
const CURSOR_BLINK_MS = 500;

function formatDMS(decimal: number, axis: 'lat' | 'lng'): string {
	const value = Number(decimal);
	const direction = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
	const absolute = Math.abs(value);
	const degrees = Math.floor(absolute);
	const minutesFull = (absolute - degrees) * 60;
	const minutes = Math.floor(minutesFull);
	const seconds = ((minutesFull - minutes) * 60).toFixed(1);
	return `${degrees}°${minutes}'${seconds}"${direction}`;
}

function formatLine(entry: GymTickerEntry): string {
	return `${entry.name} @ ${formatDMS(entry.lat, 'lat')}, ${formatDMS(entry.lng, 'lng')}`;
}

export default function CoordinateTicker() {
	const [lines, setLines] = useState<string[] | null>(null);
	const [text, setText] = useState('');
	const [cursorOn, setCursorOn] = useState(true);
	const entryIndexRef = useRef(0);

	useEffect(() => {
		let cancelled = false;
		fetchGymTicker()
			.then((entries) => {
				if (cancelled) return;
				const formatted = entries.map(formatLine).filter(Boolean);
				setLines(formatted.length > 0 ? formatted : null);
			})
			.catch(() => {
				if (!cancelled) setLines(null);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!lines || lines.length === 0) return;
		let timeoutId: ReturnType<typeof setTimeout>;

		const type = (charIndex: number) => {
			const current = lines[entryIndexRef.current % lines.length];
			if (charIndex <= current.length) {
				setText(current.slice(0, charIndex));
				timeoutId = setTimeout(() => type(charIndex + 1), TYPE_MS);
			} else {
				timeoutId = setTimeout(() => del(current.length), HOLD_MS);
			}
		};

		const del = (charIndex: number) => {
			if (charIndex >= 0) {
				const current = lines[entryIndexRef.current % lines.length];
				setText(current.slice(0, charIndex));
				timeoutId = setTimeout(() => del(charIndex - 1), DELETE_MS);
			} else {
				entryIndexRef.current += 1;
				timeoutId = setTimeout(() => type(0), PAUSE_MS);
			}
		};

		timeoutId = setTimeout(() => type(0), 0);
		return () => clearTimeout(timeoutId);
	}, [lines]);

	useEffect(() => {
		const id = setInterval(() => setCursorOn((visible) => !visible), CURSOR_BLINK_MS);
		return () => clearInterval(id);
	}, []);

	if (!lines || lines.length === 0) return null;

	return (
		<div
			className={`${jetbrainsMono.className} text-sub mt-6 flex items-center justify-center gap-1.5 text-[15px]`}
		>
			<MapPin size={24} className="shrink-0" />
			<span>
				{text}
				<span style={{ opacity: cursorOn ? 1 : 0 }}>_</span>
			</span>
		</div>
	);
}
