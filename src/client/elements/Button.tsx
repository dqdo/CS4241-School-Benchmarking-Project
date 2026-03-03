type ButtonProps = {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    buttonText: string;
}
export default function Button(props: ButtonProps) {
    return (
        <button className="rounded-sm w-64 h-16 text-lg border-2 bg-[#0A3E6C] hover:bg-[#0066CC] border-[#1A3A6C] text-white transition-colors duration-200" onClick={props.onClick}>{props.buttonText}</button>
    )
}