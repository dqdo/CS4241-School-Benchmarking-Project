import Dropdown from "../../elements/Dropdown";
import AdmissionsGraph from "./AdmissionsGraph";
import Button from "../../elements/Button";
import {useState} from "react";

type CompareProps = {
	compareType: string
	exitCompare: () => void
}
export default function AdmissionsCompare(props: CompareProps){
	const [chartType, setChartType] = useState<string>("bar");
	return (
		<div>
			<div className={"mt-2 ml-2 flex space-x-2"}>
				<Dropdown option={chartType} prompt={"Select Chart Type..."} setOption={setChartType} options={[{option: "Doughnut", value:"doughnut"}, {option: "Pie", value: "pie"}, {option: "Bar", value: "bar"}, {option: "Line", value: "line"}]} />
				<Button onClick={() => props.exitCompare()} buttonText={"Stop Compare"} />
			</div>

			<div className={"mt-2 grid grid-cols-2 gap-4"}>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph label={props.compareType} standalone={true} chartType={chartType as "bar" | "doughnut" | "pie" | "line"}/>
				</div>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph label={props.compareType} standalone={true} chartType={chartType as "bar" | "doughnut" | "pie" | "line"} />
				</div>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph label={props.compareType} standalone={true} chartType={chartType as "bar" | "doughnut" | "pie" | "line"} />
				</div>
				<div className={"border-2 border-[#0A3E6C]"}>
					<AdmissionsGraph label={props.compareType} standalone={true} chartType={chartType as "bar" | "doughnut" | "pie" | "line"} />
				</div>
			</div>
		</div>
	)
}