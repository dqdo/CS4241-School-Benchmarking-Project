import { useState } from 'react';
import AdmissionsForm from './AdmissionsForm';
import EnrollmentForm from './EnrollmentForm';
import EmployeeForm from './EmployeeForm';

export default function DataEntry() {
	const [activeForm, setActiveForm] = useState<"admissions" | "enrollment" | "personnel">("admissions");

	const getTabClass = (tabName: string) => `px-4 py-2 rounded-t-lg font-semibold transition-colors ${
		activeForm === tabName
			? "bg-[#0693E3] text-white"
			: "bg-gray-200 text-gray-600 hover:bg-gray-300"
	}`;

	return (
		<div className="p-8 max-w-5xl mx-auto">
			<h1 className="text-3xl font-bold text-[#1E3869] mb-6">Annual Benchmarking Data</h1>

			<div className="flex space-x-2 mb-6 border-b-2 border-gray-200 pb-2">
				<button className={getTabClass("admissions")} onClick={() => setActiveForm("admissions")}>
					Admissions Activity
				</button>
				<button className={getTabClass("enrollment")} onClick={() => setActiveForm("enrollment")}>
					Enrollment & Attrition
				</button>
				<button className={getTabClass("personnel")} onClick={() => setActiveForm("personnel")}>
					Personnel Data
				</button>
			</div>

			<div className="bg-white p-6 rounded-lg shadow-md">
				{activeForm === "admissions" && <AdmissionsForm />}
				{activeForm === "enrollment" && <EnrollmentForm />}
				{activeForm === "personnel" && <EmployeeForm />}
			</div>
		</div>
	);
}