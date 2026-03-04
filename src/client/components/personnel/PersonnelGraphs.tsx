"use client";

import { useEffect, useState } from "react";
import Graph, { GraphData } from "../../elements/Graph";
import {ChartConfig} from "./Personnel";
import {Grade, School, Year} from "../admissions/Admissions";

export type AdmissionGraphsProps = {
    config: ChartConfig;
    updateConfig: (c: ChartConfig) => void;
    removeChart: () => void;
    label: string;
    availableTabs: string[];
    schools: School[];
    years: Year[];
    grades: Grade[];
    showRemove: boolean;
};

export default function PersonnelGraphs({ config, updateConfig, removeChart, label, availableTabs, schools, years, grades, showRemove }: AdmissionGraphsProps) {
    // States to hold the fetched data to pass down to Graph component
    const [graphData, setGraphData] = useState<GraphData[]>([]);
    const [secondaryGraphData, setSecondaryGraphData] = useState<GraphData[]>([]);

    async function fetchAdmissions(fieldLabel: string = label) {
        if (!config.schoolSelection) return [];

        const params = {
            school: config.schoolSelection,
            year: config.yearSelection,
            grade: config.gradeSelection,
            field: fieldLabel.toUpperCase()
        };
        console.log(params.field)
        const queryString = new URLSearchParams(params as any).toString();
        if(params.field === "TEACHERS LOST" || params.field === "TEACHERS GAINED") {
            const response = await fetch(`/personnelAttrition?${queryString}`);
            const data = await response.json();

            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        }else{
            const response = await fetch(`/personnel?${queryString}`) ;
            const data = await response.json();

            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        }
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
        const updatedConfig = { ...config, chartType: newType };
        if (newType !== "line") updatedConfig.gradeSelection = "";
        if (newType === "line") updatedConfig.yearSelection = "";
        updateConfig(updatedConfig);
    };

    const isDualAxisCompatible = config.chartType === "line" || config.chartType === "bar";

    return (
        <div className="border-2 border-[#0A3E6C] p-4 flex flex-col h-full rounded-b-lg rounded-tr-lg bg-white shadow-sm">
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
                            <select
                                className="border p-1 text-sm rounded outline-none bg-orange-50 text-orange-800 border-orange-200"
                                value={config.secondaryChartType}
                                onChange={(e) => updateConfig({ ...config, secondaryChartType: e.target.value })}
                            >
                                <option value="line">Line Layer</option>
                                <option value="bar">Bar Layer</option>
                            </select>
                        )}
                    </>
                )}

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