import { useEffect, useState } from "react";
import Button from "../../elements/Button";
import ButtonTab from "../../components/ButtonTab";
import AdmissionGraphs from "./AdmissionGraphs";

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

export default function Admissions() {
    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);

    const [activeTab, setActiveTab] = useState<string>("Acceptances");

    const [globalChartType, setGlobalChartType] = useState<string>("bar");
    const [globalSecondaryChartType, setGlobalSecondaryChartType] = useState<string>("line");

    const [charts, setCharts] = useState<ChartConfig[]>([
        { id: Date.now(), schoolSelection: "", yearSelection: "", gradeSelection: "", secondaryLabel: "", chartType: "bar", secondaryChartType: "line" }
    ]);

    const tabs = ["Acceptances", "Enrollments", "Enroll Capacity", "Completed Application"];

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
        setCharts(charts.map(chart => {
            const updated = { ...chart, chartType: newType };
            if (newType !== "line") updated.gradeSelection = "";
            if (newType === "line") updated.yearSelection = "";
            return updated;
        }));
    };

    const handleGlobalSecondaryChartTypeChange = (newType: string) => {
        setGlobalSecondaryChartType(newType);
        setCharts(charts.map(chart => ({ ...chart, secondaryChartType: newType })));
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
        if (charts.length === 2) return "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 w-full gap-4";
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
                <div className="flex justify-between items-center bg-gray-100 p-4 rounded mb-6 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <label className="font-bold text-gray-700">Apply to All (Chart Type):</label>
                        <select
                            className="border p-2 rounded outline-none"
                            value={globalChartType}
                            onChange={(e) => handleGlobalChartTypeChange(e.target.value)}
                        >
                            <option value="bar">Bar</option>
                            <option value="line">Line</option>
                            <option value="pie">Pie</option>
                            <option value="doughnut">Doughnut</option>
                        </select>

                        {(globalChartType === "bar" || globalChartType === "line") && (
                            <>
                                <label className="font-bold text-gray-700 ml-4">Apply to All (Dual-Axis):</label>
                                <select
                                    className="border p-2 rounded outline-none"
                                    value={globalSecondaryChartType}
                                    onChange={(e) => handleGlobalSecondaryChartTypeChange(e.target.value)}
                                >
                                    <option value="line">Line</option>
                                    <option value="bar">Bar</option>
                                </select>
                            </>
                        )}
                    </div>

                    <Button
                        onClick={addChart}
                        buttonText={`Add Chart (${charts.length}/4)`}
                        disabled={charts.length >= 4}
                    />
                </div>

                <div className={getGridLayout()}>
                    {charts.map((chart) => (
                        <AdmissionGraphs
                            key={chart.id}
                            config={chart}
                            updateConfig={updateChart}
                            removeChart={() => removeChart(chart.id)}
                            label={activeTab}
                            availableTabs={tabs}
                            schools={schools}
                            years={years}
                            grades={grades}
                            showRemove={charts.length > 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}