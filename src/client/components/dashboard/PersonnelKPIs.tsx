import { useEffect, useState } from "react";

type PersonnelKPIsProps = {
    selectedSchool: string;
}

export default function PersonnelKPIs(props: PersonnelKPIsProps) {
    const [totalTeacherFTEs, setTotalTeacherFTEs] = useState(0);
    const [totalFTEs, setTotalFTEs] = useState(0);

    useEffect(() => {
        if (!props.selectedSchool) return;

        const params = { school: props.selectedSchool };
        const queryString = new URLSearchParams(params).toString();

        fetch("/totalTeacherFTEs?" + queryString).then(res => res.json()).then(d => setTotalTeacherFTEs(d.totalTeacherFTEs));
        fetch("/totalFTEs?" + queryString).then(res => res.json()).then(d => setTotalFTEs(d.totalFTEs));
    }, [props.selectedSchool]);

    return (
        <div className="flex flex-wrap justify-center gap-6 p-4">
            <div className="cursor-default flex flex-col items-center justify-center bg-[#0693E3] text-white rounded-2xl shadow-2xl w-48 h-48 hover:scale-105 transition-transform duration-300">
                <h1 className="text-xl font-semibold mb-2">Total Teacher FTEs</h1>
                <h2 className="text-3xl font-bold">{totalTeacherFTEs.toFixed(2)}</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0693E3] text-white rounded-2xl shadow-2xl w-48 h-48 hover:scale-105 transition-transform duration-300">
                <h1 className="text-xl font-semibold mb-2">Total FTEs</h1>
                <h2 className="text-3xl font-bold">{totalFTEs.toFixed(2)}</h2>
            </div>
        </div>
    );
}
