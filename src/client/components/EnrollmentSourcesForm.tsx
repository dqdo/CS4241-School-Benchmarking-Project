import { useState, useEffect } from 'react';
import { Tooltip } from 'flowbite-react';
import { useSchoolDataForm } from '../hooks/useSchoolDataForm';
import { DropdownSection } from './DropdownSection';
import ValidatedNumberInput from "./ValidatedNumberInput";

const INQUIRY_FIELDS = [
    { name: 'INQUIRIES_M', label: 'Inquiries (Boys)', tooltip: 'Enrolled boys who inquired last year.' },
    { name: 'INQUIRIES_F', label: 'Inquiries (Girls)', tooltip: 'Enrolled girls who inquired last year.' },
    { name: 'INQUIRIES_U', label: 'Inquiries (All/Unspecified)', tooltip: 'Enrolled students of all/unspecified genders who inquired last year.' }
] as const;

const FACULTY_FIELDS = [
    { name: 'FACULTYCHILD_M', label: 'Faculty Children (Boys)', tooltip: 'Enrolled boys who are children of faculty/staff.' },
    { name: 'FACULTYCHILD_F', label: 'Faculty Children (Girls)', tooltip: 'Enrolled girls who are children of faculty/staff.' },
    { name: 'FACULTYCHILD_U', label: 'Faculty Children (All/Unspecified)', tooltip: 'Enrolled students of all/unspecified genders who are children of faculty/staff.' }
] as const;

const ALL_FIELDS = [...INQUIRY_FIELDS, ...FACULTY_FIELDS];

const INITIAL_FORM_STATE = {
    SCHOOL_YR_ID: "",
    ...Object.fromEntries(ALL_FIELDS.map(field => [field.name, ""]))
};

export default function EnrollmentSourcesForm() {
    const { schoolYears, loading, submitStatus, fetchAutofillData, submitForm, resetSubmitStatus } = useSchoolDataForm({
        endpoint: '/api/submit-enrollment-sources',
        dataEndpoint: '/api/enrollment-sources-data'
    });

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    useEffect(() => {
        if (formData.SCHOOL_YR_ID) {
            fetchAutofillData(formData.SCHOOL_YR_ID).then(data => {
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
    }, [formData.SCHOOL_YR_ID]);

    useEffect(() => {
        if (submitStatus === 'success') {
            const timer = setTimeout(() => resetSubmitStatus(), 3000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus, resetSubmitStatus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
        if (hasValidationErrors()) return;
        const result = await submitForm(formData);
        if (result.success) setFormData(INITIAL_FORM_STATE);
    };

    const FORM_SECTIONS = [
        {
            title: "Standard Inquiries",
            description: "Students who formally inquired in the previous school year.",
            fields: INQUIRY_FIELDS
        },
        {
            title: "Faculty Children",
            description: "Enrolled children of current faculty and staff members.",
            fields: FACULTY_FIELDS
        }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Enrollment Sources</h2>
            <p className="text-gray-600 text-sm">Track where your student population originates from by gender identity.</p>

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
                grades={[]}
                formData={formData}
                onChange={handleChange}
                showGrade={false}
            />

            {FORM_SECTIONS.map((section, sectionIndex) => (
                <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="space-y-4 pt-4">
                        <div className="px-4">
                            <h3 className="text-lg font-semibold text-[#1E3869]">{section.title}</h3>
                            <p className="text-sm text-gray-500">{section.description}</p>
                        </div>

                        <div className="bg-white rounded-lg border-t border-gray-200 overflow-hidden">
                            {section.fields.map((field) => (
                                <div key={field.name} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-gray-50/50 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center">
                                    <div className="col-span-1 md:col-span-6 flex items-center gap-2">
                                        <label className="text-sm font-semibold text-gray-800">{field.label}</label>
                                        <Tooltip content={field.tooltip} placement="top" style="light" arrow={false}>
                                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                                <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round" />
                                                <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </Tooltip>
                                    </div>
                                    <div className="col-span-1 md:col-span-6">
                                        <ValidatedNumberInput
                                            name={field.name}
                                            value={formData[field.name as keyof typeof formData]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-end pt-6">
                <button type="submit" className="bg-[#0693E3] text-white px-8 py-3 rounded font-semibold hover:bg-blue-600 transition-colors shadow-sm">
                    Save Enrollment Sources
                </button>
            </div>
        </form>
    );
}