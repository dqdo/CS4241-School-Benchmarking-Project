"use client";

import {useEffect, useRef, useState} from "react";
import Chart, {ChartData, ChartOptions} from 'chart.js/auto';
import Dropdown from "../../elements/Dropdown";
import Button from "../../elements/Button";

type AdmissionsGraphProps = {
    label: string;
}

type AdmissionsDataEntry = {
    BOYS: number;
    GIRLS: number;
    DESCRIPTION: string;
};

type School = {
    NAME_TX: string;
    ID: number;
}

type Year = {
    SCHOOL_YEAR:string
    ID: number
}

export default function AdmissionsGraph(props: AdmissionsGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [admissionsData, setAdmissionsData] = useState<AdmissionsDataEntry[]>([]);
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");

    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);


    useEffect(() => {

        fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        fetch("/years").then(res => res.json()).then(data => setYears(data));
        let isMounted = true;
        if (!isMounted || !canvasRef.current) return;
        // Destroy previous chart if exists
        if (chartRef.current) chartRef.current.destroy();

        const chartData: ChartData<"bar", number[], string> = {
            labels: admissionsData.map((row) => row.DESCRIPTION),
            datasets: [
                {
                    label: "Boys " + props.label,
                    data: admissionsData.map((row) => row.BOYS),
                    backgroundColor: "rgba(75, 192, 192, 0.5)",
                },
                {
                    label: "Girls " + props.label,
                    data: admissionsData.map((row) => row.GIRLS),
                    backgroundColor: "rgba(97, 54, 192, 0.5)",
                },
            ],
        };

        const chartOptions: ChartOptions<"bar"> = {
            responsive: true,
            plugins: { legend: { position: "top" }, tooltip: { enabled: true } },
        };

        chartRef.current = new Chart(canvasRef.current, {
            type: "bar",
            data: chartData,
            options: chartOptions,
        });

        return () => {
            isMounted = false;
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [admissionsData]);

    function fetchAdmissions() {
        const params = {
            school: schoolSelection,
            year: yearSelection,
            field: props.label.toUpperCase()
        };
        const queryString = new URLSearchParams(params).toString();
        fetch("/admissions?" + queryString).then((res) => res.json()).then((admissionsData: AdmissionsDataEntry[]) => setAdmissionsData(admissionsData));
    }

    return (
        <div className={"text-center"}>
            <h1 className={"font-bold text-2xl"}>{props.label}</h1>
            <div className={"mt-2 ml-2 flex space-x-2"}>
                <Dropdown option={schoolSelection} prompt={"Select School..."} setOption={setSchoolSelection} options={schools.map(school => {
                    return {option: school.NAME_TX, value: school.ID}
                })} />
                <Dropdown option={yearSelection} prompt={"Select Year..."} setOption={setYearSelection} options={years.map(year => {
                    return {option: year.SCHOOL_YEAR, value: year.ID}
                })} />
                <Button onClick={() => fetchAdmissions()} buttonText={"Submit"}/>
            </div>
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}