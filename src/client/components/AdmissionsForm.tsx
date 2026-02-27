import { useState, useEffect } from 'react';
import { Tooltip } from 'flowbite-react';
import { useSchoolDataForm } from '../hooks/useSchoolDataForm';
import { DropdownSection } from './DropdownSection';
import ValidatedNumberInput from "./ValidatedNumberInput";

const ADMISSIONS_FIELDS = [
    { name: 'CAPACITY_ENROLL', label: 'Total Enrollment Capacity', tooltip: 'The maximum number of students of your school can accommodate.', required: false },
    { name: 'COMPLETED_APPLICATION_TOTAL', label: 'Total Completed Applications', tooltip: 'The total number of fully completed submitted applications.', required: false },
    { name: 'NEW_ENROLLMENTS_TOTAL', label: 'Total New Enrollments', tooltip: 'The total number of newly enrolled students.', required: false },
    { name: 'ACCEPTANCES_TOTAL', label: 'Total Acceptances', tooltip: 'The total number of accepted students.', required: false },
    { name: 'CONTRACTED_ENROLL_BOYS', label: 'Contracted Enrollments (Boys)', tooltip: 'The number of boys that have signed a contract and paid a deposit.', required: false },
    { name: 'CONTRACTED_ENROLL_GIRLS', label: 'Contracted Enrollments (Girls)', tooltip: 'The number of girls that have signed a contract and paid a deposit.', required: false },
    { name: 'CONTRACTED_ENROLL_NB', label: 'Contracted Enrollments (Non-binary)', tooltip: 'The number of non-binary students that have signed a contract and paid a deposit.', required: false },
] as const;

const ADMISSIONS_FIELDS_SOC = [
    { name: 'CAPACITY_ENROLL_SOC', label: 'Total Enrollment Capacity (SOC)', tooltip: 'The maximum number of students of color your school can accommodate.', required: false },
    { name: 'COMPLETED_APPLICATION_TOTAL_SOC', label: 'Total Completed Applications (SOC)', tooltip: 'The total number of fully completed submitted applications from students of color.', required: false },
    { name: 'NEW_ENROLLMENTS_TOTAL_SOC', label: 'Total New Enrollments (SOC)', tooltip: 'The total number of newly enrolled students of color.', required: false },
    { name: 'ACCEPTANCES_TOTAL_SOC', label: 'Total Acceptances (SOC)', tooltip: 'The total number of accepted students of color.', required: false },
    { name: 'CONTRACTED_ENROLL_BOYS_SOC', label: 'Contracted Enrollments (Boys, SOC)', tooltip: 'The number of boys who are students of color that have signed a contract and paid a deposit.', required: false },
    { name: 'CONTRACTED_ENROLL_GIRLS_SOC', label: 'Contracted Enrollments (Girls, SOC)', tooltip: 'The number of girls who are students of color that have signed a contract and paid a deposit.', required: false },
    { name: 'CONTRACTED_ENROLL_NB_SOC', label: 'Contracted Enrollments (Non-binary, SOC)', tooltip: 'The number of non-binary students of color that have signed a contract and paid a deposit.', required: false }
]

const ALL_FIELDS = [...ADMISSIONS_FIELDS, ...ADMISSIONS_FIELDS_SOC];


const INITIAL_FORM_STATE = {
    SCHOOL_YR_ID: "",
    GRADE_DEF_ID: "",
    ...Object.fromEntries(ALL_FIELDS.map(field => [field.name, ""]))
};

