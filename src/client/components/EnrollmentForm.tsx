import { useState } from "react";
import {Tooltip} from "flowbite-react";

export default function EnrollmentForm() {
    const [formData, setFormData] = useState({
        studentsAdded: "",
        studentsGraduated: "",
        studentsDismissed: "",
        studentsNotReturning: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Submitting Enrollment Data:", formData);
        // TODO: POST to backend
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Enrollment & Attrition</h2>
            <p className="text-gray-600 text-sm">Track student retention, graduations, and departures.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Students Added During Year</label>
                        <Tooltip content="The number of students added to the school this year." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input type="number" name="studentsAdded" value={formData.studentsAdded} onChange={handleChange} className="border border-gray-300 rounded p-2" />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Students Graduated</label>
                        <Tooltip content="The number of students that graduated this year." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input type="number" name="studentsGraduated" value={formData.studentsGraduated} onChange={handleChange} className="border border-gray-300 rounded p-2" />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Students Dismissed/Withdrawn</label>
                        <Tooltip content="The number of students that were dismissed or withdrew themsevles this year." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input type="number" name="studentsDismissed" value={formData.studentsDismissed} onChange={handleChange} className="border border-gray-300 rounded p-2" />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Students Who Chose Not to Return</label>
                        <Tooltip content="The number of students that chose not to return to the school this year." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input type="number" name="studentsNotReturning" value={formData.studentsNotReturning} onChange={handleChange} className="border border-gray-300 rounded p-2" />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-[#0693E3] text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition-colors">
                    Save Enrollment Data
                </button>
            </div>
        </form>
    );
}