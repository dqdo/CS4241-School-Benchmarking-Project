import {useEffect, useState} from "react";

type EnrollmentKPIsProps = {
    selectedSchool: string;
    selectedYear: string;
}
export default function EnrollmentKPIs(props: EnrollmentKPIsProps) {
    const [acceptanceRate, setAcceptanceRate] = useState(0);
    const [averageAcceptanceRate, setAverageAcceptanceRate] = useState(0);
    const [_yield, setYield] = useState(0);
    const [attrition, setAttrition] = useState(0);
    useEffect(() => {
        if(!props.selectedSchool){
            return;
        }
        const params = {
            school: props.selectedSchool,
        };
        const queryString = new URLSearchParams(params).toString();

        fetch("/yield?" + queryString).then((res) => res.json()).then(d=> setYield(d._yield));
        fetch("/attrition?" + queryString).then((res) => res.json()).then(d=> setAttrition(d.attritionRate));
    }, [props.selectedSchool]);

    useEffect(() => {
        fetch("/acceptanceRateAllTime?year="+props.selectedYear).then((res) => res.json()).then(d=> setAverageAcceptanceRate(d.acceptanceRate));
    }, [props.selectedYear]);

    useEffect(() => {
        fetch("/acceptanceRateAllTime").then((res) => res.json()).then(d=> setAcceptanceRate(d.acceptanceRate));
    }, []);

    return (
        <div className="flex flex-wrap justify-center gap-6 p-4">
            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl text-center font-semibold mb-2">Average Acceptance Rate All Time</h1>
                <h2 className="text-3xl font-bold">{acceptanceRate.toFixed(2)}%</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl text-center font-semibold mb-2">Average Acceptance Rate (Selected Year)</h1>
                <h2 className="text-3xl font-bold">{averageAcceptanceRate.toFixed(2)}%</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl text-center font-semibold mb-2">Overall Yield</h1>
                <h2 className="text-3xl font-bold">{_yield.toFixed(2)}%</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl text-center font-semibold mb-2">Overall Attrition</h1>
                <h2 className="text-3xl font-bold">{attrition.toFixed(2)}%</h2>
            </div>
        </div>
    )
}