'use client';
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { setAuthToken, syncUser } from '@/lib/api';
import type { User } from '@/types/user';

type AuthContextType = {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, username: string) => Promise<void>;
	logout: () => Promise<void>;
	loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Singleton client — created once outside the component so only one
// onAuthStateChange subscription exists for the lifetime of the app.
const supabase = createClient();

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
					if (_event === 'SIGNED_IN') await syncUser().catch(() => {});
					const profile = await fetchProfile(session.user.id);
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
		router.push('/');
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

		if (data.user) {
			const { error: profileError } = await supabase
				.from('profiles')
				.upsert({ id: data.user.id, username, role: 'user' });
			if (profileError) throw new Error('Failed to create profile');
		}

		router.push('/');
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
		<AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
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
