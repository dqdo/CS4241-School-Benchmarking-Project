import { useState, useEffect } from 'react';
import AdmissionsForm from './AdmissionsForm';
import EnrollmentForm from './EnrollmentForm';
import EmployeeForm from './EmployeeForm';
import EnrollmentSourcesForm from "./EnrollmentSourcesForm";

export default function DataEntry() {
	const [activeForm, setActiveForm] = useState<"admissions" | "enrollment" | "employee" | "sources">("employee");

	const [isAdmin, setIsAdmin] = useState(false);
	const [schools, setSchools] = useState<any[]>([]);
	const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

	useEffect(() => {
		fetch("/currentUser")
			.then(res => res.json())
			.then(data => {
				setIsAdmin(data.isAdmin);
				if (data.isAdmin) {
					fetch("/schools")
						.then(res => res.json())
						.then(schoolData => setSchools(schoolData));
				} else {
					setSelectedSchoolId(data.schoolId ? String(data.schoolId) : null);
				}
			});
	}, []);

	const getTabClass = (tabName: string) => `px-4 py-2 rounded-t-lg font-semibold transition-colors ${
		activeForm === tabName
			? "bg-[#0693E3] text-white"
			: "bg-gray-200 text-gray-600 hover:bg-gray-300"
	}`;

	return (
		<div className="p-8 max-w-5xl mx-auto">
			<div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
				<h1 className="text-3xl font-bold text-[#1E3869]">Annual Benchmarking Data</h1>

				{isAdmin && (
					<div className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-gray-200">
						<label className="font-semibold text-sm text-[#1E3869]">Select School:</label>
						<select
							value={selectedSchoolId || ""}
							onChange={(e) => setSelectedSchoolId(e.target.value)}
							className="border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
						>
							<option value="" disabled>Select a school...</option>
							{schools.map(s => <option key={s.ID} value={s.ID}>{s.NAME_TX}</option>)}
						</select>
					</div>
				)}
			</div>

			<div className="flex space-x-2 mb-6 border-b-2 border-gray-200 pb-2 overflow-x-auto">
				<button className={getTabClass("employee")} onClick={() => setActiveForm("employee")}>
					Employee Data
				</button>
				<button className={getTabClass("admissions")} onClick={() => setActiveForm("admissions")}>
					Admissions Activity
				</button>
				<button className={getTabClass("enrollment")} onClick={() => setActiveForm("enrollment")}>
					Enrollment & Attrition
				</button>
				<button className={getTabClass("sources")} onClick={() => setActiveForm("sources")}>
					Enrollment Sources
				</button>
			</div>

			<div className="bg-white p-6 rounded-lg shadow-md">
				{!selectedSchoolId ? (
					<div className="py-12 text-center text-gray-500">
						Please select a school to enter benchmarking data.
					</div>
				) : (
					<>
						{activeForm === "admissions" && <AdmissionsForm schoolId={selectedSchoolId} />}
						{activeForm === "enrollment" && <EnrollmentForm schoolId={selectedSchoolId} />}
						{activeForm === "employee" && <EmployeeForm schoolId={selectedSchoolId} />}
						{activeForm === "sources" && <EnrollmentSourcesForm schoolId={selectedSchoolId} />}
					</>
				)}
			</div>
		</div>
	);
}