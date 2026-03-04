import {useEffect, useState} from "react";
import Dropdown from "../elements/Dropdown";
import EnrollmentKPIs from "./dashboard/EnrollmentKPIs";
import PersonnelKPIs from "./dashboard/PersonnelKPIs";
import EmployeeRatioKPIs from "./dashboard/EmployeeRatioKPIs";
import AttritionKPIs from "./dashboard/AttritionKPIs";
import { Grade, School, Year } from "./admissions/Admissions";
import SchoolSelector from "../elements/SchoolSelector";
import Graph, { GraphData } from "../elements/Graph";

export default function Dashboard() {
    // Static Data
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [userSchool, setUserSchool] = useState<School>({ID: -1, NAME_TX: "NONE"});

    // Dropdowns
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");
    const [gradeSelection, setGradeSelection] = useState<string>("");
    const [chartType, setChartType] = useState<"bar" | "doughnut" | "pie" | "line">("line");

    // State to hold the fetched graph data
    const [acceptanceData, setAcceptanceData] = useState<GraphData[]>([]);

    // Initial data fetch
    useEffect(() => {
        if (schools.length === 0)
            fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        if (years.length === 0)
            fetch("/years").then(res => res.json()).then(data => setYears(data));
        if (grades.length === 0)
            fetch("/grades").then(res => res.json()).then(data => setGrades(data));
        if (userSchool.ID === -1)
            fetch("/usersSchool").then(res => res.json()).then(data => setUserSchool(data));
    }, []);

    // Fetch acceptance rate data whenever dropdowns change
    useEffect(() => {
        async function fetchAcceptanceRate() {
            if (!schoolSelection || !gradeSelection) {
                setAcceptanceData([]);
                return;
            }

            try {
                const params = new URLSearchParams({
                    school: schoolSelection,
                    grade: gradeSelection,
                });

                const response = await fetch("/acceptanceRateG?" + params.toString());
                const data = await response.json();

                const formattedData = data.map((row: {acceptanceRate: number, year: number}): GraphData => {
                    return { x: row.year, y: row.acceptanceRate };
                });

                setAcceptanceData(formattedData);
            } catch (error) {
                console.error("Failed to fetch graph data", error);
                setAcceptanceData([]);
            }
        }

        fetchAcceptanceRate();
    }, [schoolSelection, gradeSelection]);

    return (
        <div className="mt-4">
            <SchoolSelector
                userSchool={userSchool}
                schools={schools}
                years={years}
                schoolSelection={schoolSelection}
                setSchoolSelection={setSchoolSelection}
                yearSelection={yearSelection}
                setYearSelection={setYearSelection}
                chartType="line"
                grades={grades}
                gradeSelection={gradeSelection}
                setGradeSelection={setGradeSelection}
            />

            <h1 className="font-bold text-2xl">Enrollment</h1>
            <EnrollmentKPIs selectedSchool={schoolSelection}/>

            <hr className="my-4" />
            <h1 className="font-bold text-2xl">Personnel</h1>
            <PersonnelKPIs selectedSchool={schoolSelection}/>

            <hr className="my-4" />
            <h1 className="font-bold text-2xl">Attrition</h1>
            <AttritionKPIs selectedSchool={schoolSelection}/>

            <hr className="my-4" />
            <h1 className="font-bold text-2xl">Employee Ratios</h1>
            <EmployeeRatioKPIs selectedSchool={schoolSelection}/>
        </div>
    );
}