import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server Component / Route Handler client — reads the session from cookies.
// Mirrors the client set up in app/auth/callback/route.ts.
export async function createClient() {
	const cookieStore = await cookies();
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options)
						);
					} catch {
						// Called from a Server Component render (no response to write
						// cookies to) — safe to ignore since middleware/route handlers
						// are what actually refresh the session cookie.
					}
				}
			}
		}
	);
}
