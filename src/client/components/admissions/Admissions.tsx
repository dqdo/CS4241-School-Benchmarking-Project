import AdmissionsGraph from "./AdmissionsGraph";

export default function Admissions() {

    return (
        <div className={"mt-2 grid grid-cols-2 gap-4"}>
            <div className={"border-2 border-black"}>
                <AdmissionsGraph label={"Acceptances"} />
            </div>
            <div className={"border-2 border-black"}>
                <AdmissionsGraph label={"Enrollments"}/>
            </div>
            <div className={"border-2 border-black"}>
                <AdmissionsGraph label={"Enroll Capacity"} />
            </div>
            <div className={"border-2 border-black"}>
                <AdmissionsGraph label={"Completed Application"} />
            </div>
        </div>
    )

}