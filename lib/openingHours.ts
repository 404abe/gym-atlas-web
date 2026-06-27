import { Gym } from '@/types/gym';

type OpenStatus = { status: 'open' | 'closing_soon' | 'closed'; label: string };

function formatTime({ hour, minute }: { hour: number; minute: number }): string {
	const suffix = hour < 12 ? 'am' : 'pm';
	const h = hour % 12 || 12;
	return minute === 0 ? `${h}${suffix}` : `${h}:${String(minute).padStart(2, '0')}${suffix}`;
}

export function getOpenStatus(openingHours: Gym['opening_hours']): OpenStatus | null {
	if (!openingHours) return null;

	const now = new Date();
	const currentDay = now.getDay();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();

	const is247 =
		openingHours.periods.length === 1 &&
		openingHours.periods[0].open.day === 0 &&
		openingHours.periods[0].open.hour === 0 &&
		openingHours.periods[0].open.minute === 0 &&
		!openingHours.periods[0].close;

	if (is247) return { status: 'open', label: 'Open 24h' };

	const period = openingHours.periods.find((p) => p.open.day === currentDay);

	if (!period) return { status: 'closed', label: 'Closed today' };
	if (!period.close) return { status: 'open', label: 'Open 24h' };

	const openMinutes = period.open.hour * 60 + period.open.minute;
	const closeMinutes = period.close.hour * 60 + period.close.minute;

	if (currentMinutes < openMinutes) {
		return { status: 'closed', label: `Opens ${formatTime(period.open)}` };
	}
	if (currentMinutes > closeMinutes - 60) {
		return { status: 'closing_soon', label: `Closes soon · ${formatTime(period.close)}` };
	}
	return { status: 'open', label: `Open · closes ${formatTime(period.close)}` };
}
