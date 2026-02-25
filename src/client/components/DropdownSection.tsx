interface DropdownSectionProps {
    schoolYears: any[];
    grades: any[];
    formData: { SCHOOL_YR_ID: string; GRADE_DEF_ID: string };
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function DropdownSection({ schoolYears, grades, formData, onChange }: DropdownSectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex flex-col">
                <label className="font-semibold text-sm mb-1 text-[#1E3869]">School Year</label>
                <select
                    name="SCHOOL_YR_ID"
                    value={formData.SCHOOL_YR_ID}
                    onChange={onChange}
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3] bg-white cursor-pointer"
                    required
                >
                    <option value="" disabled>Select a school year...</option>
                    {schoolYears.map((year) => (
                        <option key={year.ID} value={year.ID}>{year.SCHOOL_YEAR}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col">
                <label className="font-semibold text-sm mb-1 text-[#1E3869]">Grade Level</label>
                <select
                    name="GRADE_DEF_ID"
                    value={formData.GRADE_DEF_ID}
                    onChange={onChange}
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3] bg-white cursor-pointer"
                    required
                >
                    <option value="" disabled>Select a grade...</option>
                    {grades.map((grade) => (
                        <option key={grade.ID} value={grade.ID}>{grade.NAME_TX}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}