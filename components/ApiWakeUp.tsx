'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const POLL_INTERVAL = 2000;
const MAX_WAIT = 40000;

type Status = 'checking' | 'awake' | 'timeout';

export default function ApiWakeUp() {
	const [status, setStatus] = useState<Status>('checking');
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		let cancelled = false;
		const start = Date.now();

		const tick = setInterval(() => {
			if (!cancelled) setElapsed(Date.now() - start);
		}, 100);

		const poll = async () => {
			while (!cancelled) {
				try {
					const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
					if (res.ok) {
						setStatus('awake');
						clearInterval(tick);
						return;
					}
				} catch {}

				if (Date.now() - start > MAX_WAIT) {
					setStatus('timeout');
					clearInterval(tick);
					return;
				}

				await new Promise((r) => setTimeout(r, POLL_INTERVAL));
			}
		};

		poll();

		return () => {
			cancelled = true;
			clearInterval(tick);
		};
	}, []);

	if (status === 'awake') return null;

	const progress = Math.min((elapsed / MAX_WAIT) * 100, 95);

	return (
		<div className="fixed bottom-4 left-1/2 z-70 flex w-72 -translate-x-1/2 flex-col items-center gap-2 rounded-(--roundness) border-[0.5px] border-border bg-[rgba(20,20,20,0.92)] px-5 py-3 shadow-lg backdrop-blur">
			<div className="flex w-full items-center justify-between">
				<span className="text-sub text-xs">
					{status === 'timeout' ? 'API unavailable' : 'Waking up server…'}
				</span>
				<span className="text-sub text-xs">{Math.round(elapsed / 1000)}s</span>
			</div>

			<div className="h-0.5 w-full overflow-hidden rounded-full bg-sub-alt">
				{status === 'timeout' ? (
					<div className="h-full w-full rounded-full bg-red-500/60" />
				) : (
					<div
						className="h-full rounded-full bg-main transition-all duration-300 ease-out"
						style={{ width: `${progress}%` }}
					/>
				)}
			</div>

			{status === 'timeout' && (
				<p className="text-sub text-xs opacity-70">Try refreshing in a moment</p>
			)}
		</div>
	);
}
