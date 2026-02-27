import {useEffect, useState} from "react";

type EnrollmentKPIsProps = {
    selectedSchool: string;
}
export default function EnrollmentKPIs(props: EnrollmentKPIsProps) {
    const [acceptanceRate, setAcceptanceRate] = useState(0);
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
        fetch("/acceptanceRate?" + queryString).then((res) => res.json()).then(d=> setAcceptanceRate(d.acceptanceRate));
        fetch("/yield?" + queryString).then((res) => res.json()).then(d=> setYield(d._yield));
        fetch("/attrition?" + queryString).then((res) => res.json()).then(d=> setAttrition(d.attritionRate));
    }, [props.selectedSchool]);

    return (
        <div className="flex flex-wrap justify-center gap-6 p-4">
            <div className="cursor-default flex flex-col items-center justify-center bg-[#0693E3] text-white rounded-2xl shadow-2xl w-48 h-48 hover:scale-105 transition-transform duration-300">
                <h1 className="text-xl font-semibold mb-2">Acceptance Rate</h1>
                <h2 className="text-3xl font-bold">{acceptanceRate.toFixed(2)}%</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0693E3] text-white rounded-2xl shadow-2xl w-48 h-48 hover:scale-105 transition-transform duration-300">
                <h1 className="text-xl font-semibold mb-2">Yield</h1>
                <h2 className="text-3xl font-bold">{_yield.toFixed(2)}%</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0693E3] text-white rounded-2xl shadow-2xl w-48 h-48 hover:scale-105 transition-transform duration-300">
                <h1 className="text-xl font-semibold mb-2">Attrition</h1>
                <h2 className="text-3xl font-bold">{attrition.toFixed(2)}%</h2>
            </div>
        </div>
    )
}