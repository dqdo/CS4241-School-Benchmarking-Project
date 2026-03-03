"use client";

import {useEffect, useRef, useState} from "react";
import Chart, {ChartData, ChartOptions, ChartType} from 'chart.js/auto';
import SchoolSelector from "../../elements/SchoolSelector";
import {Grade, School, Year} from "./Admissions";

export type AdmissionsGraphProps = {
    label: string;
    standalone: boolean;
    selectedSchool?: string;
    selectedYear?: string;
    selectedGrade?: string;
    chartType: "doughnut" | "bar" | "pie" | "line";
    schools: School[];
    years: Year[];
    grades: Grade[];
    userSchool: School;
}

type AdmissionsDataEntry = {
    DATA: number;
    DESCRIPTION: string;
    YEAR: number;
};

export default function AdmissionsGraph(props: AdmissionsGraphProps) {

    // ChartJs Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    // Chart Data
    const [admissionsData, setAdmissionsData] = useState<AdmissionsDataEntry[]>([]);

    // Selections - Only used for standalone mode
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");
    const [gradeSelection, setGradeSelection] = useState<string>("None");

    // Colors for charts
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

    // Fetch admission data when year, grade, school or chart type changes
    useEffect(() => {
        fetchAdmissions();
    }, [props.selectedSchool, props.selectedYear, props.selectedGrade, schoolSelection, yearSelection, gradeSelection, props.chartType]);

    // Same functionality as in Admissions.tsx but for standalone graphs
    useEffect(() => {
        if(!props.standalone)
            return;
        // Other charts don't need the grade field
        // Line charts don't need the year field
        if(props.chartType !== "line"){
            setGradeSelection("");
        }else {
            setYearSelection("");
        }
    }, [props.chartType]);


    useEffect(() => {
        let isMounted = true;
        if (!isMounted || !canvasRef.current) return;
        // Destroy previous chart if exists
        if (chartRef.current) chartRef.current.destroy();

        const chartData: ChartData<ChartType, number[], string> = {
            // line charts use school year as the x-axis, others use grade
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
            {props.standalone && <SchoolSelector grades={props.grades} chartType={props.chartType} gradeSelection={gradeSelection} setGradeSelection={setGradeSelection} userSchool={props.userSchool} schools={props.schools} years={props.years} schoolSelection={schoolSelection} setSchoolSelection={setSchoolSelection} yearSelection={yearSelection} setYearSelection={setYearSelection} />
            }
            <h1 className={"font-bold text-2xl"}>{props.label}</h1>
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}