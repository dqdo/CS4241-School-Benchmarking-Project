import {School, Year} from "../components/admissions/AdmissionsGraph";
import Dropdown from "./Dropdown";
import {Grade} from "../components/admissions/Admissions";

type SchoolSelectorProps = {
	userSchool: School,
	schools: School[],
	years: Year[],
	schoolSelection?: string,
	setSchoolSelection?: (option: string) => void,
	yearSelection?: string,
	setYearSelection?: (option: string) => void,
	chartType?: string,
	setChartType?: (option: string) => void,
	gradeSelection?: string,
	setGradeSelection?: (option: string) => void,
	grades: Grade[],
}


export default function SchoolSelector(props: SchoolSelectorProps) {
	return (
		<div className={"mt-2 ml-2 flex space-x-2"}>
			{props.userSchool.NAME_TX === "Admin" && props.schoolSelection !== undefined && props.setSchoolSelection ?
				(<Dropdown option={props.schoolSelection} prompt={"Select School..."} setOption={props.setSchoolSelection} options={props.schools.map(school => {
					return {option: school.NAME_TX, value: school.ID}
				})} />)
				:
				(<div className="flex items-center justify-center h-16 px-16 text-lg text-white bg-[#0A3E6C] rounded-xl shadow-xl outline-none">
					<p>{props.userSchool.NAME_TX}</p>
				</div>)
			}
			{(props.chartType !== "line" && props.yearSelection !== undefined && props.setYearSelection) ?
                <Dropdown option={props.yearSelection} prompt={"Select Year..."} setOption={props.setYearSelection} options={props.years.map(year => {
					return {option: year.SCHOOL_YEAR, value: year.ID}
				})} /> : <></>
			}
			{(props.chartType === "line" && props.gradeSelection !== undefined && props.setGradeSelection) ?
                <Dropdown option={props.gradeSelection} prompt={"Select Grade..."} setOption={props.setGradeSelection} options={props.grades.map(grade => {
					return {option: grade.DESCRIPTION_TX, value: grade.ID}
				})} /> : <></>}
			{(props.chartType && props.setChartType) ?
                <Dropdown option={props.chartType} prompt={"Select Chart Type..."} setOption={props.setChartType} options={[{option: "Doughnut", value:"doughnut"}, {option: "Pie", value: "pie"}, {option: "Bar", value: "bar"}, {option: "Line", value: "line"}]} /> : <></>
			}
		</div>
	)
}