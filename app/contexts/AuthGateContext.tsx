'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, X } from 'lucide-react';
import { useAuth } from './AuthContext';

type AuthGateContextType = {
	/**
	 * Returns true when the user is signed in. When they are not, it opens the
	 * sign-in modal (optionally describing the action they tried) and returns
	 * false — so callers can early-return instead of attempting a request that
	 * would fail server-side.
	 */
	requireAuth: (action?: string) => boolean;
};

const AuthGateContext = createContext<AuthGateContextType | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [action, setAction] = useState<string | null>(null);

	const requireAuth = useCallback(
		(act?: string) => {
			if (user) return true;
			setAction(act ?? null);
			setOpen(true);
			return false;
		},
		[user]
	);

	const close = () => setOpen(false);

	const goToSignUp = () => {
		setOpen(false);
		// Send the user back to where they were once they're authenticated.
		const here =
			typeof window !== 'undefined'
				? window.location.pathname + window.location.search
				: '/';
		router.push(`/login?redirect=${encodeURIComponent(here)}`);
	};

	return (
		<AuthGateContext.Provider value={{ requireAuth }}>
			{children}

			{open && (
				<div
					className="fixed inset-0 z-100 flex items-center justify-center p-4"
					role="dialog"
					aria-modal="true"
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={close}
					/>

					{/* Card */}
					<div className="bg-surface relative w-full max-w-sm rounded-2xl p-6 shadow-xl">
						<button
							onClick={close}
							className="text-sub hover:text-main absolute right-4 top-4 transition"
							aria-label="Close"
						>
							<X className="h-4 w-4" />
						</button>

						<div className="bg-main mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
							<LogIn className="text-bg h-5 w-5" />
						</div>

						<h2 className="text-main text-base font-semibold">Account required</h2>
						<p className="text-sub mt-1 text-sm">
							{action
								? `You need an account to ${action}.`
								: 'You need an account to make contributions.'}{' '}
							Sign in or create one — it only takes a moment.
						</p>

						<div className="mt-5 flex flex-col gap-2">
							<button
								onClick={goToSignUp}
								className="bg-main text-bg flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition hover:opacity-90"
							>
								<LogIn className="h-4 w-4" />
								Sign in or create account
							</button>
							<button
								onClick={close}
								className="text-sub hover:text-main rounded-xl py-2.5 text-sm transition"
							>
								Maybe later
							</button>
						</div>
					</div>
				</div>
			)}
		</AuthGateContext.Provider>
	);
}

export function useAuthGate() {
	const ctx = useContext(AuthGateContext);
	if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
	return ctx;
}
