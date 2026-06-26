'use client';
import NewMachineCard from '../_components/NewMachineCard';

export default function NewMachinePage() {
	return (
		<main className="mx-auto w-full max-w-2xl px-4 py-8">
			<h1 className="text-main mb-6 text-xl font-semibold">Add a machine</h1>
			<NewMachineCard onCreated={() => {}} />
		</main>
	);
}
