import { useEffect, useState } from "react";
import EnrollmentKPIs from "./dashboard/EnrollmentKPIs";
import PersonnelKPIs from "./dashboard/PersonnelKPIs";
import EmployeeRatioKPIs from "./dashboard/EmployeeRatioKPIs";
import AttritionKPIs from "./dashboard/AttritionKPIs";
import { School, Year } from "./admissions/Admissions";
import SchoolSelector from "../elements/SchoolSelector";
import YearRangeSlider from "../elements/YearRangeSlider";

type SectionProps = {
    label: string;
    color: string;
    children: React.ReactNode;
};

function KPISection({ label, color, children }: SectionProps) {
    return (
        <div className="contents">
            {/* Full-width category label spanning the grid */}
            <div className="col-span-full flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
                    {label}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
            </div>
            {children}
        </div>
    );
}

export default function Dashboard() {
    const [schools, setSchools]       = useState<School[]>([]);
    const [years, setYears]           = useState<Year[]>([]);
    const [userSchool, setUserSchool] = useState<School>({ ID: -1, NAME_TX: "NONE" });
    const [schoolSelection, setSchoolSelection] = useState<string>("");

    const [yearStart, setYearStart] = useState<Year | null>(null);
    const [yearEnd,   setYearEnd]   = useState<Year | null>(null);

    useEffect(() => {
        if (userSchool.ID !== -1 && userSchool.NAME_TX !== "Admin") {
            setSchoolSelection(String(userSchool.ID));
        }
    }, [userSchool]);

    useEffect(() => {
        if (schools.length === 0)
            fetch("/schools").then(r => r.json()).then(d =>
                setSchools(d.filter((s: School) => !Number(s.NAME_TX)))
            );
        if (years.length === 0)
            fetch("/years").then(r => r.json()).then((data: Year[]) => {
                setYears(data);
                const sorted = [...data].sort((a, b) => Number(b.SCHOOL_YEAR) - Number(a.SCHOOL_YEAR));
                if (sorted.length > 0) {
                    setYearStart(sorted[0]);
                    setYearEnd(sorted[0]);
                }
            });
        if (userSchool.ID === -1)
            fetch("/usersSchool").then(r => r.json()).then(d => setUserSchool(d));
    }, []);

    const ready = schoolSelection && yearStart && yearEnd;

    return (
        <div className="mt-4 px-4 pb-8">
            {/* School selector */}
            <div className="mb-4">
                <SchoolSelector
                    userSchool={userSchool}
                    schools={schools}
                    years={years}
                    schoolSelection={schoolSelection}
                    setSchoolSelection={setSchoolSelection}
                    yearSelection=""
                    setYearSelection={() => {}}
                    chartType="line"
                    grades={[]}
                    gradeSelection=""
                />
            </div>

            {/* Year range slider */}
            <div className="mb-5">
                <YearRangeSlider
                    years={years}
                    yearStart={yearStart}
                    yearEnd={yearEnd}
                    setYearStart={setYearStart}
                    setYearEnd={setYearEnd}
                />
            </div>

            {/* KPI Grid */}
            {ready ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

                    <KPISection label="Enrollment" color="#0A3E6C">
                        <EnrollmentKPIs
                            selectedSchool={schoolSelection}
                            yearStartId={yearStart.ID}
                            yearEndId={yearEnd.ID}
                        />
                    </KPISection>

                    <KPISection label="Personnel" color="#1A6B3C">
                        <PersonnelKPIs
                            selectedSchool={schoolSelection}
                            yearStartId={yearStart.ID}
                            yearEndId={yearEnd.ID}
                        />
                    </KPISection>

                    <KPISection label="Attrition" color="#B45309">
                        <AttritionKPIs
                            selectedSchool={schoolSelection}
                            yearStartId={yearStart.ID}
                            yearEndId={yearEnd.ID}
                        />
                    </KPISection>

                    <KPISection label="Employee Ratios" color="#7C3AED">
                        <EmployeeRatioKPIs
                            selectedSchool={schoolSelection}
                            yearStartId={yearStart.ID}
                            yearEndId={yearEnd.ID}
                        />
                    </KPISection>

                </div>
            ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-base">
                    {schoolSelection ? "Loading years…" : "Select a school to view KPIs"}
                </div>
            )}
        </div>
    );
}