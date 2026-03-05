import { useEffect, useState } from "react";
import KPITile from "./KPITile";

type EmployeeRatioKPIsProps = {
    selectedSchool: string;
    yearStartId: number;
    yearEndId: number;
    navigateTo: (tabIndex: number) => void;
};

export default function EmployeeRatioKPIs({ selectedSchool, yearStartId, yearEndId, navigateTo }: EmployeeRatioKPIsProps) {
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

    // Students/Teacher and Teacher FTE ratios → Personnel (tab 4)
    // Admins/1k and Employees/1k involve enrollment context too → Personnel (tab 4)
    const goToPersonnel = () => navigateTo(4);

    return (
        <>
            <KPITile label="Students / Teacher"
                     value={fmt(studentsPerTeacher)}
                     accent="#7C3AED"
                     tooltip="Students enrolled during the year divided by total teacher full-time equivalents. Lower means more teaching capacity per student."
                     onClick={goToPersonnel} />
            <KPITile label="Teacher FTE / 1k Students"
                     value={fmt(teacherFTEPer1000)}
                     accent="#7C3AED"
                     tooltip="Total teacher full-time equivalents divided by students enrolled, scaled to 1,000 students. Shows teaching staffing density."
                     onClick={goToPersonnel} />
            <KPITile label="Admins / 1k Students"
                     value={fmt(adminsPer1000)}
                     accent="#7C3AED"
                     tooltip="Total administrative staff full-time equivalents (exempt and non-exempt) divided by students enrolled, scaled to 1,000 students."
                     onClick={goToPersonnel} />
            <KPITile label="Employees / 1k Students"
                     value={fmt(employeesPer1000)}
                     accent="#7C3AED"
                     tooltip="Total employee headcount divided by students enrolled, scaled to 1,000 students. Covers all staff categories."
                     onClick={goToPersonnel} />
        </>
    );
}