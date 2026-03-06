import ChartPage from "../ChartElements/ChartPage";
import {GraphData} from "../../elements/Graph";
import {fetchParams} from "../ChartElements/GenericGraph";
import {useEffect, useState} from "react";

const TABS: { label: string; field: string }[] = [
    { label: "Students Added During Year",      field: "STUDENTS_ADDED_DURING_YEAR" },
    { label: "Students Graduated",              field: "STUDENTS_GRADUATED" },
    { label: "Students Dismissed/Withdrawn",    field: "STUD_DISS_WTHD" },
    { label: "Students Not Returning",          field: "STUD_NOT_RETURN" },
    { label: "Students Not Invited to Return",  field: "STUD_NOT_INV" },
    { label: "Exchange Students",               field: "EXCH_STUD_REPTS" },
];


export default function EnrollAttritionChart() {
    const [isSOC, setIsSOC] = useState<boolean>(false);
    async function fetchData(fieldLabel: string, isPrimary: boolean = false, params: fetchParams): Promise<GraphData[]> {
        if (!params.school|| !params.year) return [];
        const field = TABS.find(tab => tab.label.toUpperCase() === fieldLabel.toUpperCase())?.field || "";
        params.field = field;
        const realParams = { ...params, collection: isSOC ? "EnrollAttritionSOC" : "EnrollAttrition" }
        const queryString = new URLSearchParams(realParams).toString();
        const response = await fetch(`/enrollment-attrition?${queryString}`);
        const data = await response.json();

        return data.map((row: any): GraphData => ({ x: row.DESCRIPTION, y: row.VALUE }));
    }

    async function fetchStats(params: fetchParams) {
        if (!params.school) return {average: 0, median: 0, range: {min: 0, max: 0}};
        if (!params.year && !params.grade) return {average: 0, median: 0, range: {min: 0, max: 0}};
        const field = TABS.find(tab => tab.label.toUpperCase() === params.field.replaceAll("_", " "))?.field || "";
        params.field = field;
        const realParams = { ...params, collection: isSOC ? "EnrollAttritionSOC" : "EnrollAttrition" }
        const queryString = new URLSearchParams(realParams).toString();
        const statsResponse = await fetch(`/enroll-attrition-stats?${queryString}`);
        const statData = await statsResponse.json();
        return statData;
    }

    return (
        <ChartPage isSOC={isSOC} setIsSOC={setIsSOC} gradeSelectorEnabled={true} yearSelectorEnabled={true} fetchData={fetchData} fetchStats={fetchStats} tabs={["Students Added During Year", "Students Graduated", "Students Dismissed/Withdrawn", "Students Not Returning", "Students Not Invited to Return", "Exchange Students"]} defaultChartType={"bar"}></ChartPage>
    )

}