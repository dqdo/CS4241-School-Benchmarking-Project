import ButtonTab from "./ButtonTab";
import UserIcon from "../assets/User-Icon.svg";

export type TabBarProps = {
	tabStatuses: boolean[];
	setTabStatuses: (tabStatuses: boolean[]) => void;
}

export const TABS = [
    "Dashboard",
    "Data Entry",
    "Admissions",
    "Enrollment & Attrition"
] as const;

export type Tab = typeof TABS[number]; // for TypeScript to stop being mad

export default function TabBar(props: TabBarProps) {

	function switchTab(tab: Tab){
		const tabIndex = TABS.indexOf(tab);
		const newStatuses = props.tabStatuses.map((v, idx) => false);
		newStatuses[tabIndex] = true;
		props.setTabStatuses(newStatuses);
	}

	return (
		<div className="w-full pt-4 flex items-center justify-left space-x-4 px-4">
			{TABS.map((tab, idx) => (
				<ButtonTab switchTab={switchTab} key={tab} title={tab} toggled={props.tabStatuses[idx]}/>
			))}
		</div>
	)
}