"use client";

import { useEffect, useRef, useState } from "react";
import Chart, { ChartData, ChartOptions } from "chart.js/auto";
import Dropdown from "../../elements/Dropdown";
import Button from "../../elements/Button";

type EnrollAttritionGraphProps = {
    label: string;
    field: string;
    chartType?: "bar" | "line";
    collection: "EnrollAttrition" | "EnrollAttritionSOC";
};

type EnrollDataEntry = {
    VALUE: number;
    DESCRIPTION: string;
};

type School = {
    NAME_TX: string;
    ID: number;
};

type Year = {
    SCHOOL_YEAR: string;
    ID: number;
};

export default function EnrollAttritionGraph(props: EnrollAttritionGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [enrollData, setEnrollData] = useState<EnrollDataEntry[]>([]);
    const [schoolSelection, setSchoolSelection] = useState<string>("");
    const [yearSelection, setYearSelection] = useState<string>("");
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);

    useEffect(() => {
        fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        fetch("/years").then(res => res.json()).then(data => setYears(data));
    }, []);

    // Reset chart data when collection toggles
    useEffect(() => {
        setEnrollData([]);
    }, [props.collection]);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();

        const type = props.chartType ?? "bar";

        const chartData: ChartData<typeof type, number[], string> = {
            labels: enrollData.map((row) => row.DESCRIPTION),
            datasets: [
                {
                    label: props.label,
                    data: enrollData.map((row) => row.VALUE),
                    backgroundColor: "rgba(30, 56, 105, 0.5)",
                    borderColor: "rgba(30, 56, 105, 1)",
                    borderWidth: 2,
                    fill: type === "line" ? false : undefined,
                    tension: type === "line" ? 0.3 : undefined,
                } as any,
            ],
        };

        const chartOptions: ChartOptions<typeof type> = {
            responsive: true,
            plugins: {
                legend: { position: "top" },
                tooltip: { enabled: true },
            },
            scales: {
                y: { beginAtZero: true },
            },
        };

        chartRef.current = new Chart(canvasRef.current, {
            type,
            data: chartData,
            options: chartOptions,
        });

        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [enrollData]);

    function fetchEnrollData() {
        const params = {
            school: schoolSelection,
            year: yearSelection,
            field: props.field,
            collection: props.collection,
        };
        const queryString = new URLSearchParams(params).toString();
        fetch("/enrollment-attrition?" + queryString)
            .then((res) => res.json())
            .then((data: EnrollDataEntry[]) => setEnrollData(data));
    }

    return (
        <div className="text-center">
            <h1 className="font-bold text-2xl">{props.label}</h1>
            <div className="mt-2 ml-2 flex space-x-2">
                <Dropdown
                    option={schoolSelection}
                    prompt="Select School..."
                    setOption={setSchoolSelection}
                    options={schools.map(school => ({ option: school.NAME_TX, value: school.ID }))}
                />
                <Dropdown
                    option={yearSelection}
                    prompt="Select Year..."
                    setOption={setYearSelection}
                    options={years.map(year => ({ option: year.SCHOOL_YEAR, value: year.ID }))}
                />
                <Button onClick={() => fetchEnrollData()} buttonText="Submit" />
            </div>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}
