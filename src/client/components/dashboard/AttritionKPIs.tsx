import { useEffect, useState } from "react";

type AttritionKPIsProps = {
    selectedSchool: string;
}

export default function AttritionKPIs(props: AttritionKPIsProps) {
    const [teacherAttritionRate, setTeacherAttritionRate] = useState(0);

    useEffect(() => {
        if (!props.selectedSchool) return;
        const params = { school: props.selectedSchool };
        const queryString = new URLSearchParams(params).toString();
        fetch("/teacherAttrition?" + queryString)
            .then(res => res.json())
            .then(d => setTeacherAttritionRate(d.teacherAttritionRate));
    }, [props.selectedSchool]);

    return (
        <div className="flex flex-wrap justify-center gap-6 p-4">
            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl font-semibold mb-2">Teacher Attrition</h1>
                <h2 className="text-3xl font-bold">{teacherAttritionRate.toFixed(2)}%</h2>
            </div>
        </div>
    );
}