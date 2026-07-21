import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');

	if (code) {
		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options)
						);
					}
				}
			}
		);

		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Honour an internal `redirect` path so OAuth returns the user to
			// where they started; ignore anything that isn't a local path.
			const redirect = searchParams.get('redirect');
			const target =
				redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/map';
			return NextResponse.redirect(`${origin}${target}`);
		}
	}

	return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
