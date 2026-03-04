import { useState, useEffect } from 'react';
import { Tooltip } from 'flowbite-react';
import { useSchoolDataForm } from '../hooks/useSchoolDataForm';
import { DropdownSection } from './DropdownSection';
import ValidatedNumberInput from "./ValidatedNumberInput";

const ENROLLMENT_FIELDS = [
    { name: 'STUDENTS_ADDED_DURING_YEAR', label: 'Students Added During Year', tooltip: 'The number of students added to the school this year.', required: false },
    { name: 'STUDENTS_GRADUATED', label: 'Students Graduated', tooltip: 'The number of students that graduated this year.', required: false },
    { name: 'STUD_DISS_WTHD', label: 'Students Dismissed/Withdrawn', tooltip: 'The number of students that were dismissed or withdrew this year.', required: false },
    { name: 'STUD_NOT_RETURN', label: 'Students Who Chose Not to Return', tooltip: 'The number of students that chose not to return to school this year.', required: false },
    { name: 'STUD_NOT_INV', label: 'Students Not Invited to Return', tooltip: 'The number of students that were not invited to return this year.', required: false },
    { name: 'EXCH_STUD_REPS', label: 'Exchange Students', tooltip: 'The number of exchange students at the school this year.', required: false }
] as const;

const ENROLLMENT_FIELDS_SOC = [
    { name: 'STUDENTS_ADDED_DURING_YEAR_SOC', label: 'Students Added (SOC)', tooltip: 'The number of students of color added to the school this year.', required: false },
    { name: 'STUDENTS_GRADUATED_SOC', label: 'Students Graduated (SOC)', tooltip: 'The number of students of color that graduated this year.', required: false },
    { name: 'STUD_DISS_WTHD_SOC', label: 'Students Dismissed/Withdrawn (SOC)', tooltip: 'The number of students of color that were dismissed or withdrew this year.', required: false },
    { name: 'STUD_NOT_RETURN_SOC', label: 'Students Who Chose Not to Return (SOC)', tooltip: 'The number of students of color that chose not to return to school this year.', required: false },
    { name: 'STUD_NOT_INV_SOC', label: 'Students Not Invited to Return (SOC)', tooltip: 'The number of students of color that were not invited to return this year.', required: false },
    { name: 'EXCH_STUD_REPS_SOC', label: 'Exchange Students (SOC)', tooltip: 'The number of exchange students of color at the school this year.', required: false }
] as const;

const ALL_FIELDS = [...ENROLLMENT_FIELDS, ...ENROLLMENT_FIELDS_SOC];

const INITIAL_FORM_STATE = {
    SCHOOL_YR_ID: "",
    GRADE_DEF_ID: "",
    ...Object.fromEntries(ALL_FIELDS.map(field => [field.name, ""]))
};

