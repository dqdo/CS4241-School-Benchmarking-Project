import {useState} from 'react';
import { Tooltip } from 'flowbite-react';

export default function AdmissionsForm() {
    //Group form data. Data is from the ADMISSION_ACTIVITY db table
    const [formData, setFormData] = useState({
        capacityEnroll: "",
        completedApplicationsTotal: "",
        acceptancesTotal: "",
        newEnrollmentsTotal: "",
    });

    //Generic handler for all inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Submitting Admissions Data: ", formData);
        // TODO: POST to backend
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1E3869]">Admissions Activity</h2>
            <p className="text-gray-600 text-sm">Enter the total capacity and pipeline numbers for the current school
                year.</p>

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
                        name="capacityEnroll"
                        value={formData.capacityEnroll}
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
                        name="completedApplicationsTotal"
                        value={formData.completedApplicationsTotal}
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
                        name="acceptancesTotal"
                        value={formData.acceptancesTotal}
                        onChange={handleChange}
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                    />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold flex flex-row gap-2">
                        <label className="font-semibold text-sm mb-1">Total New Enrollments</label>
                        <Tooltip content="The total number of newly enrolled students for the year." placement="top" style="light" arrow={false}>
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
                        name="newEnrollmentsTotal"
                        value={formData.newEnrollmentsTotal}
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