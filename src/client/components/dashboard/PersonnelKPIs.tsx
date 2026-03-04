import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type PersonnelKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
};

export default function PersonnelKPIs({ selectedSchool, yearStartId, yearEndId }: PersonnelKPIsProps) {
    const [totalTeacherFTEs, setTotalTeacherFTEs] = useState<number | null>(null);
    const [totalFTEs, setTotalFTEs]               = useState<number | null>(null);

    useEffect(() => {
        if (!selectedSchool) return;
        setTotalTeacherFTEs(null); setTotalFTEs(null);
        const params = new URLSearchParams({
            school: selectedSchool,
            yearStart: String(yearStartId),
            yearEnd: String(yearEndId),
        }).toString();
        fetch("/totalTeacherFTEs?" + params).then(r => r.json()).then(d => setTotalTeacherFTEs(d.totalTeacherFTEs));
        fetch("/totalFTEs?"        + params).then(r => r.json()).then(d => setTotalFTEs(d.totalFTEs));
    }, [selectedSchool, yearStartId, yearEndId]);

    const fmt = (v: number | null) => v === null ? "—" : v.toFixed(1);

    return (
        <>
            <KPITile label="Teacher FTEs"
                     value={fmt(totalTeacherFTEs)}
                     accent="#1A6B3C" />
            <KPITile label="Total FTEs"
                     value={fmt(totalFTEs)}
                     accent="#1A6B3C" />
        </>
    );
}