export default function EnrollmentForm({ schoolId }: { schoolId: string }) {
    const { schoolYears, grades, loading, submitStatus, fetchGrades, fetchAutofillData, submitForm, saveDraft, loadDraft, resetSubmitStatus } = useSchoolDataForm({
        endpoint: '/api/submit-enrollment',
        dataEndpoint: '/api/enrollment-data',
        schoolId
    });

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    useEffect(() => {
        fetchGrades(formData.SCHOOL_YR_ID);
    }, [formData.SCHOOL_YR_ID]);

    useEffect(() => {
        if (formData.SCHOOL_YR_ID && formData.GRADE_DEF_ID) {
            fetchAutofillData(formData.SCHOOL_YR_ID, formData.GRADE_DEF_ID).then(data => {
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        ...Object.fromEntries(
                            ALL_FIELDS.map(field => [field.name, data[field.name] ?? ""])
                        )
                    }));
                }
            });
        }
    }, [formData.SCHOOL_YR_ID, formData.GRADE_DEF_ID, schoolId]);

    useEffect(() => {
        if (submitStatus === 'success') {
            const timer = setTimeout(() => resetSubmitStatus(), 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus, resetSubmitStatus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === "SCHOOL_YR_ID" && { GRADE_DEF_ID: "" })
        }));
    };

    const hasValidationErrors = () => {
        for (const field of ALL_FIELDS) {
            const value = formData[field.name as keyof typeof formData];
            if (!value || value === "") continue;
            if (/[^0-9]/.test(value)) return true;
        }
        return false;
    };

    const handleSaveDraft = async () => {
        if (!formData.SCHOOL_YR_ID || !formData.GRADE_DEF_ID) {
            alert("Please select a Year and Grade to save a draft.");
            return;
        }
        const result = await saveDraft("Enrollment", formData);
        if (result.success) alert("Draft saved successfully!");
    };

    const handleLoadDraft = async () => {
        if (!formData.SCHOOL_YR_ID || !formData.GRADE_DEF_ID) {
            alert("Please select a Year and Grade to load its draft.");
            return;
        }
        const data = await loadDraft("Enrollment", formData.SCHOOL_YR_ID, formData.GRADE_DEF_ID);
        if (data) {
            setFormData(prev => ({ ...prev, ...data }));
            alert("Draft loaded!");
        } else {
            alert("No draft found for this year and grade.");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (hasValidationErrors()) return;

        const result = await submitForm(formData);
        if (result.success) setFormData(INITIAL_FORM_STATE);
    };

    const ADDITIONS_GRADUATIONS_FIELDS = [ENROLLMENT_FIELDS[0], ENROLLMENT_FIELDS[1], ENROLLMENT_FIELDS[5]];
    const ADDITIONS_GRADUATIONS_SOC = [ENROLLMENT_FIELDS_SOC[0], ENROLLMENT_FIELDS_SOC[1], ENROLLMENT_FIELDS_SOC[5]];

    const ATTRITION_FIELDS = [ENROLLMENT_FIELDS[2], ENROLLMENT_FIELDS[3], ENROLLMENT_FIELDS[4]];
    const ATTRITION_SOC = [ENROLLMENT_FIELDS_SOC[2], ENROLLMENT_FIELDS_SOC[3], ENROLLMENT_FIELDS_SOC[4]];

    const FORM_SECTIONS = [
        {
            title: "Additions & Graduations",
            description: "Students entering mid-year, graduating, or participating in exchange programs.",
            fields: ADDITIONS_GRADUATIONS_FIELDS,
            socFields: ADDITIONS_GRADUATIONS_SOC
        },
        {
            title: "Attrition",
            description: "Students leaving the school prior to graduation.",
            fields: ATTRITION_FIELDS,
            socFields: ATTRITION_SOC
        }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Enrollment & Attrition</h2>
            <p className="text-gray-600 text-sm">Track student retention, graduations, and departures.</p>

            {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center gap-2">
                    <span>Data saved successfully!</span>
                </div>
            )}

            {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
                    <span>Error saving data. Please try again.</span>
                </div>
            )}

            <DropdownSection
                schoolYears={schoolYears}
                grades={grades}
                formData={formData}
                onChange={handleChange}
            />

            {FORM_SECTIONS.map((section, sectionIndex) => (
                <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="space-y-4 pt-4">
                        <div className="px-4">
                            <h3 className="text-lg font-semibold text-[#1E3869]">{section.title}</h3>
                            <p className="text-sm text-gray-500">{section.description}</p>
                        </div>

                        <div className="hidden md:grid grid-cols-12 gap-6 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="col-span-4">Metric</div>
                            <div className="col-span-4">Non-Students of Color (SOC)</div>
                            <div className="col-span-4">Students of Color (SOC)</div>
                        </div>

                        <div className="bg-white rounded-lg border-t border-gray-200 overflow-hidden">
                            {section.fields.map((field, index) => {
                                const socField = section.socFields[index];
                                return (
                                    <div key={field.name} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-gray-50/50 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center">
                                        <div className="col-span-1 md:col-span-4 flex items-center gap-2">
                                            <label className="text-sm font-semibold text-gray-800">{field.label}</label>
                                            <Tooltip content={field.tooltip} placement="top" style="light" arrow={false}>
                                                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round" />
                                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </Tooltip>
                                        </div>

                                        <div className="col-span-1 md:col-span-4">
                                            <ValidatedNumberInput
                                                label="Non-SOC"
                                                name={field.name}
                                                value={formData[field.name as keyof typeof formData]}
                                                onChange={handleChange}
                                                required={field.required}
                                            />
                                        </div>

                                        <div className="col-span-1 md:col-span-4">
                                            <ValidatedNumberInput
                                                label="SOC"
                                                name={socField.name}
                                                value={formData[socField.name as keyof typeof formData]}
                                                onChange={handleChange}
                                                required={socField.required}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-end pt-6 gap-3">
                <button
                    type="button"
                    onClick={handleLoadDraft}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded font-semibold hover:bg-gray-300 transition-colors shadow-sm"
                >
                    Load Draft
                </button>
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="bg-white border-2 border-[#0693E3] text-[#0693E3] px-6 py-3 rounded font-semibold hover:bg-blue-50 transition-colors shadow-sm"
                >
                    Save Draft
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0693E3] text-white px-8 py-3 rounded font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {loading ? 'Saving...' : 'Save Enrollment Data'}
                </button>
            </div>
        </form>
    );
}