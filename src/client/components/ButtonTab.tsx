import {useState} from "react";
import {Tab} from "./TabBar";

export type ButtonTabProps = {
	title: Tab;
	toggled: boolean;
	switchTab: (tab: Tab) => void;
}

function ButtonTab(props: ButtonTabProps) {
	return (
		<div className={`select-none px-16 py-2 rounded-t-xl text-xl cursor-pointer ${props.toggled ? "bg-[#0693E3] text-white" : "bg-[#E6E6E6] text-[#1E3869]"}`} onClick={() => props.switchTab(props.title)}>
			<h1>{props.title}</h1>
		</div>
	)
}

export default ButtonTab;