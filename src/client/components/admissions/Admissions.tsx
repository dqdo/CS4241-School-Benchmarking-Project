import AdmissionsGraph, {School, Year} from "./AdmissionsGraph";
import {useEffect, useState} from "react";
import Dropdown from "../../elements/Dropdown";
import {ChartType} from "chart.js";
import Button from "../../elements/Button";
import AdmissionsCompare from "./AdmissionsCompare";
import SchoolSelector from "../../elements/SchoolSelector";

export type Grade = {
    ID: number;
    DESCRIPTION_TX: string;
}

export default function Admissions() {
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");
    const [gradeSelection, setGradeSelection] = useState<string>("None");
    const [chartType, setChartType] = useState<string>("bar");
    const [isComparing, setIsComparing] = useState<boolean>(false);
    const [compareType, setCompareType] = useState<string>("");
    const [userSchool, setUserSchool] = useState<School>({ID: -1, NAME_TX: "NONE"});
    const [grades, setGrades] = useState<Grade[]>([]);

    useEffect(() => {
        fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        fetch("/years").then(res => res.json()).then(data => setYears(data));
        fetch("/grades").then(res => res.json()).then(data => setGrades(data));
        fetch("/usersSchool").then(res => res.json()).then(data => setUserSchool(data));
    }, [])

    useEffect(() => {
        if(chartType !== "line"){
            setGradeSelection("");
        }
    }, [chartType]);

    function compare(type: string){
        setCompareType(type);
        setIsComparing(true);
    }

    function exitCompare(){
        setIsComparing(false);
        setCompareType("");
    }

    if(isComparing){
        return <AdmissionsCompare exitCompare={exitCompare} compareType={compareType}/>
    }
    return (
        <div>
            <SchoolSelector userSchool={userSchool} schools={schools} years={years} schoolSelection={schoolSelection} setSchoolSelection={setSchoolSelection} yearSelection={yearSelection} setYearSelection={setYearSelection} chartType={chartType} setChartType={setChartType} grades={grades} gradeSelection={gradeSelection} setGradeSelection={setGradeSelection} />
            <div className={"mt-2 grid grid-cols-2 gap-4"}>
                <div className={"border-2 border-[#0A3E6C]"}>
                    <AdmissionsGraph label={"Acceptances"} standalone={false} selectedGrade={gradeSelection} selectedSchool={userSchool?.NAME_TX} selectedYear={yearSelection} chartType={chartType as "bar" | "doughnut" | "pie" | "line"} />
                    <div className={"flex space-x-2"}>
                        <Button onClick={() => compare("Acceptances")} buttonText={"Compare"} />
                    </div>
                </div>
                <div className={"border-2 border-[#0A3E6C]"}>
                    <AdmissionsGraph label={"Enrollments"} standalone={false} selectedGrade={gradeSelection} selectedSchool={schoolSelection} selectedYear={yearSelection} chartType={chartType as "bar" | "doughnut" | "pie" | "line"} />
                    <div className={"flex space-x-2"}>
                        <Button onClick={() => compare("Enrollments")} buttonText={"Compare"} />
                    </div>
                </div>
                <div className={"border-2 border-[#0A3E6C]"}>
                    <AdmissionsGraph label={"Enroll Capacity"} standalone={false} selectedGrade={gradeSelection} selectedSchool={schoolSelection} selectedYear={yearSelection} chartType={chartType as "bar" | "doughnut" | "pie" | "line"}  />
                    <div className={"flex space-x-2"}>
                        <Button onClick={() => compare("Enroll Capacity")} buttonText={"Compare"} />
                    </div>
                </div>
                <div className={"border-2 border-[#0A3E6C]"}>
                    <AdmissionsGraph label={"Completed Application"} selectedGrade={gradeSelection} standalone={false} selectedSchool={schoolSelection} selectedYear={yearSelection} chartType={chartType as "bar" | "doughnut" | "pie" | "line"}  />
                    <div className={"flex space-x-2"}>
                        <Button onClick={() => compare("Completed Application")} buttonText={"Compare"} />
                    </div>
                </div>
            </div>
        </div>

    )

}