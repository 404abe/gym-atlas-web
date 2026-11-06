'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppWindow, WindowFrame } from '@/components/ui/AppWindow';
import { FALLBACK_GYMS, toSnake, type DemoGym, type DemoMachine } from '@/lib/apiDemo';
import { cn } from '@/lib/utils';

// ── What the demo is showing ─────────────────────────────
// Each cycle plays one gym in two exchanges, in the style of a Claude Code
// session: a prompt is typed into the input box, moves up into the log, a GET
// tool call and its result follow, then the data arrives as green "added" lines.
//   1. list: the gym's machines (the search window fills in alongside)
//   2. spec: one machine as JSON (its row highlights in the search window)
//
// On wide screens both windows are drawn at a fixed design size (STAGE_W x
// STAGE_H) and scaled down to fit. On phones only the terminal is shown, at a
// smaller size, because two overlapping windows don't fit.

type Mode = 'list' | 'spec';

type View = {
	gym: DemoGym;
	mode: Mode;
	input: string; // text in the input box
	prompt: string | null; // submitted prompt, shown in the log
	call: boolean; // GET line shown
	result: boolean; // result line shown
	count: number; // terminal lines revealed (machines or JSON lines)
	rows: number; // machines revealed in the search window
	query: string; // text in the search window's input
	highlight: boolean;
};

type JsonLine = { text: string } | { key: string; value: string | number | null; comma: boolean };

const STAGE_W = 960;
const STAGE_H = 540;

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const slug = (name: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const listPrompt = (gym: DemoGym) => `machines at ${truncate(gym.name.toLowerCase(), 26)}`;
const specPrompt = (machine: DemoMachine) => `show the ${truncate(machine.name.toLowerCase(), 22)} spec`;

function specLines(machine: DemoMachine): JsonLine[] {
	return [
		{ text: '{' },
		{ key: 'brand', value: machine.brand, comma: true },
		{ key: 'series', value: machine.series, comma: true },
		{ key: 'name', value: machine.name, comma: true },
		{ key: 'type', value: machine.type, comma: true },
		{ key: 'weight_stack_kg', value: machine.weightStack, comma: false },
		{ text: '}' }
	];
}

const SPEC_LINE_COUNT = 7;

const blankView = (gym: DemoGym): View => ({
	gym,
	mode: 'list',
	input: '',
	prompt: null,
	call: false,
	result: false,
	count: 0,
	rows: 0,
	query: '',
	highlight: false
});

// One finished frame, shown with reduced motion.
const staticView = (gym: DemoGym): View => ({
	...blankView(gym),
	prompt: listPrompt(gym),
	call: true,
	result: true,
	count: gym.machines.length,
	rows: gym.machines.length,
	query: gym.name
});

class Stop extends Error {}

// ── Media queries ────────────────────────────────────────

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const WIDE = '(min-width: 721px)'; // matches the `sm` breakpoint

function subscribeTo(query: string) {
	return (onChange: () => void) => {
		const list = window.matchMedia(query);
		list.addEventListener('change', onChange);
		return () => list.removeEventListener('change', onChange);
	};
}

const subscribeReducedMotion = subscribeTo(REDUCED_MOTION);
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const subscribeWide = subscribeTo(WIDE);
const getWide = () => window.matchMedia(WIDE).matches;

// ── Pieces ───────────────────────────────────────────────

function Caret({ big }: { big: boolean }) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				'ml-px inline-block translate-y-[1px] animate-pulse bg-white/85',
				big ? 'h-[14px] w-[8px]' : 'h-[11px] w-[6px]'
			)}
		/>
	);
}

function JsonRow({ line }: { line: JsonLine }) {
	if ('text' in line) return <>{line.text}</>;
	const { key, value, comma } = line;
	return (
		<>
			{'  '}
			<span className="text-sky-300">&quot;{key}&quot;</span>:{' '}
			{value === null ? (
				<span className="text-white/50">null</span>
			) : typeof value === 'number' ? (
				<span className="text-amber-300">{value}</span>
			) : (
				<span className="text-green-200">&quot;{value}&quot;</span>
			)}
			{comma ? ',' : ''}
		</>
	);
}

