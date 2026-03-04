import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type EmployeeRatioKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
};

export default function EmployeeRatioKPIs({ selectedSchool, yearStartId, yearEndId }: EmployeeRatioKPIsProps) {
    const [studentsPerTeacher, setStudentsPerTeacher] = useState<number | null>(null);
    const [teacherFTEPer1000,  setTeacherFTEPer1000]  = useState<number | null>(null);
    const [adminsPer1000,      setAdminsPer1000]       = useState<number | null>(null);
    const [employeesPer1000,   setEmployeesPer1000]    = useState<number | null>(null);

    useEffect(() => {
        if (!selectedSchool) return;
        setStudentsPerTeacher(null); setTeacherFTEPer1000(null);
        setAdminsPer1000(null); setEmployeesPer1000(null);
        const params = new URLSearchParams({
            school: selectedSchool,
            yearStart: String(yearStartId),
            yearEnd: String(yearEndId),
        }).toString();
        fetch("/studentsPerTeacher?" + params).then(r => r.json()).then(d => setStudentsPerTeacher(d.studentsPerTeacher));
        fetch("/teacherFTEPer1000?"  + params).then(r => r.json()).then(d => setTeacherFTEPer1000(d.teacherFTEPer1000));
        fetch("/adminsPer1000?"      + params).then(r => r.json()).then(d => setAdminsPer1000(d.adminsPer1000));
        fetch("/employeesPer1000?"   + params).then(r => r.json()).then(d => setEmployeesPer1000(d.employeesPer1000));
    }, [selectedSchool, yearStartId, yearEndId]);

    const fmt = (v: number | null) => v === null ? "—" : v.toFixed(1);

    return (
        <>
            <KPITile label="Students / Teacher"
                     value={fmt(studentsPerTeacher)}
                     accent="#7C3AED" />
            <KPITile label="Teacher FTE / 1k Students"
                     value={fmt(teacherFTEPer1000)}
                     accent="#7C3AED" />
            <KPITile label="Admins / 1k Students"
                     value={fmt(adminsPer1000)}
                     accent="#7C3AED" />
            <KPITile label="Employees / 1k Students"
                     value={fmt(employeesPer1000)}
                     accent="#7C3AED" />
        </>
    );
}