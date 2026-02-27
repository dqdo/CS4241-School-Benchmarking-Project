import { useState } from 'react';
import AdmissionsForm from './AdmissionsForm';
import EnrollmentForm from './EnrollmentForm';

export default function DataEntry() {
	//Track which sub form is active
	const [activeForm, setActiveForm] = useState<"admissions" | "enrollment">("admissions");

	return (
		<div className="p-8 max-w-5xl mx-auto">
			<h1 className="text-3xl font-bold text-[#1E3869] mb-6">Annual Benchmarking Data</h1>
			{/* Sub-navigation for the forms */}
			<div className="flex space-x-2 mb-6 border-b-2 border-gray-200 pb-2">
				<button
					className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
						activeForm === "admissions"
							? "bg-[#0693E3] text-white"
							: "bg-gray-200 text-gray-600 hover:bg-gray-300"
					}`}
					onClick={() => setActiveForm("admissions")}>
					Admissions Activity
				</button>
				<button
					className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
						activeForm === "enrollment"
							? "bg-[#0693E3] text-white"
							: "bg-gray-200 text-gray-600 hover:bg-gray-300"
					}`}
					onClick={() => setActiveForm("enrollment")}>
					Enrollment & Attrition
				</button>
			</div>

			{/* Render the active form inside a card */}
			<div className="bg-white p-6 rounded-lg shadow-md">
				{activeForm === "admissions" && <AdmissionsForm />}
				{activeForm === "enrollment" && <EnrollmentForm />}
			</div>
		</div>
	);
}