"use client";

import { useEffect, useState } from "react";
import Graph, { GraphData } from "../../elements/Graph";
import { ChartConfig, Grade, School, Year } from "./Admissions";

export type AdmissionGraphsProps = {
    config: ChartConfig;
    updateConfig: (c: ChartConfig) => void;
    removeChart: () => void;
    clearChart: () => void;
    label: string;
    availableTabs: string[];
    schools: School[];
    years: Year[];
    grades: Grade[];
    showRemove: boolean;
    chartNumber?: number;
};

export default function AdmissionGraphs({ config, updateConfig, removeChart, clearChart, label, availableTabs, schools, years, grades, showRemove, chartNumber }: AdmissionGraphsProps) {
    // States to hold the fetched data to pass down to Graph component
    const [graphData, setGraphData] = useState<GraphData[]>([]);
    const [secondaryGraphData, setSecondaryGraphData] = useState<GraphData[]>([]);

    async function fetchAdmissions(fieldLabel: string = label) {
        if (!config.schoolSelection) return [];
        if (!config.yearSelection && !config.gradeSelection) return [];

        const params = {
            school: config.schoolSelection,
            year: config.yearSelection,
            grade: config.gradeSelection,
            field: fieldLabel.toUpperCase()
        };

        const queryString = new URLSearchParams(params as any).toString();
        const response = await fetch(`/admissions?${queryString}`);
        const data = await response.json();

        if (config.gradeSelection) {
            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        }

        return data.map((row: any): GraphData => ({ x: row.DESCRIPTION, y: row.DATA }));
    }

    // React to changes and fetch the necessary data for both axes
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            const primaryData = await fetchAdmissions(label);
            if (isMounted) setGraphData(primaryData);

            if (config.secondaryLabel) {
                const secondaryData = await fetchAdmissions(config.secondaryLabel);
                if (isMounted) setSecondaryGraphData(secondaryData);
            } else {
                if (isMounted) setSecondaryGraphData([]);
            }
        };

        loadData();

        return () => { isMounted = false };
    }, [config.schoolSelection, config.yearSelection, config.gradeSelection, config.secondaryLabel, label]);

    const handleChartTypeChange = (newType: string) => {
        // Only switch the chart type — preserve school/year/grade selections
        updateConfig({ ...config, chartType: newType });
    };

    const isDualAxisCompatible = config.chartType === "line" || config.chartType === "bar";

    return (
        <div className="border-2 border-[#0A3E6C] p-4 flex flex-col h-full rounded-b-lg rounded-tr-lg bg-white shadow-sm">
            {showRemove && chartNumber !== undefined && (
                <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0A3E6C] text-white text-xs font-bold">
                        {chartNumber}
                    </span>
                </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded justify-center items-center">
                <select
                    className="border p-1 text-sm rounded outline-none font-semibold text-[#0A3E6C]"
                    value={config.chartType}
                    onChange={(e) => handleChartTypeChange(e.target.value)}
                >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="doughnut">Doughnut</option>
                </select>

                <select
                    className="border p-1 text-sm rounded outline-none"
                    value={config.schoolSelection}
                    onChange={e => updateConfig({ ...config, schoolSelection: e.target.value })}
                >
                    <option value="">Select School</option>
                    {schools.map(s => <option key={s.ID} value={s.ID}>{s.NAME_TX}</option>)}
                </select>

                {config.chartType !== "line" && (
                    <select
                        className="border p-1 text-sm rounded outline-none"
                        value={config.yearSelection}
                        onChange={e => updateConfig({ ...config, yearSelection: e.target.value })}
                    >
                        <option value="">Select Year</option>
                        {years.map(y => <option key={y.ID} value={y.ID}>{y.SCHOOL_YEAR}</option>)}
                    </select>
                )}

                {config.chartType === "line" && (
                    <select
                        className="border p-1 text-sm rounded outline-none"
                        value={config.gradeSelection}
                        onChange={e => updateConfig({ ...config, gradeSelection: e.target.value })}
                    >
                        <option value="">Select Grade</option>
                        {grades.map(g => <option key={g.ID} value={g.ID}>{g.DESCRIPTION_TX}</option>)}
                    </select>
                )}

                {isDualAxisCompatible && (
                    <>
                        <select
                            className="border p-1 text-sm rounded outline-none bg-orange-50 text-orange-800 border-orange-200"
                            value={config.secondaryLabel}
                            onChange={e => updateConfig({ ...config, secondaryLabel: e.target.value })}
                        >
                            <option value="">+ Dual Axis (None)</option>
                            {availableTabs.filter(tab => tab !== label).map(tab => (
                                <option key={tab} value={tab}>{tab}</option>
                            ))}
                        </select>

                        {config.secondaryLabel && (
                            <div className="flex rounded-lg border border-orange-200 overflow-hidden">
                                {["line", "bar"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => updateConfig({ ...config, secondaryChartType: type })}
                                        className={`px-2.5 py-1 text-xs font-semibold transition-colors border-r border-orange-200 last:border-r-0 ${
                                            config.secondaryChartType === type
                                                ? "bg-orange-500 text-white"
                                                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                        }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)} Layer
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <button
                    onClick={clearChart}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                    Clear
                </button>

                {showRemove && (
                    <button onClick={removeChart} className="ml-auto text-red-600 text-sm font-bold hover:text-red-800 px-2">
                        Remove
                    </button>
                )}
            </div>

            <div className="flex-grow flex items-center justify-center w-full">
                <div className="w-full">
                    <Graph
                        label={label}
                        secondaryLabel={config.secondaryLabel}
                        chartType={config.chartType as any}
                        secondaryChartType={config.secondaryChartType as any}
                        data={graphData}
                        secondaryData={secondaryGraphData}
                    />
                </div>
            </div>
        </div>
    )
}