function TerminalBody({ view, mono, big }: { view: View; mono: string; big: boolean }) {
	const { gym, mode } = view;
	const machine = gym.machines[gym.spotlight];
	const km = gym.distanceKm != null ? ` · ${gym.distanceKm} km` : '';
	const path = mode === 'list' ? `/gyms/${slug(gym.name)}` : `/machines/${slug(machine.name)}`;
	const result = mode === 'list' ? `200 OK · ${gym.machines.length} machines${km}` : '200 OK';
	const lines = specLines(machine);
	const added = cn(
		'block bg-green-500/20 text-green-100',
		big ? '-mx-4 px-4' : '-mx-3 px-3'
	);

	return (
		<div
			className={cn(
				mono,
				'flex h-full flex-col leading-[1.55] text-white/80',
				big ? 'px-4 pb-3 pt-3.5 text-[14px]' : 'px-3 pb-2 pt-2.5 text-[10.5px]'
			)}
		>
			<div className={cn('truncate whitespace-pre', big ? 'mb-3' : 'mb-2')}>
				<span className="font-medium text-white">GymAtlas API</span>{' '}
				<span className="text-white/50">v0.1.0 · api.gymatlas.xyz</span>
			</div>

			<div className="min-h-0 flex-1 overflow-hidden whitespace-pre">
				{view.prompt && <span className="block text-white">&gt; {view.prompt}</span>}
				{view.call && (
					<span className="block">
						<span className="text-green-300">●</span> <span className="font-medium text-white">GET</span>
						<span className="text-white/50">({path})</span>
					</span>
				)}
				{view.result && <span className="block text-white/50">{'  ⎿  '}{result}</span>}

				{view.result && mode === 'list' &&
					gym.machines.slice(0, view.count).map((m, i) => (
						<span key={`${m.brand}-${m.name}`} className={added}>
							{String(i + 1).padStart(2)} + {truncate(toSnake(m.name), 19).padEnd(20)}x{m.count}
						</span>
					))}

				{view.result && mode === 'spec' &&
					lines.slice(0, view.count).map((line, i) => (
						<span key={i} className={added}>
							{String(i + 1).padStart(2)} + <JsonRow line={line} />
						</span>
					))}
			</div>

			<div
				className={cn(
					'overflow-hidden whitespace-pre border-y border-white/15',
					big ? 'mt-2 py-[5px]' : 'mt-1.5 py-[3px]'
				)}
			>
				&gt; {view.input}
				<Caret big={big} />
			</div>
			<div className={cn('text-white/50', big ? 'mt-1' : 'mt-0.5')}>coming soon</div>
		</div>
	);
}

