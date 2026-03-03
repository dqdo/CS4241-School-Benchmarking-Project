import AdmissionsGraph from "./AdmissionsGraph";
import {useEffect, useState} from "react";
import Button from "../../elements/Button";
import AdmissionsCompare from "./AdmissionsCompare";
import SchoolSelector from "../../elements/SchoolSelector";

export type Grade = {
    ID: number;
    DESCRIPTION_TX: string;
}

export type School = {
    NAME_TX: string;
    ID: number;
}

export type Year = {
    SCHOOL_YEAR:string
    ID: number
}

const GraphSection = (props: {graphProps: any, compare:(label: string) => void, label:string}) => {
    return (
        <div className={"border-2 border-[#0A3E6C]"}>
            <AdmissionsGraph label={props.label} {...props.graphProps} />
            <div className={"flex space-x-2"}>
                <Button onClick={() => props.compare(props.label)} buttonText={"Compare"} />
            </div>
        </div>
    )
}

export default function Admissions() {
    // Stay unchanged after first fetch
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [userSchool, setUserSchool] = useState<School>({ID: -1, NAME_TX: "NONE"});

    // Dropdowns
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");
    const [gradeSelection, setGradeSelection] = useState<string>("None");
    const [chartType, setChartType] = useState<string>("bar");

    // Comparing flags
    const [isComparing, setIsComparing] = useState<boolean>(false);
    const [compareType, setCompareType] = useState<string>("");

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

    useEffect(() => {
        // These fields only need to be fetched once. They do not change
        if(schools.length === 0)
            fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        if(years.length === 0)
            fetch("/years").then(res => res.json()).then(data => setYears(data));
        if(grades.length === 0)
            fetch("/grades").then(res => res.json()).then(data => setGrades(data));
        if(userSchool.ID === -1)
            fetch("/usersSchool").then(res => res.json()).then(data => setUserSchool(data));
    }, [])

    useEffect(() => {
        // Other charts don't need the grade field
        // Line charts don't need the year field
        if(chartType !== "line"){
            setGradeSelection("");
        }else {
            setYearSelection("");
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
        return <AdmissionsCompare schools={schools} grades={grades} years={years} userSchool={userSchool} exitCompare={exitCompare} compareType={compareType}/>
    }
    return (
        <div>
            <SchoolSelector userSchool={userSchool} schools={schools} years={years} schoolSelection={schoolSelection} setSchoolSelection={setSchoolSelection} yearSelection={yearSelection} setYearSelection={setYearSelection} chartType={chartType} setChartType={setChartType} grades={grades} gradeSelection={gradeSelection} setGradeSelection={setGradeSelection} />
            <div className={"mt-2 grid grid-cols-2 gap-4"}>
                <GraphSection graphProps={graphProps} label={"Acceptances"} compare={compare}/>
                <GraphSection graphProps={graphProps} label={"Enrollments"} compare={compare}/>
                <GraphSection graphProps={graphProps} label={"Enroll Capacity"} compare={compare}/>
                <GraphSection graphProps={graphProps} label={"Completed Application"} compare={compare}/>
            </div>
        </div>

    )

}