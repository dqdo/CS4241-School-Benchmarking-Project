type ButtonProps = {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    buttonText: string;
}
export default function Button(props: ButtonProps) {
    return (
        <button className={"rounded-sm w-64 h-16 text-lg border-2 bg-[#0693E3] border-gray-600 text-white"} onClick={props.onClick}>{props.buttonText}</button>
    )
}