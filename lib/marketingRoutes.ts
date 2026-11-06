// Routes that render their own MarketingHeader, so the app Topbar / MobileHeader
// must stay hidden and AppMain must not reserve space for the Topbar.
export const MARKETING_ROUTES = ['/', '/about', '/developers'];

export const isMarketingRoute = (pathname: string | null | undefined) =>
	MARKETING_ROUTES.includes(pathname ?? '');
