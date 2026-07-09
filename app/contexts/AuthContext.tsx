'use client';
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { setAuthToken, syncUser, updateCurrentUsername } from '@/lib/api';
import type { User } from '@/types/user';

type AuthContextType = {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, username: string) => Promise<{ needsConfirmation: boolean }>;
	updateUsername: (username: string) => Promise<void>;
	logout: () => Promise<void>;
	loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Singleton client — created once outside the component so only one
// onAuthStateChange subscription exists for the lifetime of the app.
const supabase = createClient();

// Reads the post-auth destination from the current URL's `redirect` param.
// Only internal paths are honoured, so a crafted `?redirect=https://evil.com`
// can't turn the login flow into an open redirect.
export function getRedirectTarget(fallback = '/'): string {
	if (typeof window === 'undefined') return fallback;
	const target = new URLSearchParams(window.location.search).get('redirect');
	return target && target.startsWith('/') && !target.startsWith('//') ? target : fallback;
}

async function fetchProfile(userId: string): Promise<{ username: string; role: string }> {
	const { data } = await supabase
		.from('profiles')
		.select('username, role')
		.eq('id', userId)
		.single();
	return { username: data?.username ?? '', role: data?.role ?? 'user' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// onAuthStateChange fires INITIAL_SESSION as its first event, after any
		// pending OAuth code exchange — making it the authoritative source for
		// the initial auth state. Using getSession() separately can resolve before
		// the code exchange completes, causing a false unauthenticated state.
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (_event: AuthChangeEvent, session: Session | null) => {
				console.log('[AuthContext] onAuthStateChange fired:', _event, 'token:', session?.access_token?.slice(0, 20) ?? null);
				if (session) {
					// Set _token immediately before any async work. TOKEN_REFRESHED
					// fires with loading=false, so the account page effect can run
					// while fetchProfile is still in-flight — it needs a valid token.
					setAuthToken(session.access_token);
					let apiProfile: { username: string; role: string } | null = null;
					try {
						apiProfile = await syncUser();
					} catch {
						apiProfile = null;
					}
					if (_event === 'SIGNED_IN') {
						// Create profile for new users — username stored in metadata during signUp.
						// Runs with a valid JWT so RLS INSERT policy (auth.uid() = id) passes.
						const username = session.user.user_metadata?.username as string | undefined;
						if (username) {
							await supabase.from('profiles').upsert(
								{ id: session.user.id, username, role: 'user' },
								{ onConflict: 'id', ignoreDuplicates: true }
							);
						}
					}
					const profile = apiProfile ?? await fetchProfile(session.user.id);
					console.log('[AuthContext] fetchProfile resolved, calling setUser + setLoading(false)');
					setUser({
						id: session.user.id,
						email: session.user.email ?? '',
						username: profile.username,
						role: profile.role as User['role'],
					});
					setToken(session.access_token);
				} else {
					setUser(null);
					setToken(null);
					setAuthToken(null);
				}
				setLoading(false);
			}
		);

		return () => subscription.unsubscribe();
	}, []);

	const login = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw new Error(error.message);
		router.push(getRedirectTarget());
	};

	const register = async (email: string, password: string, username: string) => {
		// Pre-check uniqueness so the error message is actionable.
		// profiles has a SELECT policy open to everyone, so this works with the anon key.
		const { data: existing } = await supabase
			.from('profiles')
			.select('id')
			.eq('username', username)
			.maybeSingle();
		if (existing) throw new Error('Username already taken');

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { username } },
		});
		if (error) throw new Error(error.message);

		if (data.session) {
			router.push(getRedirectTarget());
			return { needsConfirmation: false };
		}
		return { needsConfirmation: true };
	};

	const updateUsername = async (username: string) => {
		const updated = await updateCurrentUsername(username);
		setUser((current) => (current ? { ...current, username: updated.username } : current));
	};

	const logout = async () => {
		try {
			await supabase.auth.signOut();
		} finally {
			setUser(null);
			setToken(null);
			setAuthToken(null);
			router.push('/');
		}
	};

	return (
		<AuthContext.Provider value={{ user, token, login, register, updateUsername, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export { AuthContext };

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
}
