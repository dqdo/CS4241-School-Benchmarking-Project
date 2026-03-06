import {useEffect, useState} from "react";
import {ChartConfig, Grade, School, Year} from "../admissions/Admissions";
import SubTabBar from "./SubTabBar";
import ChartGlobalSettings from "./ChartGlobalSettings";
import GenericGraph, {fetchParams, Stats} from "./GenericGraph";
import {GraphData} from "../../elements/Graph";

export const CHART_TYPES = [
    "bar",
    "line",
    "doughnut",
    "pie",
] as const;

export type ChartType = typeof CHART_TYPES[number];

type ChartProps = {
    tabs: string[];
    defaultChartType: ChartType;
    fetchData: (label:string, isPrimary: boolean, params: fetchParams) => Promise<GraphData[]>;
    fetchStats: (params: fetchParams) => Promise<Stats>;
    yearSelectorEnabled: boolean;
    gradeSelectorEnabled: boolean;
    isSOC?: boolean;
    setIsSOC?: (isSoc: boolean) => void;
}

export default function ChartPage(props: ChartProps) {

    const [schools, setSchools] = useState<School[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);

    const [activeTab, setActiveTab] = useState<string>(props.tabs[0]);
    const [globalChartType, setGlobalChartType] = useState<ChartType>(props.defaultChartType);
    const [globalSecondaryChartType, setGlobalSecondaryChartType] = useState<ChartType>("line");

    const [charts, setCharts] = useState<ChartConfig[]>([
        { id: Date.now(), schoolSelection: "", yearSelection: "", gradeSelection: "", secondaryLabel: "", chartType: props.defaultChartType, secondaryChartType: "line" }
    ]);

    function getSchoolData(){
        if (schools.length === 0) fetch("/schools").then(res => res.json()).then(data => setSchools(data.filter((s: School) => !Number(s.NAME_TX))));
        if (years.length === 0) fetch("/years").then(res => res.json()).then(data => setYears(data));
        if (grades.length === 0) fetch("/grades").then(res => res.json()).then(data => setGrades(data));
    }

    useEffect(() => {
        getSchoolData();
    }, []);

    useEffect(() => {
        setCharts(prev => prev.map(chart => (chart.secondaryLabel === activeTab ? { ...chart, secondaryLabel: "" } : chart)));
    }, [activeTab]);

    const updateChart = (updatedConfig: ChartConfig) => {
        setCharts(charts.map(c => c.id === updatedConfig.id ? updatedConfig : c));
    };

    const removeChart = (id: number) => {
        setCharts(charts.filter(c => c.id !== id));
    };

    const clearChart = (id: number) => {
        setCharts(charts.map(c => c.id === id
            ? { ...c, schoolSelection: "", yearSelection: "", gradeSelection: "", secondaryLabel: "" }
            : c
        ));
    };

    const getGridLayout = () => {
        if (charts.length === 1) return "grid grid-cols-1 w-full max-w-5xl mx-auto gap-6";
        if (charts.length === 2) return "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 w-full gap-4";
        return "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 w-full gap-4";
    };

    return (
        <div className={"flex flex-col min-h-screen gap-4 p-4"}>
            <SubTabBar isSOC={props.isSOC} setIsSOC={props.setIsSOC} tabs={props.tabs} activeTab={activeTab} setActiveTab={setActiveTab}></SubTabBar>
            <div className="flex-1 mt-2">
                <ChartGlobalSettings globalChartType={globalChartType} setGlobalChartType={setGlobalChartType} globalSecondaryChartType={globalSecondaryChartType} setGlobalSecondaryChartType={setGlobalSecondaryChartType} charts={charts} setCharts={setCharts} />
                <div className={getGridLayout()}>
                    {charts.map((chart) => (
                        <GenericGraph
                            key={chart.id}
                            config={chart}
                            updateConfig={updateChart}
                            removeChart={() => removeChart(chart.id)}
                            clearChart={() => clearChart(chart.id)}
                            label={activeTab}
                            availableTabs={props.tabs}
                            schools={schools}
                            years={years}
                            grades={grades}
                            showRemove={charts.length > 1}
                            fetchData={props.fetchData}
                            fetchStats={props.fetchStats}
                            yearSelectorEnabled={props.yearSelectorEnabled}
                            gradeSelectorEnabled={props.gradeSelectorEnabled}
                        />
                    ))}
                </div>
            </div>
        </div>
    )

}