"use client";

import {useEffect, useRef, useState} from "react";
import Chart, {ChartData, ChartOptions, ChartType} from 'chart.js/auto';
import {Grade, School, Year} from "../components/admissions/Admissions";

export type GraphProps = {
    label: string;
    chartType: "doughnut" | "bar" | "pie" | "line";
    schools: School[];
    years: Year[];
    grades: Grade[];
    userSchool: School;
    fetchData: (label: string) => Promise<GraphData[]>;

    selectedSchool: string;
    selectedYear: string;
    selectedGrade: string;

}

export type GraphData = {
    x: any;
    y: any;
};

export default function Graph(props: GraphProps) {

    // ChartJs Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    // Chart Data
    const [graphData, setGraphData] = useState<GraphData[]>([]);

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
        props.fetchData(props.label).then(data => setGraphData(data));
    }, [props.selectedSchool, props.selectedYear, props.selectedGrade]);

    useEffect(() => {
        let isMounted = true;
        if (!isMounted || !canvasRef.current) return;
        // Destroy previous chart if exists
        if (chartRef.current) chartRef.current.destroy();

        const chartData: ChartData<ChartType, number[], string> = {
            labels: graphData.map((row) => row.x),
            datasets: [
                {
                    label: props.label,
                    data: graphData.map((row) => row.y),
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
    }, [graphData, props.chartType]);

    return (
        <div className={"text-center"}>
            <h1 className={"font-bold text-2xl"}>{props.label}</h1>
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}