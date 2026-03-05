import { useEffect, useState } from "react";
import Button from "../../elements/Button";
import ButtonTab from "../../components/ButtonTab";
import PersonnelGraphs from "./PersonnelGraphs";

export type Grade = { ID: number; DESCRIPTION_TX: string; }
export type School = { NAME_TX: string; ID: number; }
export type Year = { SCHOOL_YEAR: string; ID: number; }

export type ChartConfig = {
    id: number;
    schoolSelection: string;
    yearSelection: string;
    gradeSelection: string;
    secondaryLabel: string;
    chartType: string;
    secondaryChartType: string;
}

export default function Personnel() {
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);

    const [activeTab, setActiveTab] = useState<string>("Total Teacher FTEs");

    const [globalChartType, setGlobalChartType] = useState<string>("line");
    const [globalSecondaryChartType, setGlobalSecondaryChartType] = useState<string>("line");

    const [charts, setCharts] = useState<ChartConfig[]>([
        { id: Date.now(), schoolSelection: "", yearSelection: "", gradeSelection: "", secondaryLabel: "", chartType: "line", secondaryChartType: "line" }
    ]);

    const tabs = ["Total Teacher FTEs", "Total FTEs", "Teachers Lost", "Teachers Gained"];

    useEffect(() => {
        if (schools.length === 0) fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        if (years.length === 0) fetch("/years").then(res => res.json()).then(data => setYears(data));
        if (grades.length === 0) fetch("/grades").then(res => res.json()).then(data => setGrades(data));
    }, []);

    useEffect(() => {
        setCharts(prev => prev.map(chart => (chart.secondaryLabel === activeTab ? { ...chart, secondaryLabel: "" } : chart)));
    }, [activeTab]);

    const handleGlobalChartTypeChange = (newType: string) => {
        setGlobalChartType(newType);
        setCharts(charts.map(chart => ({ ...chart, chartType: newType })));
    };

    const handleGlobalSecondaryChartTypeChange = (newType: string) => {
        setGlobalSecondaryChartType(newType);
        setCharts(charts.map(chart => ({ ...chart, secondaryChartType: newType })));
    };

    const clearChart = (id: number) => {
        setCharts(charts.map(c => c.id === id
            ? { ...c, schoolSelection: "", yearSelection: "", gradeSelection: "", secondaryLabel: "" }
            : c
        ));
    };

    const clearAllCharts = () => {
        setCharts(charts.map(c => ({ ...c, schoolSelection: "", yearSelection: "", gradeSelection: "", secondaryLabel: "" })));
    };

    const addChart = () => {
        if (charts.length < 4) {
            setCharts([...charts, {
                id: Date.now(),
                schoolSelection: "",
                yearSelection: "",
                gradeSelection: "",
                secondaryLabel: "",
                chartType: globalChartType,
                secondaryChartType: globalSecondaryChartType
            }]);
        }
    };

    const updateChart = (updatedConfig: ChartConfig) => {
        setCharts(charts.map(c => c.id === updatedConfig.id ? updatedConfig : c));
    };

    const removeChart = (id: number) => {
        setCharts(charts.filter(c => c.id !== id));
    };

    const getGridLayout = () => {
        if (charts.length === 1) return "grid grid-cols-1 w-full max-w-5xl mx-auto gap-6";
        return "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 w-full gap-4";
    };

    return (
        <div className="flex flex-col min-h-screen gap-4 p-4">
            <div className="flex flex-wrap space-x-2 border-b-2 border-gray-200 pb-0">
                {tabs.map(tab => (
                    <ButtonTab
                        key={tab}
                        title={tab}
                        toggled={activeTab === tab}
                        switchTab={setActiveTab}
                    />
                ))}
            </div>

            <div className="flex-1 mt-2">
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
                        {(globalChartType === "bar" || globalChartType === "line") && (
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

                <div className={getGridLayout()}>
                    {charts.map((chart, index) => (
                        <PersonnelGraphs
                            key={chart.id}
                            config={chart}
                            updateConfig={updateChart}
                            removeChart={() => removeChart(chart.id)}
                            clearChart={() => clearChart(chart.id)}
                            label={activeTab}
                            availableTabs={tabs}
                            schools={schools}
                            years={years}
                            grades={grades}
                            showRemove={charts.length > 1}
                            chartNumber={index + 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}