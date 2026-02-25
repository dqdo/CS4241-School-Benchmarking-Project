import {useEffect, useState} from "react";
import TooltipInput from "./TooltipInput";

export default function EnrollmentForm() {
    const [formData, setFormData] = useState({
        SCHOOL_YR_ID: "",
        GRADE_DEF_ID: "",
        STUDENTS_ADDED_DURING_YEAR: "",
        STUDENTS_GRADUATED: "",
        EXCH_STUD_REPS: "",
        STUD_DISS_WTHD: "",
        STUD_NOT_INV: "",
        STUD_NOT_RETURN: "",
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

            fetch(`/api/enrollment-data?yearId=${formData.SCHOOL_YR_ID}&gradeId=${formData.GRADE_DEF_ID}`)
                .then(res => res.json())
                .then(data => {
                    //Update the form with the database numbers, or reset to blanks if it's a new year
                    setFormData(prev => ({
                        ...prev,
                        STUDENTS_ADDED_DURING_YEAR: data.STUDENTS_ADDED_DURING_YEAR || "",
                        STUDENTS_GRADUATED: data.STUDENTS_GRADUATED || "",
                        EXCH_STUD_REPS: data.EXCH_STUD_REPS || "",
                        STUD_DISS_WTHD: data.STUD_DISS_WTHD || "",
                        STUD_NOT_INV: data.STUD_NOT_INV || "",
                        STUD_NOT_RETURN: data.STUD_NOT_RETURN || "",
                    }));
                })
                .catch(err => console.error("Failed to fetch autofill data:", err));
        }
    }, [formData.SCHOOL_YR_ID, formData.GRADE_DEF_ID]);

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
        console.log("Submitting Enrollment Data: ", formData);
        try {
            const response = await fetch("/api/submit-enrollment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                console.log("Successfully submitted new Enrollment Data")
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
            <h2 className="text-2xl font-semibold text-[#1E3869]">Enrollment & Attrition</h2>
            <p className="text-gray-600 text-sm">Track student retention, graduations, and departures.</p>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TooltipInput
                    label="Students Added During Year"
                    tooltipText="The number of students added to the school this year."
                    name="STUDENTS_ADDED_DURING_YEAR"
                    value={formData.STUDENTS_ADDED_DURING_YEAR}
                    onChange={handleChange}
                    required={true}
                />

                <TooltipInput
                    label="Students Graduated"
                    tooltipText="The number of students that graduated this year."
                    name="STUDENTS_GRADUATED"
                    value={formData.STUDENTS_GRADUATED}
                    onChange={handleChange}
                    required={true}
                />

                <TooltipInput
                    label="Students Dismissed/Withdrawn"
                    tooltipText="The number of students that were dismissed or withdrew this year."
                    name="STUD_DISS_WTHD"
                    value={formData.STUD_DISS_WTHD}
                    onChange={handleChange}
                    required={true}
                />

                <TooltipInput
                    label="Students Who Chose Not to Return"
                    tooltipText="The number of students that chose not to return to school this year."
                    name="STUD_NOT_RETURN"
                    value={formData.STUD_NOT_RETURN}
                    onChange={handleChange}
                    required={true}
                />

                <TooltipInput
                    label="Students Not Invited to Return"
                    tooltipText="The number of students that were not invited to return this year."
                    name="STUD_NOT_INV"
                    value={formData.STUD_NOT_INV}
                    onChange={handleChange}
                    required={true}
                />

                <TooltipInput
                    label="Exchange Students"
                    tooltipText="The number of exchange students at the school this year."
                    name="EXCH_STUD_REPS"
                    value={formData.EXCH_STUD_REPS}
                    onChange={handleChange}
                    required={true}
                />
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" className="bg-[#0693E3] text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition-colors">
                    Save Enrollment Data
                </button>
            </div>
        </form>
    );
}