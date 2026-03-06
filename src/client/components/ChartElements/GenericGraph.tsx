import {useEffect, useState} from "react";
import Graph, {GraphData} from "../../elements/Graph";

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

export type GenericGraphProps = {
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
    fetchData: (label:string, isPrimary: boolean, params: fetchParams) => Promise<GraphData[]>;
    fetchStats: (params: fetchParams) => Promise<Stats>;
    yearSelectorEnabled: boolean;
    gradeSelectorEnabled: boolean;
};

export type fetchParams = {
    school: string,
    year: string,
    grade: string,
    field: string
}

export type Stats = {
    average: number;
    median: number;
    range: { min: number; max: number };
};

export default function GenericGraph(props: GenericGraphProps) {
    const [graphData, setGraphData] = useState<GraphData[]>([]);
    const [secondaryGraphData, setSecondaryGraphData] = useState<GraphData[]>([]);
    const [stats, setStats] = useState<Stats>({average: 0, median: 0, range: {min: 0, max: 0}});

    useEffect(() => {
        let isMounted = true;

        const params: fetchParams = {
            school: props.config.schoolSelection,
            year: props.config.yearSelection,
            grade: props.config.gradeSelection,
            field: props.label.toUpperCase()
        };

        const loadData = async () => {
            const primaryData = await props.fetchData(props.label, true, params);
            const stats = await props.fetchStats(params);
            if (isMounted) {
                setGraphData(primaryData);
                setStats(stats);
            }

            if (props.config.secondaryLabel) {
                const secondaryData = await props.fetchData(props.config.secondaryLabel, false, params);
                if (isMounted) setSecondaryGraphData(secondaryData);
            } else {
                if (isMounted) setSecondaryGraphData([]);
            }
        };

        loadData();

        return () => { isMounted = false };
    }, [props.config.schoolSelection, props.config.yearSelection, props.config.gradeSelection, props.config.secondaryLabel, props.label]);



    useEffect(() => {
        props.updateConfig({...props.config, gradeSelection: "", yearSelection: ""})
    }, [props.config.chartType]);

    const handleChartTypeChange = (newType: string) => {
        props.updateConfig({ ...props.config, chartType: newType });
    };

    const isDualAxisCompatible = props.config.chartType === "line" || props.config.chartType === "bar";

    return (
        <div className="border-2 border-[#0A3E6C] p-4 flex flex-col h-full rounded-b-lg rounded-tr-lg bg-white shadow-sm">
            {props.showRemove && props.chartNumber !== undefined && (
                <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0A3E6C] text-white text-xs font-bold">
                        {props.chartNumber}
                    </span>
                </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded justify-center items-center">
                <select
                    className="border p-1 text-sm rounded outline-none font-semibold text-[#0A3E6C]"
                    value={props.config.chartType}
                    onChange={(e) => handleChartTypeChange(e.target.value)}
                >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="doughnut">Doughnut</option>
                </select>

                <select
                    className="border p-1 text-sm rounded outline-none"
                    value={props.config.schoolSelection}
                    onChange={e => props.updateConfig({ ...props.config, schoolSelection: e.target.value })}
                >
                    <option value="">Select School</option>
                    {props.schools.map(s => <option key={s.ID} value={s.ID}>{s.NAME_TX}</option>)}
                </select>

                {(props.config.chartType !== "line" && props.yearSelectorEnabled)&& (
                    <select
                        className="border p-1 text-sm rounded outline-none"
                        value={props.config.yearSelection}
                        onChange={e => props.updateConfig({ ...props.config, yearSelection: e.target.value })}
                    >
                        <option value="">Select Year</option>
                        {props.years.map(y => <option key={y.ID} value={y.ID}>{y.SCHOOL_YEAR}</option>)}
                    </select>
                )}

                {(props.config.chartType === "line" && props.gradeSelectorEnabled) && (
                    <select
                        className="border p-1 text-sm rounded outline-none"
                        value={props.config.gradeSelection}
                        onChange={e => props.updateConfig({ ...props.config, gradeSelection: e.target.value })}
                    >
                        <option value="">Select Grade</option>
                        {props.grades.map(g => <option key={g.ID} value={g.ID}>{g.DESCRIPTION_TX}</option>)}
                    </select>
                )}

                {isDualAxisCompatible && (
                    <>
                        <select
                            className="border p-1 text-sm rounded outline-none bg-orange-50 text-orange-800 border-orange-200"
                            value={props.config.secondaryLabel}
                            onChange={e => props.updateConfig({ ...props.config, secondaryLabel: e.target.value })}
                        >
                            <option value="">+ Dual Axis (None)</option>
                            {props.availableTabs.filter(tab => tab !== props.label).map(tab => (
                                <option key={tab} value={tab}>{tab}</option>
                            ))}
                        </select>

                        {props.config.secondaryLabel && (
                            <div className="flex rounded-lg border border-orange-200 overflow-hidden">
                                {["line", "bar"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => props.updateConfig({ ...props.config, secondaryChartType: type })}
                                        className={`px-2.5 py-1 text-xs font-semibold transition-colors border-r border-orange-200 last:border-r-0 ${
                                            props.config.secondaryChartType === type
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
                    onClick={props.clearChart}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                    Clear
                </button>

                {props.showRemove && (
                    <button onClick={props.removeChart} className="ml-auto text-red-600 text-sm font-bold hover:text-red-800 px-2">
                        Remove
                    </button>
                )}
            </div>

            <div className="flex-grow flex gap-4">
                {/* Graph */}
                <div className="flex-grow flex items-center justify-center min-w-0">
                    <div className="w-full">
                        <Graph
                            label={props.label}
                            secondaryLabel={props.config.secondaryLabel}
                            chartType={props.config.chartType as any}
                            secondaryChartType={props.config.secondaryChartType as any}
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
                            { label: "Avg",    value: stats.average },
                            { label: "Median", value: stats.median },
                            { label: "Min",    value: stats.range.min ? stats.range.min : 0 },
                            { label: "Max",    value: stats.range.max ? stats.range.max : 0},
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
    )

}