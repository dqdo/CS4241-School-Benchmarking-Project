import {useEffect, useState} from "react";
import Dropdown from "../elements/Dropdown";
import EnrollmentKPIs from "./dashboard/EnrollmentKPIs";
import PersonnelKPIs from "./dashboard/PersonnelKPIs";
import EmployeeRatioKPIs from "./dashboard/EmployeeRatioKPIs";
import {Grade, School, Year} from "./admissions/Admissions";
import SchoolSelector from "../elements/SchoolSelector";
import Graph, { GraphData } from "../elements/Graph";

export default function Dashboard() {
	// Stay unchanged after first fetch
	const [schools, setSchools] = useState<School[]>([]);
	const [years, setYears] = useState<Year[]>([]);
	const [grades, setGrades] = useState<Grade[]>([]);
	const [userSchool, setUserSchool] = useState<School>({ID: -1, NAME_TX: "NONE"});

	// Dropdowns
	const [schoolSelection, setSchoolSelection] = useState<string>("");
	const [yearSelection, setYearSelection] = useState<string>("");
	const [gradeSelection, setGradeSelection] = useState<string>("");
	const [chartType, setChartType] = useState<string>("line");

	useEffect(() => {
		// These fields only need to be fetched once. They do not change
		if (schools.length === 0)
			fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
		if (years.length === 0)
			fetch("/years").then(res => res.json()).then(data => setYears(data));
		if (grades.length === 0)
			fetch("/grades").then(res => res.json()).then(data => setGrades(data));
		if (userSchool.ID === -1)
			fetch("/usersSchool").then(res => res.json()).then(data => setUserSchool(data));
	}, [])

	const graphProps = {
		chartType: chartType as "bar" | "doughnut" | "pie" | "line",
		grades: grades,
		schools: schools,
		standalone: false,
		userSchool: userSchool,
		years: years,
		selectedSchool: schoolSelection,
		selectedYear: yearSelection,
		selectedGrade: gradeSelection,
	}

	async function fetchAcceptanceRate(label: string){
		if(!schoolSelection || !gradeSelection){
			return [];
		}
		let output: GraphData[] = [];
		const params = {
			school: schoolSelection,
			grade: gradeSelection,
		};
		const queryString = new URLSearchParams(params).toString();
		const data = await (await fetch("/acceptanceRateG?" + queryString)).json();
		output = data.map((row: {acceptanceRate: number, year: number}): GraphData => {
			return {x: row.year, y: row.acceptanceRate}
		})
		return output;
	}

	return (
		<div className={"mt-4"}>
			<SchoolSelector userSchool={userSchool} schools={schools} years={years} schoolSelection={schoolSelection} setSchoolSelection={setSchoolSelection} yearSelection={yearSelection} setYearSelection={setYearSelection} chartType={"line"} grades={grades} gradeSelection={gradeSelection} setGradeSelection={setGradeSelection}/>
			<h1 className={"font-bold text-2xl"}>Enrollment</h1>
			<EnrollmentKPIs selectedSchool={schoolSelection}/>
			<Graph fetchData={fetchAcceptanceRate} label={"Acceptance Rate"} {...graphProps} />
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