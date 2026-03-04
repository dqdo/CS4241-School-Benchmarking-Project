import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type AttritionKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
};

export default function AttritionKPIs({ selectedSchool, yearStartId, yearEndId }: AttritionKPIsProps) {
    const [teacherAttritionRate, setTeacherAttritionRate] = useState<number | null>(null);

    useEffect(() => {
        if (!selectedSchool) return;
        setTeacherAttritionRate(null);
        const params = new URLSearchParams({
            school: selectedSchool,
            yearStart: String(yearStartId),
            yearEnd: String(yearEndId),
        }).toString();
        fetch("/teacherAttrition?" + params).then(r => r.json()).then(d => setTeacherAttritionRate(d.teacherAttritionRate));
    }, [selectedSchool, yearStartId, yearEndId]);

    const fmt = (v: number | null) => v === null ? "—" : `${v.toFixed(1)}%`;

    return (
        <KPITile label="Teacher Attrition"
                 value={fmt(teacherAttritionRate)}
                 accent="#B45309" />
    );
}