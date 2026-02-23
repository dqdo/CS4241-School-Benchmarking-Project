import {useState, useEffect } from 'react';
import { Tooltip } from 'flowbite-react';
import {response} from "express";

export default function AdmissionsForm() {
    //Group form data. Data is from the ADMISSION_ACTIVITY db table
    const [formData, setFormData] = useState({
        SCHOOL_YR_ID: "",
        GRADE_DEF_ID: "",
        CAPACITY_ENROLL: "",
        COMPLETED_APPLICATION_TOTAL: "",
        ACCEPTANCES_TOTAL: "",
        NEW_ENROLLMENTS_BOYS: "",
        NEW_ENROLLMENTS_GIRLS: ""
    });

    const [schoolYears, setSchoolYears] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);

    //Fetch available school years when the component loads
    useEffect(() => {
        fetch("/api/available-years")
            .then(res => {
                if (!res.ok) throw new Error("Server error: " + res.status);
                return res.json();
            })
            .then(data => {
                //If it's an array, then set
                if (Array.isArray(data)) setSchoolYears(data);
                else setSchoolYears([]);
            })
            .catch(err => {
                console.error("Failed to load years", err);
                setSchoolYears([]); //Fallback to empty array
            });
    }, []);

    //Fetch available grades when you select a new year
    useEffect(() => {
        if (!formData.SCHOOL_YR_ID) {
            setGrades([]);
            return;
        }
        fetch(`/api/available-grades?yearId=${formData.SCHOOL_YR_ID}`)
            .then(res => {
                if (!res.ok) throw new Error("Server error: " + res.status);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setGrades(data);
                else setGrades([]);
            })
            .catch(err => {
                console.error("Failed to load grades", err);
                setGrades([]);
            });
    }, [formData.SCHOOL_YR_ID]);

    //Generic handler for all inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // If they just changed the year dropdown, clear the grade dropdown
            if (name === "SCHOOL_YR_ID") {
                newData.GRADE_DEF_ID = "";
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Submitting Admissions Data: ", formData);
        try {
             const response = await fetch("/api/submit-admissions", {
                 method: "POST",
                 headers: {
                     "Content-Type": "application/json"
                 },
                 body: JSON.stringify(formData)
             });

             if (response.ok) {
                 console.log("Successfully submitted new Admissions Data")
             }
             else {
                 console.error("Backend returned an error: ", response.status)
             }
         }
         catch (error) {
            console.error("Error Connecting to Backend: ", error)
         }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Admissions Activity</h2>
            <p className="text-gray-600 text-sm">Enter the total capacity and pipeline numbers for the current school
                year.</p>

            {/* --- Dropdown Row --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">

                {/* School Year Dropdown */}
                <div className="flex flex-col">
                    <label className="font-semibold text-sm mb-1 text-[#1E3869]">School Year</label>
                    <select
                        name="SCHOOL_YR_ID"
                        value={formData.SCHOOL_YR_ID}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3] bg-white cursor-pointer"
                        required
                    >
                        <option value="" disabled>Select a school year...</option>
                        {schoolYears.map((year) => (
                            <option key={year.ID} value={year.ID}>
                                {year.SCHOOL_YEAR}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Grade Level Dropdown */}
                <div className="flex flex-col">
                    <label className="font-semibold text-sm mb-1 text-[#1E3869]">Grade Level</label>
                    <select
                        name="GRADE_DEF_ID"
                        value={formData.GRADE_DEF_ID}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3] bg-white cursor-pointer"
                        required
                    >
                        <option value="" disabled>Select a grade...</option>
                        {grades.map((grade) => (
                            <option key={grade.ID} value={grade.ID}>
                                {grade.NAME_TX} {/* example "1st Grade" */}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {/* --- End Dropdown Row --- */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Total Enrollment Capacity</label>
                        <Tooltip content="The maximum number of students your school can accommodate." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input
                        type="number"
                        name="CAPACITY_ENROLL"
                        value={formData.CAPACITY_ENROLL}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Total Completed Applications</label>
                        <Tooltip content="The total number of fully completed submitted applications." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input
                        type="number"
                        name="COMPLETED_APPLICATION_TOTAL"
                        value={formData.COMPLETED_APPLICATION_TOTAL}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                    />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Total Acceptances</label>
                        <Tooltip content="The total number of accepted students." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input
                        type="number"
                        name="ACCEPTANCES_TOTAL"
                        value={formData.ACCEPTANCES_TOTAL}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                    />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Total New Enrollments (Boys)</label>
                        <Tooltip content="The total number of newly enrolled boys for the year." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input
                        type="number"
                        name="NEW_ENROLLMENTS_BOYS"
                        value={formData.NEW_ENROLLMENTS_BOYS}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                    />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Total New Enrollments (Girls)</label>
                        <Tooltip content="The total number of newly enrolled girls for the year." placement="top" style="light" arrow={false}>
                            <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                                <g clipPath="url(#clip0_429_11160)">
                                    <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round"/>
                                    <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                            </svg>
                        </Tooltip>
                    </span>
                    <input
                        type="number"
                        name="NEW_ENROLLMENTS_GIRLS"
                        value={formData.NEW_ENROLLMENTS_GIRLS}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit"
                        className="bg-[#0693E3] text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition-colors">
                    Save Admissions Data
                </button>
            </div>
        </form>
    );
}