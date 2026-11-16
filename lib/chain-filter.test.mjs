import test from 'node:test';
import assert from 'node:assert/strict';
import {
	DEFAULT_CHAIN_FILTER,
	applyChainFilter,
	chainFilterCount,
	isChainFilterActive,
	parseChainFilter,
	toggleHiddenChain
} from './chain-filter.ts';

const pure = { id: 1, slug: 'puregym', name: 'PureGym', logo_url: null };
const group = { id: 2, slug: 'the-gym-group', name: 'The Gym Group', logo_url: null };

const gyms = [
	{ id: 1, name: 'PureGym Aberdeen', chain: pure },
	{ id: 2, name: 'PureGym Dundee', chain: pure },
	{ id: 3, name: 'The Gym Group Dundee', chain: group },
	{ id: 4, name: 'The Gym Dock', chain: null },
	{ id: 5, name: 'Kings Gym' }
];

const ids = (list) => list.map((gym) => gym.id);

test('returns the same array when no filter is active', () => {
	assert.equal(applyChainFilter(gyms, DEFAULT_CHAIN_FILTER), gyms);
});

test('independentOnly keeps only gyms without a chain', () => {
	const result = applyChainFilter(gyms, { independentOnly: true, hiddenChainSlugs: [] });
	assert.deepEqual(ids(result), [4, 5]);
});

test('hiddenChainSlugs hides just those chains', () => {
	const result = applyChainFilter(gyms, { independentOnly: false, hiddenChainSlugs: ['puregym'] });
	assert.deepEqual(ids(result), [3, 4, 5]);
});

test('hiding several chains leaves independents', () => {
	const result = applyChainFilter(gyms, {
		independentOnly: false,
		hiddenChainSlugs: ['puregym', 'the-gym-group']
	});
	assert.deepEqual(ids(result), [4, 5]);
});

test('independentOnly wins over hiddenChainSlugs but does not clear them', () => {
	const state = { independentOnly: true, hiddenChainSlugs: ['puregym'] };
	assert.deepEqual(ids(applyChainFilter(gyms, state)), [4, 5]);
	const restored = applyChainFilter(gyms, { ...state, independentOnly: false });
	assert.deepEqual(ids(restored), [3, 4, 5]);
});

test('toggleHiddenChain adds and removes a slug without mutating', () => {
	const start = { independentOnly: false, hiddenChainSlugs: [] };
	const added = toggleHiddenChain(start, 'puregym');
	assert.deepEqual(added.hiddenChainSlugs, ['puregym']);
	assert.deepEqual(start.hiddenChainSlugs, []);
	assert.deepEqual(toggleHiddenChain(added, 'puregym').hiddenChainSlugs, []);
});

test('active flag and badge count', () => {
	assert.equal(isChainFilterActive(DEFAULT_CHAIN_FILTER), false);
	assert.equal(chainFilterCount(DEFAULT_CHAIN_FILTER), 0);
	assert.equal(chainFilterCount({ independentOnly: true, hiddenChainSlugs: ['a', 'b'] }), 1);
	assert.equal(chainFilterCount({ independentOnly: false, hiddenChainSlugs: ['a', 'b'] }), 2);
});

test('parseChainFilter tolerates missing and malformed storage', () => {
	assert.deepEqual(parseChainFilter(null), DEFAULT_CHAIN_FILTER);
	assert.deepEqual(parseChainFilter('not json'), DEFAULT_CHAIN_FILTER);
	assert.deepEqual(parseChainFilter('42'), DEFAULT_CHAIN_FILTER);
	assert.deepEqual(
		parseChainFilter(JSON.stringify({ independentOnly: true, hiddenChainSlugs: ['puregym', 7] })),
		{ independentOnly: true, hiddenChainSlugs: ['puregym'] }
	);
});
