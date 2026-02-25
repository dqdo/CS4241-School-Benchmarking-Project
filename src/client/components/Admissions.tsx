"use client"; // important for Next.js

import {useEffect, useRef, useState} from "react";
import Chart, {ChartData, ChartOptions} from 'chart.js/auto';
import Dropdown from "../elements/Dropdown";
import Button from "../elements/Button";

type AdmissionsDataEntry = {
    ACCEPTANCES_BOYS: number;
    ACCEPTANCES_GIRLS: number;
    GRADE_DEF_ID: number;
};

type School = {
    option: string;
    value: number;
}

export default function Admissions() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [admissionsData, setAdmissionsData] = useState<AdmissionsDataEntry[]>([]);
    const [schoolSelection, setSchoolSelection] = useState<string>();
    const [yearSelection, setYearSelection] = useState<string>();

    const [schools, setSchools] = useState<School[]>([]);

    useEffect(() => {

        fetch("/schools").then(res => res.json()).then(data => setSchools(data));

        let isMounted = true;
        if (!isMounted || !canvasRef.current) return;
        // Destroy previous chart if exists
        if (chartRef.current) chartRef.current.destroy();

        const chartData: ChartData<"bar", number[], number> = {
            labels: admissionsData.map((row) => row.GRADE_DEF_ID),
            datasets: [
                {
                    label: "Boys Acceptances from school 1 year 7",
                    data: admissionsData.map((row) => row.ACCEPTANCES_BOYS),
                    backgroundColor: "rgba(75, 192, 192, 0.5)",
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
        };
        const queryString = new URLSearchParams(params).toString();
        fetch("/admissions?" + queryString).then((res) => res.json()).then((admissionsData: AdmissionsDataEntry[]) => setAdmissionsData(admissionsData));
    }

    return (
        <div>
            <div className={"mt-2 ml-2 flex space-x-2"}>
                <Dropdown prompt={"Select School..."} setOption={setSchoolSelection} options={schools.map(school => {option: school.option, school:school.value})} />
                <Dropdown prompt={"Select Year..."} setOption={setYearSelection} options={["7", "8"]} />
                <Button onClick={() => fetchAdmissions()} buttonText={"Submit"}/>
            </div>
            <canvas ref={canvasRef}></canvas>
        </div>
        )

}