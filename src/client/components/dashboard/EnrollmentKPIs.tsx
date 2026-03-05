import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type EnrollmentKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
    navigateTo: (tabIndex: number) => void;
};

export default function EnrollmentKPIs({ selectedSchool, yearStartId, yearEndId, navigateTo }: EnrollmentKPIsProps) {
    const [acceptanceRate,        setAcceptanceRate]        = useState<number | null>(null);
    const [_yield,                setYield]                 = useState<number | null>(null);
    const [attrition,             setAttrition]             = useState<number | null>(null);
    const [acceptanceRateAllTime, setAcceptanceRateAllTime] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedSchool) return;
        setAcceptanceRate(null); setYield(null); setAttrition(null); setAcceptanceRateAllTime(null);

        const params = new URLSearchParams({
            school: selectedSchool,
            yearStart: String(yearStartId),
            yearEnd: String(yearEndId),
        }).toString();

        fetch("/acceptanceRate?" + params).then(r => r.json()).then(d => setAcceptanceRate(d.acceptanceRate));
        fetch("/yield?"          + params).then(r => r.json()).then(d => setYield(d._yield));
        fetch("/attrition?"      + params).then(r => r.json()).then(d => setAttrition(d.attritionRate));

        const allTimeParams = new URLSearchParams({ year: String(yearEndId) }).toString();
        fetch("/acceptanceRateAllTime?" + allTimeParams)
            .then(r => r.json())
            .then(d => setAcceptanceRateAllTime(d?.acceptanceRate ?? null));
    }, [selectedSchool, yearStartId, yearEndId]);

    const fmt = (v: number | null, suffix = "%") =>
        v === null ? "—" : `${v.toFixed(1)}${suffix}`;

    // Tab index 3 = "Enrollment & Attrition"
    const goToEnrollment = () => navigateTo(3);

    return (
        <>
            <KPITile label="Acceptance Rate"
                     value={fmt(acceptanceRate)}
                     accent="#0A3E6C"
                     variant="school"
                     tooltip="Total acceptances divided by total completed applications, expressed as a percentage. Summed across the selected year range."
                     onClick={goToEnrollment} />
            <KPITile label="Yield Rate"
                     value={fmt(_yield)}
                     accent="#0A3E6C"
                     variant="school"
                     tooltip="New enrollments divided by total acceptances. Shows how many accepted students followed through and enrolled."
                     onClick={goToEnrollment} />
            <KPITile label="Attrition Rate"
                     value={fmt(attrition)}
                     accent="#0A3E6C"
                     variant="school"
                     tooltip="Students who did not return divided by total new enrollments. Reflects how many students the school failed to retain."
                     onClick={goToEnrollment} />
            <KPITile label="Acceptance Rate"
                     value={fmt(acceptanceRateAllTime)}
                     variant="benchmark"
                     tooltip="Acceptance rate across all schools in the network for the end year selected. Use as a comparison benchmark against your school."
                     onClick={goToEnrollment} />
        </>
    );
}