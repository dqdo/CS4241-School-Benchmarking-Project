import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    buttonText: string;
}

export default function Button({ buttonText, className, ...props }: ButtonProps) {
    return (
        <button
            className={`
                group relative inline-flex items-center justify-center gap-2
                px-6 py-2.5 text-sm font-semibold tracking-wide
                rounded-lg border transition-all duration-200
                ${props.disabled
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#0A3E6C] border-[#0A3E6C] text-white hover:bg-[#0d4f8a] hover:border-[#0d4f8a] hover:shadow-md active:scale-[0.98]"
            }
                ${className ?? ""}
            `}
            {...props}
        >
            {buttonText}
        </button>
    );
}