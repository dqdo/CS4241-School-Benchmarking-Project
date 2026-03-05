import { useEffect, useState } from "react";
import Button from "../../elements/Button";
import ButtonTab from "../../components/ButtonTab";
import EnrollAttritionGraphs from "./EnrollAttritionGraphs";
import TogglePill from "../../elements/TogglePill"

export type School = { NAME_TX: string; ID: number; };
export type Year = { SCHOOL_YEAR: string; ID: number; };

export type EnrollChartConfig = {
    id: number;
    schoolSelection: string;
    yearSelection: string;
    chartType: string;
    secondaryLabel: string;
    secondaryField: string;
    secondaryChartType: string;
};

export const TABS: { label: string; field: string }[] = [
    { label: "Students Added During Year",      field: "STUDENTS_ADDED_DURING_YEAR" },
    { label: "Students Graduated",              field: "STUDENTS_GRADUATED" },
    { label: "Students Dismissed/Withdrawn",    field: "STUD_DISS_WTHD" },
    { label: "Students Not Returning",          field: "STUD_NOT_RETURN" },
    { label: "Students Not Invited to Return",  field: "STUD_NOT_INV" },
    { label: "Exchange Students",               field: "EXCH_STUD_REPTS" },
];

export default function EnrollAttrition() {
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears]     = useState<Year[]>([]);

    const [activeTab, setActiveTab]                               = useState<string>(TABS[0].label);
    const [isSOC, setIsSOC]                                       = useState<boolean>(false);
    const [globalChartType, setGlobalChartType]                   = useState<string>("bar");
    const [globalSecondaryChartType, setGlobalSecondaryChartType] = useState<string>("line");

    const [charts, setCharts] = useState<EnrollChartConfig[]>([
        {
            id: Date.now(),
            schoolSelection: "",
            yearSelection: "",
            chartType: "bar",
            secondaryLabel: "",
            secondaryField: "",
            secondaryChartType: "line",
        },
    ]);

    useEffect(() => {
        if (schools.length === 0)
            fetch("/schools").then(r => r.json()).then(d => setSchools(d.filter((s: School) => !Number(s.NAME_TX))));
        if (years.length === 0)
            fetch("/years").then(r => r.json()).then(d => setYears(d));
    }, []);

    useEffect(() => {
        setCharts(prev =>
            prev.map(c =>
                c.secondaryLabel === activeTab ? { ...c, secondaryLabel: "", secondaryField: "" } : c
            )
        );
    }, [activeTab]);

    const collection  = isSOC ? "EnrollAttritionSOC" : "EnrollAttrition";
    const activeField = TABS.find(t => t.label === activeTab)?.field ?? "";

    const handleGlobalChartTypeChange = (newType: string) => {
        setGlobalChartType(newType);
        setCharts(prev => prev.map(c => ({ ...c, chartType: newType })));
    };

    const handleGlobalSecondaryChartTypeChange = (newType: string) => {
        setGlobalSecondaryChartType(newType);
        setCharts(prev => prev.map(c => ({ ...c, secondaryChartType: newType })));
    };

    const addChart = () => {
        if (charts.length < 4) {
            setCharts(prev => [...prev, {
                id: Date.now(),
                schoolSelection: "",
                yearSelection: "",
                chartType: globalChartType,
                secondaryLabel: "",
                secondaryField: "",
                secondaryChartType: globalSecondaryChartType,
            }]);
        }
    };

    const updateChart = (updated: EnrollChartConfig) => {
        setCharts(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const removeChart = (id: number) => {
        setCharts(prev => prev.filter(c => c.id !== id));
    };

    const clearChart = (id: number) => {
        setCharts(prev => prev.map(c => c.id === id
            ? { ...c, schoolSelection: "", yearSelection: "", secondaryLabel: "", secondaryField: "" }
            : c
        ));
    };

    const clearAllCharts = () => {
        setCharts(prev => prev.map(c => ({ ...c, schoolSelection: "", yearSelection: "", secondaryLabel: "", secondaryField: "" })));
    };

    const getGridLayout = () => {
        if (charts.length === 1) return "grid grid-cols-1 w-full max-w-5xl mx-auto gap-6";
        return "grid grid-cols-1 lg:grid-cols-2 w-full gap-4";
    };

    const isDualAxisCompatible = globalChartType === "line" || globalChartType === "bar";

    return (
        <div className="flex flex-col min-h-screen gap-4 p-4">
            {/* Tab row + SOC toggle */}
            <div className="flex flex-wrap items-end justify-between border-b-2 border-gray-200 pb-0">
                <div className="flex flex-wrap space-x-2">
                    {TABS.map(t => (
                        <ButtonTab
                            key={t.label}
                            title={t.label}
                            toggled={activeTab === t.label}
                            switchTab={setActiveTab}
                        />
                    ))}
                </div>

                <div className="mb-1 mt-1 mr-1">
                    <TogglePill label="SOC" value={isSOC} onChange={setIsSOC} />
                </div>
            </div>

            <div className="flex-1 mt-2">
                {/* Global controls */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Global Controls: Applies To All Charts</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearAllCharts}
                                className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                                Clear All
                            </button>
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0A3E6C] text-white text-xs font-bold">
                                    {charts.length}
                                </span>
                                <span>/ 4 charts</span>
                            </div>
                            <Button onClick={addChart} buttonText="Add Chart" disabled={charts.length >= 4} />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 px-4 py-3">
                        {/* Chart Type */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Chart Type:</span>
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                {["bar", "line", "pie", "doughnut"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleGlobalChartTypeChange(type)}
                                        className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                                            globalChartType === type
                                                ? "bg-[#0A3E6C] text-white"
                                                : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dual Axis Layer — only for bar/line */}
                        {isDualAxisCompatible && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Dual-Axis Layer:</span>
                                <div className="flex rounded-lg border border-orange-200 overflow-hidden">
                                    {["line", "bar"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleGlobalSecondaryChartTypeChange(type)}
                                            className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-orange-200 last:border-r-0 ${
                                                globalSecondaryChartType === type
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                            }`}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart grid */}
                <div className={getGridLayout()}>
                    {charts.map((chart, index) => (
                        <EnrollAttritionGraphs
                            key={chart.id}
                            config={chart}
                            updateConfig={updateChart}
                            removeChart={() => removeChart(chart.id)}
                            clearChart={() => clearChart(chart.id)}
                            label={activeTab}
                            field={activeField}
                            collection={collection}
                            schools={schools}
                            years={years}
                            availableTabs={TABS}
                            showRemove={charts.length > 1}
                            chartNumber={index + 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}