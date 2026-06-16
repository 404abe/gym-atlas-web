import { NextRequest, NextResponse } from 'next/server';

const API_ORIGIN = process.env.GYM_ATLAS_API_URL || 'https://gym-atlas-api.onrender.com';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
	const { path } = await context.params;
	const upstreamUrl = new URL(path.join('/'), API_ORIGIN);
	upstreamUrl.search = request.nextUrl.search;

	const headers = new Headers();
	const authorization = request.headers.get('authorization');
	const contentType = request.headers.get('content-type');
	if (authorization) headers.set('authorization', authorization);
	if (contentType) headers.set('content-type', contentType);

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
	const upstream = await fetch(upstreamUrl, {
		method: request.method,
		headers,
		body: hasBody ? await request.arrayBuffer() : undefined,
		cache: 'no-store'
	});

	const responseHeaders = new Headers();
	const upstreamContentType = upstream.headers.get('content-type');
	if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType);

	return new NextResponse(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders
	});
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