export default function AdmissionsForm() {
    const { schoolYears, grades, loading, submitStatus, fetchGrades, fetchAutofillData, submitForm, resetSubmitStatus } = useSchoolDataForm({
        endpoint: '/api/submit-admissions',
        dataEndpoint: '/api/admissions-data'
    });

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    //Fetch grades when year changes
    useEffect(() => {
        fetchGrades(formData.SCHOOL_YR_ID);
    }, [formData.SCHOOL_YR_ID]);

    //Fetch autofill data when both year and grade are selected
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
    }, [formData.SCHOOL_YR_ID, formData.GRADE_DEF_ID]);

    //Clear success message after 3 seconds
    useEffect(() => {
        if (submitStatus === 'success') {
            const timer = setTimeout(() => {
                resetSubmitStatus();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus, resetSubmitStatus]);

    //Handle form data changing
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === "SCHOOL_YR_ID" && { GRADE_DEF_ID: "" })
        }));
    };

    //Validation function to check if form has errors
    const hasValidationErrors = () => {
        for (const field of ALL_FIELDS) {
            const value = formData[field.name as keyof typeof formData];
            if (!value || value === "") continue;

            if (/[^0-9]/.test(value)) return true;
        }
        return false;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (hasValidationErrors()) {
            console.log("Form has validation errors - cannot submit");
            return;
        }

        console.log("Submitting Admissions Data: ", formData);
        const result = await submitForm(formData);

        if (result.success) {
            //Reset form to initial state
            setFormData(INITIAL_FORM_STATE);
        }
    };

    const PIPELINE_FIELDS = ADMISSIONS_FIELDS.slice(0, 4);
    const PIPELINE_SOC = ADMISSIONS_FIELDS_SOC.slice(0, 4);

    const DEMOGRAPHIC_FIELDS = ADMISSIONS_FIELDS.slice(4);
    const DEMOGRAPHIC_SOC = ADMISSIONS_FIELDS_SOC.slice(4);

    const FORM_SECTIONS = [
        {
            title: "Pipeline Metrics",
            description: "Overall capacity, applications, and enrollment figures.",
            fields: PIPELINE_FIELDS,
            socFields: PIPELINE_SOC
        },
        {
            title: "Enrollment Demographics",
            description: "Breakdown of contracted enrollments by gender identity.",
            fields: DEMOGRAPHIC_FIELDS,
            socFields: DEMOGRAPHIC_SOC
        }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Admissions Activity</h2>
            <p className="text-gray-600 text-sm">Enter the total capacity and pipeline numbers for the current school year.</p>

            {/* Success/Error Messages */}
            {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Data saved successfully!</span>
                </div>
            )}

            {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Error saving data. Please try again.</span>
                </div>
            )}

            {/* Dropdown Row */}
            <DropdownSection
                schoolYears={schoolYears}
                grades={grades}
                formData={formData}
                onChange={handleChange}
            />

            {FORM_SECTIONS.map((section, sectionIndex) => (
                <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="space-y-4 pt-4">

                        {/* Section title and description */}
                        <div className={"px-4"} >
                            <h3 className="text-lg font-semibold text-[#1E3869]">{section.title}</h3>
                            <p className="text-sm text-gray-500">{section.description}</p>
                        </div>

                        {/* Column Headers */}
                        <div className="hidden md:grid grid-cols-12 gap-6 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="col-span-4">Metric</div>
                            <div className="col-span-4">Non-Students of Color (SOC)</div>
                            <div className="col-span-4">Students of Color (SOC)</div>
                        </div>

                        {/* Render rows in cards */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            {section.fields.map((field, index) => {
                                const socField = section.socFields[index];
                                return (
                                    <div key={field.name} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-gray-50/50 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center">

                                        {/* Row label */}
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

                                        {/* Non-SOC input */}
                                        <div className="col-span-1 md:col-span-4">
                                            <ValidatedNumberInput
                                                label={"Non-SOC"}
                                                name={field.name}
                                                value={formData[field.name as keyof typeof formData]}
                                                onChange={handleChange}
                                                required={field.required}
                                            />
                                        </div>

                                        {/* SOC input */}
                                        <div className="col-span-1 md:col-span-4">
                                            <ValidatedNumberInput
                                                label={"SOC"}
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

            <div className="flex justify-end pt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0693E3] text-white px-8 py-3 rounded font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {loading ? 'Saving...' : 'Save Admissions Data'}
                </button>
            </div>
        </form>
    );
}