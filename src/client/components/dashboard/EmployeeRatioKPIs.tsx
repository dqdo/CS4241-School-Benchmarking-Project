import { useEffect, useState } from "react";

type EmployeeRatioKPIsProps = {
    selectedSchool: string;
}

export default function EmployeeRatioKPIs(props: EmployeeRatioKPIsProps) {
    const [studentsPerTeacher, setStudentsPerTeacher] = useState(0);
    const [teacherFTEPer1000, setTeacherFTEPer1000] = useState(0);
    const [adminsPer1000, setAdminsPer1000] = useState(0);
    const [employeesPer1000, setEmployeesPer1000] = useState(0);

    useEffect(() => {
        if (!props.selectedSchool) return;

        const params = { school: props.selectedSchool };
        const queryString = new URLSearchParams(params).toString();

        fetch("/studentsPerTeacher?" + queryString).then(res => res.json()).then(d => setStudentsPerTeacher(d.studentsPerTeacher));
        fetch("/teacherFTEPer1000?" + queryString).then(res => res.json()).then(d => setTeacherFTEPer1000(d.teacherFTEPer1000));
        fetch("/adminsPer1000?" + queryString).then(res => res.json()).then(d => setAdminsPer1000(d.adminsPer1000));
        fetch("/employeesPer1000?" + queryString).then(res => res.json()).then(d => setEmployeesPer1000(d.employeesPer1000));
    }, [props.selectedSchool]);

    return (
        <div className="flex flex-wrap justify-center gap-6 p-4">
            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl font-semibold mb-2">Students / Teacher</h1>
                <h2 className="text-3xl font-bold">{studentsPerTeacher.toFixed(2)}</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl font-semibold mb-2">Teacher FTE / 1000 Students</h1>
                <h2 className="text-3xl font-bold">{teacherFTEPer1000.toFixed(2)}</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl font-semibold mb-2">Admins per 1000 Students</h1>
                <h2 className="text-3xl font-bold">{adminsPer1000.toFixed(2)}</h2>
            </div>

            <div className="cursor-default flex flex-col items-center justify-center bg-[#0A3E6C] text-white rounded-2xl shadow-2xl w-48 h-48 hover:bg-[#0066CC] hover:scale-105 transition-all duration-300">
                <h1 className="text-xl font-semibold mb-2">Employees per 1000 Students</h1>
                <h2 className="text-3xl font-bold">{employeesPer1000.toFixed(2)}</h2>
            </div>
        </div>
    );
}