function SearchBody({ view, mono }: { view: View; mono: string }) {
	const { gym } = view;
	const highlighted = view.highlight ? gym.spotlight : -1;

	// Right padding keeps the content clear of the terminal window overlapping this one.
	return (
		<div className="flex h-full flex-col overflow-hidden py-4 pl-[18px] pr-14 text-[15px]">
			<div className="bg-sub-alt text-main flex h-[42px] shrink-0 items-center overflow-hidden whitespace-nowrap rounded-lg px-3">
				{view.query || <span className="text-sub">Search gyms</span>}
			</div>
			<div className="text-sub mb-1.5 mt-3.5 flex h-[18px] shrink-0 items-center justify-between text-[13px]">
				<span className="truncate">{view.query ? gym.name : ''}</span>
				<span className="shrink-0 pl-2">
					{view.query && gym.distanceKm != null ? `${gym.distanceKm} km` : ''}
				</span>
			</div>
			<ul>
				{gym.machines.slice(0, view.rows).map((m, i) => (
					<li
						key={`${m.brand}-${m.name}`}
						className={cn(
							'-mx-2 flex h-[34px] items-center justify-between rounded-lg px-2',
							i === highlighted && 'bg-sub-alt'
						)}
					>
						<span className="text-main truncate font-medium">{m.name}</span>
						{i === highlighted ? (
							<span
								className={`${mono} border-accent text-accent ml-2 shrink-0 rounded-full border px-2.5 py-0.5 text-[12px]`}
							>
								{m.type === 'pin_loaded' ? 'pin loaded' : 'plate loaded'}
							</span>
						) : (
							<span className="text-sub ml-2 shrink-0">{m.count} available</span>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}

// ── Demo ─────────────────────────────────────────────────

export default function ApiDemo({ mono }: { mono: string }) {
	const [view, setView] = useState<View>(() => blankView(FALLBACK_GYMS[0]));
	const [scale, setScale] = useState<number | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const fitRef = useRef<HTMLDivElement>(null);

	const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
	const wide = useSyncExternalStore(subscribeWide, getWide, () => true);

	// Scale the fixed-size stage to the width it has been given (wide layout only).
	useEffect(() => {
		const el = fitRef.current;
		if (!wide || !el) return;
		const observer = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / STAGE_W)));
		observer.observe(el);
		return () => observer.disconnect();
	}, [wide]);

	useEffect(() => {
		// With reduced motion the demo just shows one finished frame.
		if (reducedMotion) return;

		let cancelled = false;
		let visible = false;
		let requestedNearby = false;
		// Starts as the curated defaults; swapped for nearby gyms if they arrive.
		let gyms: DemoGym[] = FALLBACK_GYMS;

		const patch = (next: Partial<View>) => setView((current) => ({ ...current, ...next }));

		// Resolves after `ms`, then holds while the demo is off-screen so the
		// loop doesn't burn renders nobody can see.
		const tick = async (ms: number) => {
			await new Promise<void>((resolve) => setTimeout(resolve, ms));
			while (!cancelled && !visible) {
				await new Promise<void>((resolve) => setTimeout(resolve, 250));
			}
			if (cancelled) throw new Stop();
		};

		const type = async (text: string, ms: number, apply: (typed: string) => void) => {
			for (let i = 1; i <= text.length; i++) {
				apply(text.slice(0, i));
				await tick(ms);
			}
		};

		// One request, only once the demo is first seen. The route answers with an
		// empty list when there's no location or no gym close enough with enough
		// machines listed, and the curated defaults keep playing.
		const loadNearby = async () => {
			try {
				const res = await fetch('/api/nearby-demo');
				if (!res.ok) return;
				const data: { gyms?: DemoGym[] } = await res.json();
				if (!cancelled && Array.isArray(data.gyms) && data.gyms.length > 0) gyms = data.gyms;
			} catch {
				// Keep the defaults.
			}
		};

		const play = async () => {
			let source = gyms;
			let index = 0;
			try {
				while (true) {
					// New data only takes effect at the start of a cycle, never mid-animation.
					if (gyms !== source) {
						source = gyms;
						index = 0;
					}
					const gym = source[index % source.length];
					const machine = gym.machines[gym.spotlight];

					// 1. List the gym's machines.
					setView(blankView(gym));
					await tick(600);
					const first = listPrompt(gym);
					await type(first, 38, (input) => patch({ input }));
					await tick(350);
					patch({ input: '', prompt: first });
					await tick(300);
					patch({ call: true });
					await tick(350);
					patch({ result: true });
					await type(gym.name, 18, (query) => patch({ query }));
					for (let n = 1; n <= gym.machines.length; n++) {
						patch({ count: n, rows: n });
						await tick(260);
					}
					await tick(1500);

					// 2. Spotlight one machine as JSON.
					patch({ mode: 'spec', prompt: null, call: false, result: false, count: 0, highlight: false });
					const second = specPrompt(machine);
					await type(second, 38, (input) => patch({ input }));
					await tick(350);
					patch({ input: '', prompt: second });
					await tick(300);
					patch({ call: true });
					await tick(350);
					patch({ result: true, highlight: true });
					for (let n = 1; n <= SPEC_LINE_COUNT; n++) {
						patch({ count: n });
						await tick(200);
					}
					await tick(3000);
					index++;
				}
			} catch (error) {
				if (!(error instanceof Stop)) throw error;
			}
		};

		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible && !requestedNearby) {
				requestedNearby = true;
				void loadNearby();
			}
		});
		if (rootRef.current) observer.observe(rootRef.current);
		void play();

		return () => {
			cancelled = true;
			observer.disconnect();
		};
	}, [reducedMotion]);

	const shown = reducedMotion ? staticView(FALLBACK_GYMS[0]) : view;

	return (
		<div
			ref={rootRef}
			role="img"
			aria-label="Animated preview of the GymAtlas API: a terminal lists a gym's machines, then prints one machine as JSON, while a search window updates alongside."
		>
			{wide ? (
				<div
					ref={fitRef}
					className="relative mx-auto w-full overflow-hidden"
					style={{
						maxWidth: STAGE_W,
						height: STAGE_H * (scale ?? 1),
						// Hidden until measured so it never flashes at the wrong size.
						visibility: scale === null ? 'hidden' : 'visible'
					}}
				>
					<div
						className="absolute left-0 top-0 origin-top-left"
						style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale ?? 1})` }}
					>
						<div className="absolute bottom-0 left-0 h-[350px] w-[430px]">
							<WindowFrame title="Search" className="h-full">
								<SearchBody view={shown} mono={mono} />
							</WindowFrame>
						</div>

						<div className="absolute right-0 top-0 z-10">
							<AppWindow title="gymatlas-api · 80x24" width={580} height={470} dark>
								<TerminalBody view={shown} mono={mono} big />
							</AppWindow>
						</div>
					</div>
				</div>
			) : (
				<div className="mx-auto w-[340px] max-w-full">
					<AppWindow title="gymatlas-api · 80x24" width={340} height={300} dark className="max-w-full">
						<TerminalBody view={shown} mono={mono} big={false} />
					</AppWindow>
				</div>
			)}
		</div>
	);
}
