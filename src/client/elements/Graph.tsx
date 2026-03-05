"use client";

import { useEffect, useRef } from "react";
import Chart, { ChartData, ChartOptions, ChartDataset } from 'chart.js/auto';

export type GraphData = {
    x: string | number;
    y: number;
};

export type GraphProps = {
    label: string;
    chartType: "doughnut" | "bar" | "pie" | "line";
    data: GraphData[];
    secondaryLabel?: string;
    secondaryData?: GraphData[];
    secondaryChartType?: "bar" | "line";
}

const CHART_COLORS = [
    "#0A3E6C", "#E03131", "#2B8A3E", "#F59E0B", "#862E9C",
    "#1C7ED6", "#0CA678", "#D9480F", "#D6336C", "#74B816",
    "#5F3DC4", "#F08C00", "#C2255C", "#1098AD"
];

export default function Graph(props: GraphProps) {
    const {
        label, chartType, data, secondaryLabel, secondaryData = [], secondaryChartType
    } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Clean up previous chart instance before rendering a new one
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const isDualAxis = secondaryData.length > 0 && (chartType === 'line' || chartType === 'bar');

        // Use ChartDataset type for proper TS support
        const datasets: ChartDataset[] = [{
            type: chartType,
            label: label,
            data: data.map(row => row.y),
            // For line charts, use a single color. For bar/pie, use the palette.
            backgroundColor: chartType === 'line' ? CHART_COLORS[0] : CHART_COLORS,
            borderColor: chartType === 'line' ? CHART_COLORS[0] : CHART_COLORS,
            borderWidth: chartType === 'line' ? 3 : 1,
            yAxisID: isDualAxis ? 'y' : undefined,
        }];

        if (isDualAxis && secondaryLabel) {
            datasets.push({
                type: secondaryChartType || 'line',
                label: secondaryLabel,
                data: secondaryData.map(row => row.y),
                backgroundColor: "#F59E0B",
                borderColor: "#F59E0B",
                borderWidth: 3,
                yAxisID: 'y1',
            });
        }

        const chartData: ChartData = {
            labels: data.length > 0 ? data.map(row => row.x) : secondaryData.map(row => row.x),
            datasets,
        };

        const chartOptions: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "top" },
                tooltip: { enabled: true }
            },
            scales: isDualAxis ? {
                y: { type: 'linear', display: true, position: 'left' },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } },
            } : undefined
        };

        chartRef.current = new Chart(canvasRef.current, {
            type: chartType,
            data: chartData,
            options: chartOptions,
        });

        // Cleanup on unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, secondaryData, chartType, secondaryChartType, label, secondaryLabel]);

    const isCircularChart = chartType === 'pie' || chartType === 'doughnut';
    const chartTitle = `${label} ${secondaryLabel && (chartType === 'line' || chartType === 'bar') ? ` vs ${secondaryLabel}` : ""}`;

    return (
        <div className="text-center flex flex-col items-center w-full">
            {chartTitle.trim() && (
                <h1 className="font-bold text-2xl mb-4 text-[#1E3869]">{chartTitle}</h1>
            )}
            <div className={`w-full flex justify-center relative h-[400px] ${isCircularChart ? 'max-w-[65%] xl:max-w-[55%]' : ''}`}>
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}