import { Grade, School, Year } from "../components/admissions/Admissions";

type SchoolSelectorProps = {
    userSchool: School;
    schools: School[];
    years: Year[];
    grades: Grade[];
    schoolSelection?: string;
    setSchoolSelection?: (option: string) => void;
    yearSelection?: string;
    setYearSelection?: (option: string) => void;
    chartType?: string;
    setChartType?: (option: string) => void;
    gradeSelection?: string;
    setGradeSelection?: (option: string) => void;
};

function SelectorWrapper({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2">
            <label className="font-semibold text-sm text-[#1E3869] whitespace-nowrap">{label}:</label>
            {children}
        </div>
    );
}

const selectClass = "border border-gray-300 rounded p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693E3]";

export default function SchoolSelector(props: SchoolSelectorProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded shadow-sm border border-gray-200">
            {/* School */}
            {props.userSchool.NAME_TX === "Admin" && props.schoolSelection !== undefined && props.setSchoolSelection ? (
                <SelectorWrapper label="Select School">
                    <select
                        className={selectClass}
                        value={props.schoolSelection}
                        onChange={e => props.setSchoolSelection!(e.target.value)}
                    >
                        <option value="">Select School</option>
                        {props.schools.map(s => (
                            <option key={s.ID} value={s.ID}>{s.NAME_TX}</option>
                        ))}
                    </select>
                </SelectorWrapper>
            ) : (
                <SelectorWrapper label="School">
                    <span className="text-sm font-medium text-[#1E3869]">{props.userSchool.NAME_TX}</span>
                </SelectorWrapper>
            )}

            {/* Year (non-line charts) */}
            {props.chartType !== "line" && props.yearSelection !== undefined && props.setYearSelection && (
                <SelectorWrapper label="Select Year">
                    <select
                        className={selectClass}
                        value={props.yearSelection}
                        onChange={e => props.setYearSelection!(e.target.value)}
                    >
                        <option value="">Select Year</option>
                        {props.years.map(y => (
                            <option key={y.ID} value={y.ID}>{y.SCHOOL_YEAR}</option>
                        ))}
                    </select>
                </SelectorWrapper>
            )}

            {/* Grade (line charts) */}
            {props.chartType === "line" && props.gradeSelection !== undefined && props.setGradeSelection && (
                <SelectorWrapper label="Select Grade">
                    <select
                        className={selectClass}
                        value={props.gradeSelection}
                        onChange={e => props.setGradeSelection!(e.target.value)}
                    >
                        <option value="">Select Grade</option>
                        {props.grades.map(g => (
                            <option key={g.ID} value={g.ID}>{g.DESCRIPTION_TX}</option>
                        ))}
                    </select>
                </SelectorWrapper>
            )}

            {/* Chart type */}
            {props.chartType !== undefined && props.setChartType && (
                <SelectorWrapper label="Chart Type">
                    <select
                        className={selectClass}
                        value={props.chartType}
                        onChange={e => props.setChartType!(e.target.value)}
                    >
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="pie">Pie</option>
                        <option value="doughnut">Doughnut</option>
                    </select>
                </SelectorWrapper>
            )}
        </div>
    );
}