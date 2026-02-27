import {useEffect, useState} from "react";
import {School} from "./admissions/AdmissionsGraph";
import Dropdown from "../elements/Dropdown";
import EnrollmentKPIs from "./dashboard/EnrollmentKPIs";
import PersonnelKPIs from "./dashboard/PersonnelKPIs";
import EmployeeRatioKPIs from "./dashboard/EmployeeRatioKPIs";

export default function Dashboard() {
	const [schools, setSchools] = useState<School[]>([]);
	const [schoolSelection, setSchoolSelection] = useState<string>("");

	useEffect(() => {
		fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
	})

	return (
		<div className={"mt-4"}>
			<Dropdown option={schoolSelection} prompt={"Select School..."} setOption={setSchoolSelection} options={schools.map(school => {
				return {option: school.NAME_TX, value: school.ID}
			})} />
			<h1 className={"font-bold text-2xl"}>Enrollment</h1>
			<EnrollmentKPIs selectedSchool={schoolSelection}/>
			<hr />
			<h1 className={"font-bold text-2xl"}>Personnel</h1>
			<PersonnelKPIs selectedSchool={schoolSelection}/>
			<hr />
			<h1 className={"font-bold text-2xl"}>Attrition</h1>
			<hr />
			<h1 className={"font-bold text-2xl"}>Employee Ratios</h1>
			<EmployeeRatioKPIs selectedSchool={schoolSelection}/>
		</div>
	)
}