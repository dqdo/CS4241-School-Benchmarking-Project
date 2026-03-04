import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type EnrollmentKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
};

export default function EnrollmentKPIs({ selectedSchool, yearStartId, yearEndId }: EnrollmentKPIsProps) {
    const [acceptanceRate, setAcceptanceRate] = useState<number | null>(null);
    const [_yield, setYield]                 = useState<number | null>(null);
    const [attrition, setAttrition]          = useState<number | null>(null);

    useEffect(() => {
        if (!selectedSchool) return;
        setAcceptanceRate(null); setYield(null); setAttrition(null);
        const params = new URLSearchParams({
            school: selectedSchool,
            yearStart: String(yearStartId),
            yearEnd: String(yearEndId),
        }).toString();
        fetch("/acceptanceRate?" + params).then(r => r.json()).then(d => setAcceptanceRate(d.acceptanceRate));
        fetch("/yield?"          + params).then(r => r.json()).then(d => setYield(d._yield));
        fetch("/attrition?"      + params).then(r => r.json()).then(d => setAttrition(d.attritionRate));
    }, [selectedSchool, yearStartId, yearEndId]);

    const fmt = (v: number | null, suffix = "%") =>
        v === null ? "—" : `${v.toFixed(1)}${suffix}`;

    return (
        <>
            <KPITile label="Acceptance Rate"
                     value={fmt(acceptanceRate)} accent="#0A3E6C" />
            <KPITile label="Yield Rate"
                     value={fmt(_yield)}
                     accent="#0A3E6C" />
            <KPITile label="Attrition Rate"
                     value={fmt(attrition)}
                     accent="#0A3E6C" />
        </>
    );
}