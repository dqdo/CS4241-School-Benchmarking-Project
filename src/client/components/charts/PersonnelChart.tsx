import ChartPage from "../ChartElements/ChartPage";
import {GraphData} from "../../elements/Graph";
import {fetchParams} from "../ChartElements/GenericGraph";

export default function PersonnelChart() {

    async function fetchPersonnel(fieldLabel: string, isPrimary: boolean = false, params: fetchParams) {
        if (!params.school) return [];

        if(!isPrimary) {
            params.field = fieldLabel.toUpperCase();
        }
        const queryString = new URLSearchParams(params as any).toString();

        if (params.field === "TEACHERS LOST" || params.field === "TEACHERS GAINED") {
            const response = await fetch(`/personnelAttrition?${queryString}`);
            const data = await response.json();

            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        } else {
            const response = await fetch(`/personnel?${queryString}`);
            const data = await response.json();

            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        }
    }

    async function fetchStats(params: fetchParams) {
        if (!params.school) return {average: 0, median: 0, range: {min: 0, max: 0}};
        const queryString = new URLSearchParams(params as any).toString();
        const fetchString = params.field == "TEACHERS LOST" || params.field === "TEACHERS GAINED" ? "/personnelAttritionStats" : "/personnelStats";
        const statsResponse = await fetch(`${fetchString}?${queryString}`);
        const statData = await statsResponse.json();
        return statData;
    }

    return (
        <ChartPage gradeSelectorEnabled={false} yearSelectorEnabled={false} fetchData={fetchPersonnel} fetchStats={fetchStats} tabs={["Total Teacher FTEs", "Total FTEs", "Teachers Lost", "Teachers Gained"]} defaultChartType={"line"}></ChartPage>
    )

}