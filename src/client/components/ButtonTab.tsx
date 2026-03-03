export type ButtonTabProps = {
    title: string;
    toggled: boolean;
    switchTab: (tab: string) => void;
}

function ButtonTab(props: ButtonTabProps) {
    return (
        <div
            className={`select-none px-8 py-2 rounded-t-xl text-lg cursor-pointer transition-colors ${
                props.toggled ? "bg-[#0693E3] text-white" : "bg-[#E6E6E6] text-[#1E3869] hover:bg-gray-300"
            }`}
            onClick={() => props.switchTab(props.title)}
        >
            <h1>{props.title}</h1>
        </div>
    )
}

export default ButtonTab;