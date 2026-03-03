"use client";

import {useEffect, useRef, useState} from "react";
import Chart, {ChartData, ChartOptions, ChartType} from 'chart.js/auto';
import Dropdown from "../../elements/Dropdown";
import Button from "../../elements/Button";
import SchoolSelector from "../../elements/SchoolSelector";
import {Grade} from "./Admissions";

type AdmissionsGraphProps = {
    label: string;
    standalone: boolean;
    selectedSchool?: string;
    selectedYear?: string;
    selectedGrade?: string;
    chartType: "doughnut" | "bar" | "pie" | "line";
}

type AdmissionsDataEntry = {
    DATA: number;
    DESCRIPTION: string;
    YEAR: number;
};

export type School = {
    NAME_TX: string;
    ID: number;
}

export type Year = {
    SCHOOL_YEAR:string
    ID: number
}

export default function AdmissionsGraph(props: AdmissionsGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [admissionsData, setAdmissionsData] = useState<AdmissionsDataEntry[]>([]);
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");
    const [gradeSelection, setGradeSelection] = useState<string>("None");
    const [userSchool, setUserSchool] = useState<School>({ID: -1, NAME_TX: "NONE"});
    const [grades, setGrades] = useState<Grade[]>([]);

    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const colors = [
        "#0A3E6C", // primary dark blue
        "#0066CC", // accent blue
        "#1A5FA8", // medium blue
        "#0D5290", // slightly darker
        "#2A73C2", // lighter blue
        "#5390FF", // bright blue
        "#3E7CB1", // muted blue
        "#1F4E79", // navy shade
        "#6699CC", // soft blue
        "#AEC6E8", // pastel blue
        "#3B82C4", // extra blue 1
        "#60A5FA", // extra blue 2
        "#1C4F9C", // extra blue 3
        "#0E3B73"  // extra blue 4
    ];

    useEffect(() => {
        fetchAdmissions();
    }, [props.selectedSchool, props.selectedYear, props.selectedGrade, schoolSelection, yearSelection, props.chartType]);


    useEffect(() => {
        fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        fetch("/years").then(res => res.json()).then(data => setYears(data));
        fetch("/usersSchool").then(res => res.json()).then(data => setUserSchool(data));
        fetch("/grades").then(res => res.json()).then(data => setGrades(data));
        let isMounted = true;
        if (!isMounted || !canvasRef.current) return;
        // Destroy previous chart if exists
        if (chartRef.current) chartRef.current.destroy();

        const chartData: ChartData<ChartType, number[], string> = {
            labels: admissionsData.map((row) => props.chartType === "line" ? String(row.YEAR) : row.DESCRIPTION),
            datasets: [
                {
                    label: props.label,
                    data: admissionsData.map((row) => row.DATA),
                    backgroundColor: colors,
                },
            ],
        };

        const chartOptions: ChartOptions<ChartType> = {
            responsive: true,
            plugins: { legend: { position: "top" }, tooltip: { enabled: true } },
        };

        chartRef.current = new Chart(canvasRef.current, {
            type: props.chartType,
            data: chartData,
            options: chartOptions,
        });

        return () => {
            isMounted = false;
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [admissionsData, props.chartType]);

    function fetchAdmissions() {
        const params = {
            school: String(props.standalone ? schoolSelection : props.selectedSchool), // string cast bc typescript
            year: String(props.standalone ? yearSelection : props.selectedYear),
            grade: String(props.standalone ? gradeSelection : props.selectedGrade),
            field: props.label.toUpperCase()
        };
        const queryString = new URLSearchParams(params).toString();
        fetch("/admissions?" + queryString).then((res) => res.json()).then((admissionsData: AdmissionsDataEntry[]) => setAdmissionsData(admissionsData));
    }

    return (
        <div className={"text-center"}>
            {props.standalone && <SchoolSelector grades={grades} chartType={props.chartType} gradeSelection={gradeSelection} setGradeSelection={setGradeSelection} userSchool={userSchool} schools={schools} years={years} schoolSelection={schoolSelection} setSchoolSelection={setSchoolSelection} yearSelection={yearSelection} setYearSelection={setYearSelection} />
            }
            <h1 className={"font-bold text-2xl"}>{props.label}</h1>
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}