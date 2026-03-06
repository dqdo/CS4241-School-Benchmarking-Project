import ChartPage from "../ChartElements/ChartPage";
import {GraphData} from "../../elements/Graph";
import {fetchParams} from "../ChartElements/GenericGraph";

export default function AdmissionsChart() {

    async function fetchAdmissions(fieldLabel: string, isPrimary: boolean = false, params: fetchParams) {
        if (!params.school) return [];
        if (!params.year && !params.grade) return [];
        if(!isPrimary) {
            params.field = fieldLabel.toUpperCase();
        }
        const queryString = new URLSearchParams(params as any).toString();
        const response = await fetch(`/admissions?${queryString}`);
        const data = await response.json();
        if (params.grade) {
            return data.map((row: any): GraphData => ({ x: row.YEAR, y: row.DATA }));
        }

        return data.map((row: any): GraphData => ({ x: row.DESCRIPTION, y: row.DATA }));
    }

    async function fetchStats(params: fetchParams) {
        if (!params.school) return {average: 0, median: 0, range: {min: 0, max: 0}};
        if (!params.year && !params.grade) return {average: 0, median: 0, range: {min: 0, max: 0}};
        const queryString = new URLSearchParams(params as any).toString();
        const statsResponse = await fetch(`/admissionsStats?${queryString}`);
        const statData = await statsResponse.json();
        return statData;
    }

    return (
        <ChartPage gradeSelectorEnabled={true} yearSelectorEnabled={true} fetchData={fetchAdmissions} fetchStats={fetchStats} tabs={["Acceptances", "Enrollments", "Enroll Capacity", "Completed Application"]} defaultChartType={"bar"}></ChartPage>
    )

}