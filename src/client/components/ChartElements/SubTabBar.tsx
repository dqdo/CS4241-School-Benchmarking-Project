import ButtonTab from "../ButtonTab";
import TogglePill from "../../elements/TogglePill";

type SubTabProps = {
    tabs: string[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSOC?: boolean;
    setIsSOC?: (isSoc: boolean) => void;
}

export default function SubTabBar(props: SubTabProps) {
    return (
        <div className="flex flex-wrap space-x-2 border-b-2 border-gray-200 pb-0">
            {props.tabs.map(tab => (
                <ButtonTab
                    key={tab}
                    title={tab}
                    toggled={props.activeTab === tab}
                    switchTab={props.setActiveTab}
                />
            ))}
            {(props.isSOC !== undefined && props.setIsSOC !== undefined) && (<div className="mb-1 mt-1 mr-1">
                <TogglePill label="SOC" value={props.isSOC} onChange={props.setIsSOC} />
            </div>)}
        </div>
    )
}