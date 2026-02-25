import {useState, useEffect } from 'react';
import TooltipInput from './TooltipInput'

export default function AdmissionsForm() {
    //Group form data. Data is from the ADMISSION_ACTIVITY db table
    const [formData, setFormData] = useState({
        SCHOOL_YR_ID: "",
        GRADE_DEF_ID: "",
        CAPACITY_ENROLL: "",
        COMPLETED_APPLICATION_TOTAL: "",
        ACCEPTANCES_TOTAL: "",
        NEW_ENROLLMENTS_TOTAL: "",
        CONTRACTED_ENROLL_BOYS: "",
        CONTRACTED_ENROLL_GIRLS: "",
        CONTRACTED_ENROLL_NB: ""
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

    //If you've selected both, get the autofill data
    useEffect(() => {
        //Only run if both dropdowns have a selection
        if (formData.SCHOOL_YR_ID && formData.GRADE_DEF_ID) {

            fetch(`/api/admissions-data?yearId=${formData.SCHOOL_YR_ID}&gradeId=${formData.GRADE_DEF_ID}`)
                .then(res => res.json())
                .then(data => {
                    //Update the form with the database numbers, or reset to blanks if it's a new year
                    setFormData(prev => ({
                        ...prev,
                        CAPACITY_ENROLL: data.CAPACITY_ENROLL || "",
                        COMPLETED_APPLICATION_TOTAL: data.COMPLETED_APPLICATION_TOTAL || "",
                        ACCEPTANCES_TOTAL: data.ACCEPTANCES_TOTAL || "",
                        NEW_ENROLLMENTS_TOTAL: data.NEW_ENROLLMENTS_TOTAL || "",
                        CONTRACTED_ENROLL_BOYS: data.CONTRACTED_ENROLL_BOYS || "",
                        CONTRACTED_ENROLL_GIRLS: data.CONTRACTED_ENROLL_GIRLS || "",
                        CONTRACTED_ENROLL_NB: data.CONTRACTED_ENROLL_NB || "",
                    }));
                })
                .catch(err => console.error("Failed to fetch autofill data:", err));
        }
    }, [formData.SCHOOL_YR_ID, formData.GRADE_DEF_ID]); //Re-run when either dropdown changes

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
            <p className="text-gray-600 text-sm">Enter the total capacity and pipeline numbers for the current school year.</p>

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
                <TooltipInput
                    label="Total Enrollment Capacity"
                    tooltipText="The maximum number of students your school can accommodate."
                    name="CAPACITY_ENROLL"
                    value={formData.CAPACITY_ENROLL}
                    onChange={handleChange}
                    required={true}
                />

                <TooltipInput
                    label="Total Completed Applications"
                    tooltipText="The total number of fully completed submitted applications."
                    name="COMPLETED_APPLICATION_TOTAL"
                    value={formData.COMPLETED_APPLICATION_TOTAL}
                    onChange={handleChange}
                />

                <TooltipInput
                    label="Total New Enrollments"
                    tooltipText="The total number of newly enrolled students."
                    name="NEW_ENROLLMENTS_TOTAL"
                    value={formData.NEW_ENROLLMENTS_TOTAL}
                    onChange={handleChange}
                />

                <TooltipInput
                    label="Total Acceptances"
                    tooltipText="The total number of accepted students."
                    name="ACCEPTANCES_TOTAL"
                    value={formData.ACCEPTANCES_TOTAL}
                    onChange={handleChange}
                />

                <TooltipInput
                    label="Contracted Enrollments (Boys)"
                    tooltipText="The number of boys that have signed a contract and paid a deposit."
                    name="CONTRACTED_ENROLL_BOYS"
                    value={formData.CONTRACTED_ENROLL_BOYS}
                    onChange={handleChange}
                />

                <TooltipInput
                    label="Contracted Enrollments (Girls)"
                    tooltipText="The number of girls that have signed a contract and paid a deposit."
                    name="CONTRACTED_ENROLL_GIRLS"
                    value={formData.CONTRACTED_ENROLL_GIRLS}
                    onChange={handleChange}
                />

                <TooltipInput
                    label="Contracted Enrollments (Non-binary)"
                    tooltipText="The number of non-binary students that have signed a contract and paid a deposit."
                    name="CONTRACTED_ENROLL_NB"
                    value={formData.CONTRACTED_ENROLL_NB}
                    onChange={handleChange}
                />
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