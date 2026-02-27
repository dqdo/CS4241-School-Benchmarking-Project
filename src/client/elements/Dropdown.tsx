type DropdownProps = {
    options: {option:string, value:any}[];
    setOption: (option: string) => void;
    option: string;
    prompt: string;
}
export default function Dropdown(props: DropdownProps) {
    return (
        <div>
            <select className={"w-64 h-16 text-lg border-2 border-[#0693E3] bg-gray-600 text-white"} value={props.option} onChange={e => props.setOption(e.target.value)}>
                <option value={"None"}>{props.prompt}</option>
                {props.options.map((option, id) => {
                    console.log(option);
                    return(<option key={id} value={option.value}>{option.option}</option>)
                })}
            </select>
        </div>
    )
}