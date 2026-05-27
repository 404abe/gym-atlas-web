'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import NewMachineCard from '@/app/add/_components/NewMachineCard';

export default function NewEquipmentPage() {
	const router = useRouter();

	return (
		<div className="content-grid py-8">
			<div className="full-width-padding mx-auto max-w-4xl">
				{/* Back nav */}
				<button
					onClick={() => router.back()}
					className="text-sub hover:text-main mb-6 flex items-center gap-1.5 text-sm transition"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>

				{/* Page heading */}
				<div className="mb-6">
					<h1 className="text-main text-2xl font-semibold">Add equipment</h1>
					<p className="text-sub mt-1 text-sm">Register a new machine to the database</p>
				</div>

				{/* Bento form */}
				<NewMachineCard
					onCreated={(equipment) => {
						router.push(`/equipment/${equipment.id}`);
					}}
				/>
			</div>
		</div>
	);
}
