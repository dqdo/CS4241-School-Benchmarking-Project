import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type AttritionKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
    navigateTo: (tabIndex: number) => void;
};

export default function AttritionKPIs({ selectedSchool, yearStartId, yearEndId, navigateTo }: AttritionKPIsProps) {
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

    // Tab index 4 = "Personnel" (teacher attrition lives there)
    const goToPersonnel = () => navigateTo(4);

    return (
        <KPITile label="Teacher Attrition"
                 value={fmt(teacherAttritionRate)}
                 accent="#B45309"
                 tooltip="Compares total staff in the two most recent years in your selected range. The drop from the earlier year to the later year, expressed as a percentage of the earlier year."
                 onClick={goToPersonnel} />
    );
}