import { Tooltip } from 'flowbite-react';
import { useState, useEffect } from 'react';

interface TooltipInputProps {
    label: string;
    tooltipText: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    required?: boolean;
}

export default function TooltipInput({ label, tooltipText, name, value, onChange, required = false }: TooltipInputProps) {
    const [error, setError] = useState<string>("");

    //Validate whenever value changes
    useEffect(() => {
        if (!value || value === "") {
            setError("");
            return;
        }

        //Check for non-numeric characters, except minus and decimal at valid positions
        const hasLetters = /[a-zA-Z]/.test(value);
        const hasInvalidChars = /[^0-9.\-]/.test(value);

        if (hasLetters || hasInvalidChars) {
            setError("Please enter only numbers");
            return;
        }

        //Check for multiple minus signs or minus not at the start
        const minusCount = (value.match(/-/g) || []).length;
        if (minusCount > 1) {
            setError("Invalid format: too many minus signs");
            return;
        }
        if (minusCount === 1 && !value.startsWith('-')) {
            setError("Minus sign must be at the beginning");
            return;
        }

        //Check for negative numbers
        if (value.startsWith('-')) {
            setError("Value cannot be negative");
            return;
        }

        //Check for decimals
        if (value.includes('.')) {
            setError("Please enter a whole number");
            return;
        }

        //Check if it's a valid number after all string checks
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setError("Please enter a valid number");
            return;
        }

        //Clear error if all validations pass
        setError("");
    }, [value]);

    return (
        <div className="flex flex-col">
            <span className="text-sm font-semibold flex flex-row gap-2">
                <label className="font-semibold text-sm mb-1">{label}</label>
                <Tooltip content={tooltipText} placement="top" style="light" arrow={false}>
                    <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-help">
                        <g clipPath="url(#clip0_429_11160)">
                            <circle cx="12" cy="11.9999" r="9" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="12" y="8" width="0.01" height="0.01" stroke="#292929" strokeWidth="3.75" strokeLinejoin="round" />
                            <path d="M12 12V16" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </svg>
                </Tooltip>
            </span>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className={`border rounded p-2 focus:outline-none focus:ring-2 ${
                    error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-[#0693E3]'
                }`}
                required={required}
                inputMode="numeric"
                pattern="[0-9]*"
            />
            {error && (
                <span className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </span>
            )}
        </div>
    );
}