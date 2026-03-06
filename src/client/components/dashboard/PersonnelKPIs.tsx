import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type PersonnelKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
    navigateTo: (tabIndex: number) => void;
};

export default function PersonnelKPIs({ selectedSchool, yearStartId, yearEndId, navigateTo }: PersonnelKPIsProps) {
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

    // Tab index 4 = "Personnel"
    const goToPersonnel = () => navigateTo(4);

    return (
        <>
            <KPITile label="Teacher FTEs"
                     value={fmt(totalTeacherFTEs)}
                     accent="#1A6B3C"
                     tooltip="Total full-time equivalent teaching staff at your school across the selected year range. Part-time teachers count as a fraction of 1.0."
                     onClick={goToPersonnel} />
            <KPITile label="Total FTEs"
                     value={fmt(totalFTEs)}
                     accent="#1A6B3C"
                     tooltip="Total headcount of all employees across the selected year range, covering every staff category."
                     onClick={goToPersonnel} />
        </>
    );
}