import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    buttonText: string;
}

export default function Button({ buttonText, className, ...props }: ButtonProps) {
    return (
        <button
            className={`
                rounded-sm w-64 h-16 text-lg border-2 text-white transition-colors duration-200
                ${props.disabled
                ? "bg-gray-400 border-gray-500 cursor-not-allowed"
                : "bg-[#0A3E6C] hover:bg-[#0066CC] border-[#1A3A6C]"}
                ${className}
            `}
            {...props}
        >
            {buttonText}
        </button>
    );
}