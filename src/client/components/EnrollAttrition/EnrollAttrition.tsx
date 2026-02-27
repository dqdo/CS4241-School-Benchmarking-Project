import { useState } from "react";
import EnrollAttritionGraph from "./EnrollAttritionGraph";

export default function EnrollAttrition() {
    const [activeCollection, setActiveCollection] = useState<"EnrollAttrition" | "EnrollAttritionSOC">("EnrollAttrition");

    return (
        <div>
            {/* Toggle */}
            <div className="flex space-x-2 px-4 pt-4 border-b-2 border-gray-200 pb-2">
                <button
                    className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                        activeCollection === "EnrollAttrition"
                            ? "bg-[#0693E3] text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveCollection("EnrollAttrition")}
                >
                    Enrollment & Attrition
                </button>
                <button
                    className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                        activeCollection === "EnrollAttritionSOC"
                            ? "bg-[#0693E3] text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveCollection("EnrollAttritionSOC")}
                >
                    Enrollment & Attrition (SOC)
                </button>
            </div>

            {/* Charts */}
            <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="border-2 border-black">
                    <EnrollAttritionGraph label="Students Added During Year" field="STUDENTS_ADDED_DURING_YEAR" chartType="bar" collection={activeCollection} />
                </div>
                <div className="border-2 border-black">
                    <EnrollAttritionGraph label="Students Graduated" field="STUDENTS_GRADUATED" chartType="bar" collection={activeCollection} />
                </div>
                <div className="border-2 border-black">
                    <EnrollAttritionGraph label="Students Dismissed/Withdrawn" field="STUD_DISS_WTHD" chartType="line" collection={activeCollection} />
                </div>
                <div className="border-2 border-black">
                    <EnrollAttritionGraph label="Students Not Returning" field="STUD_NOT_RETURN" chartType="line" collection={activeCollection} />
                </div>
                <div className="border-2 border-black">
                    <EnrollAttritionGraph label="Students Not Invited to Return" field="STUD_NOT_INV" chartType="bar" collection={activeCollection} />
                </div>
                <div className="border-2 border-black">
                    <EnrollAttritionGraph label="Exchange Students" field="EXCH_STUD_REPTS" chartType="line" collection={activeCollection} />
                </div>
            </div>
        </div>
    );
}

