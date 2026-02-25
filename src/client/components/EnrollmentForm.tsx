import { useState, useEffect } from 'react';
import TooltipInput from './TooltipInput';
import { useSchoolDataForm } from '../hooks/useSchoolDataForm';
import { DropdownSection } from './DropdownSection';

const ENROLLMENT_FIELDS = [
    { name: 'STUDENTS_ADDED_DURING_YEAR', label: 'Students Added During Year', tooltip: 'The number of students added to the school this year.', required: false },
    { name: 'STUDENTS_GRADUATED', label: 'Students Graduated', tooltip: 'The number of students that graduated this year.', required: false },
    { name: 'STUD_DISS_WTHD', label: 'Students Dismissed/Withdrawn', tooltip: 'The number of students that were dismissed or withdrew this year.', required: false },
    { name: 'STUD_NOT_RETURN', label: 'Students Who Chose Not to Return', tooltip: 'The number of students that chose not to return to school this year.', required: false },
    { name: 'STUD_NOT_INV', label: 'Students Not Invited to Return', tooltip: 'The number of students that were not invited to return this year.', required: false },
    { name: 'EXCH_STUD_REPS', label: 'Exchange Students', tooltip: 'The number of exchange students at the school this year.', required: false }
] as const;

const INITIAL_FORM_STATE = {
    SCHOOL_YR_ID: "",
    GRADE_DEF_ID: "",
    ...Object.fromEntries(ENROLLMENT_FIELDS.map(field => [field.name, ""]))
};

export default function EnrollmentForm() {
    const { schoolYears, grades, loading, submitStatus, fetchGrades, fetchAutofillData, submitForm, resetSubmitStatus } = useSchoolDataForm({
        endpoint: '/api/submit-enrollment',
        dataEndpoint: '/api/enrollment-data'
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
                            ENROLLMENT_FIELDS.map(field => [field.name, data[field.name] || ""])
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
        for (const field of ENROLLMENT_FIELDS) {
            const value = formData[field.name as keyof typeof formData];
            if (!value || value === "") continue;

            //Check for non-numeric characters
            if (/[^0-9.\-]/.test(value) || /[a-zA-Z]/.test(value)) return true;

            //Check for multiple minus signs or minus not at start
            const minusCount = (value.match(/-/g) || []).length;
            if (minusCount > 1 || (minusCount === 1 && !value.startsWith('-'))) return true;

            //Check for negative numbers
            if (value.startsWith('-')) return true;

            //Check for decimals
            if (value.includes('.')) return true;

            //Check if valid number
            if (isNaN(parseFloat(value))) return true;
        }
        return false;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (hasValidationErrors()) {
            console.log("Form has validation errors - cannot submit");
            return;
        }

        console.log("Submitting Enrollment Data: ", formData);
        const result = await submitForm(formData);

        if (result.success) {
            //Reset form to initial state
            setFormData(INITIAL_FORM_STATE);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Enrollment & Attrition</h2>
            <p className="text-gray-600 text-sm">Track student retention, graduations, and departures.</p>

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

            {/* Repeated input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ENROLLMENT_FIELDS.map((field) => (
                    <TooltipInput
                        key={field.name}
                        label={field.label}
                        tooltipText={field.tooltip}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        required={field.required}
                    />
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0693E3] text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Save Enrollment Data'}
                </button>
            </div>
        </form>
    );
}