"use client";

import { useEffect, useState } from "react";
import Graph, { GraphData } from "../../elements/Graph";
import {ChartConfig} from "./Personnel";
import {Grade, School, Year} from "../admissions/Admissions";

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

type Stats = {
    average: number;
    median: number;
    range: { min: number; max: number };
};

export default function PersonnelGraphs({ config, updateConfig, removeChart, clearChart, label, availableTabs, schools, years, grades, showRemove, chartNumber }: AdmissionGraphsProps) {
    const [graphData, setGraphData] = useState<GraphData[]>([]);
    const [secondaryGraphData, setSecondaryGraphData] = useState<GraphData[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    async function fetchAdmissions(fieldLabel: string = label) {
        if (!config.schoolSelection) return [];

        const params = {
            school: config.schoolSelection,
            year: config.yearSelection,
            grade: config.gradeSelection,
            field: fieldLabel.toUpperCase()
        };

        const queryString = new URLSearchParams(params as any).toString();

        if (params.field === "TEACHERS LOST" || params.field === "TEACHERS GAINED") {
            const response = await fetch(`/personnelAttrition?${queryString}`);
            const data = await response.json();


            if (fieldLabel === label) {
                console.log(queryString.toString())
                const statsResponse = await fetch(`/personnelAttritionStats?${queryString}`);
                const statData = await statsResponse.json();
                setStats(statData);
            }


            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        } else {
            const response = await fetch(`/personnel?${queryString}`);
            const data = await response.json();

            if (fieldLabel === label) {
                const statsResponse = await fetch(`/personnelStats?${queryString}`);
                const statData = await statsResponse.json();
                setStats(statData);
            }

            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        }
    }

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
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
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

            <div className="flex-grow flex gap-4">
                {/* Graph */}
                <div className="flex-grow flex items-center justify-center min-w-0">
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

                {/* Peer Group Stats */}
                {stats && (
                    <div className="flex flex-col justify-center gap-2 w-28 shrink-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Peer Group</p>
                        {[
                            { label: "Avg", value: stats.average },
                            { label: "Median", value: stats.median },
                            { label: "Min", value: stats.range.min },
                            { label: "Max", value: stats.range.max },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-[#f0f5fb] rounded-lg p-2 text-center">
                                <p className="text-xs text-[#0A3E6C] font-semibold uppercase tracking-wide">{label}</p>
                                <p className="text-sm font-bold text-[#0A3E6C] mt-0.5">{value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}