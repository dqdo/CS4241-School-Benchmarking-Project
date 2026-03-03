import Dropdown from "../../elements/Dropdown";
import AdmissionsGraph, {AdmissionsGraphProps} from "./AdmissionsGraph";
import Button from "../../elements/Button";
import {useState} from "react";
import {Grade, School, Year} from "./Admissions";

type CompareProps = {
	compareType: string
	exitCompare: () => void
	schools: School[]
	years: Year[]
	grades: Grade[]
	userSchool: School
}



export default function AdmissionsCompare(props: CompareProps){

	const [chartType, setChartType] = useState<string>("bar");

	const graphProps: AdmissionsGraphProps = {
		chartType: chartType as "bar" | "doughnut" | "pie" | "line",
		grades: props.grades,
		label: props.compareType,
		schools: props.schools,
		standalone: true,
		userSchool: props.userSchool,
		years: props.years
	}

	return (
		<div>
			<div className={"mt-2 ml-2 flex space-x-2"}>
				<Dropdown option={chartType} prompt={"Select Chart Type..."} setOption={setChartType} options={[{option: "Doughnut", value:"doughnut"}, {option: "Pie", value: "pie"}, {option: "Bar", value: "bar"}, {option: "Line", value: "line"}]} />
				<Button onClick={() => props.exitCompare()} buttonText={"Stop Compare"} />
			</div>

			<div className={"mt-2 grid grid-cols-2 gap-4"}>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph {...graphProps} />
				</div>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph {...graphProps} />
				</div>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph {...graphProps} />
				</div>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph {...graphProps} />
				</div>
			</div>
		</div>
	)
}