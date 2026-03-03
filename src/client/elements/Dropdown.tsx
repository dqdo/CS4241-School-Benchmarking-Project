type DropdownProps = {
	options: { option: string, value: any }[];
	setOption: (option: string) => void;
	option: string;
	prompt: string;
}
export default function Dropdown(props: DropdownProps) {
	return (
        <div className="flex justify-center">
            <div className="relative w-64">
                <select
                    className="w-full h-16 px-4 text-lg text-white bg-[#0A3E6C] border-2 border-[#1A3A6C] rounded-xl shadow-xl outline-none transition-all duration-200 hover:bg-[#0066CC] focus:bg-[#0066CC] focus:ring-2 focus:ring-white focus:border-white cursor-pointer"
                    value={props.option}
                    onChange={(e) => props.setOption(e.target.value)}
                >
                    <option value="None" className="bg-[#0A3E6C] text-white">{props.prompt}</option>
                    {props.options.map((option, id) => (
                        <option key={id} value={option.value} className="bg-[#0A3E6C] text-white">{option.option}</option>
                    ))}
                </select>
            </div>
        </div>
	)
}