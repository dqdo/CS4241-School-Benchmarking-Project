import Button from "../../elements/Button";
import {ChartType} from "./ChartPage";
import {ChartConfig} from "./GenericGraph";

type ChartGlobalSettingsProps = {
    globalChartType: ChartType;
    setGlobalChartType: (globalChartType: ChartType) => void;

    globalSecondaryChartType: string;
    setGlobalSecondaryChartType: (globalSecondaryChartType: ChartType) => void;

    charts: ChartConfig[];
    setCharts: (charts: ChartConfig[]) => void;

}

export default function ChartGlobalSettings(props: ChartGlobalSettingsProps) {

    const addChart = () => {
        if (props.charts.length < 4) {
            props.setCharts([...props.charts, {
                id: Date.now(),
                schoolSelection: "",
                yearSelection: "",
                gradeSelection: "",
                secondaryLabel: "",
                chartType: props.globalChartType,
                secondaryChartType: props.globalSecondaryChartType
            }]);
        }
    };


    const clearAllCharts = () => {
        props.setCharts([props.charts[0]]);
    };

    const handleGlobalChartTypeChange = (newType: ChartType) => {
        props.setGlobalChartType(newType);
        props.setCharts(props.charts.map(chart => {
            const updated = { ...chart, chartType: newType };
            if (newType !== "line") updated.gradeSelection = "";
            if (newType === "line") updated.yearSelection = "";
            return updated;
        }));
    };

    const handleGlobalSecondaryChartTypeChange = (newType: ChartType) => {
        props.setGlobalSecondaryChartType(newType);
        props.setCharts(props.charts.map(chart => ({ ...chart, secondaryChartType: newType })));
    };

    return (
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
                                    {props.charts.length}
                                </span>
                        <span>/ 4 charts</span>
                    </div>
                    <Button onClick={addChart} buttonText="Add Chart" disabled={props.charts.length >= 4} />
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
                                onClick={() => handleGlobalChartTypeChange(type as ChartType)}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                                    props.globalChartType === type
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
                {(props.globalChartType === "bar" || props.globalChartType === "line") && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Dual-Axis Layer:</span>
                        <div className="flex rounded-lg border border-orange-200 overflow-hidden">
                            {["line", "bar"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleGlobalSecondaryChartTypeChange(type as ChartType)}
                                    className={`px-3 py-1.5 text-sm font-medium transition-colors border-r border-orange-200 last:border-r-0 ${
                                        props.globalSecondaryChartType === type
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
    )
}