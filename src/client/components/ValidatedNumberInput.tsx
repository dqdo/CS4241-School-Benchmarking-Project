import { useState, useEffect } from 'react';

interface ValidatedNumberInputProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    required?: boolean;
    label?: string;
}

export default function ValidatedNumberInput({ name, value, onChange, required = false, label }: ValidatedNumberInputProps) {
    const [error, setError] = useState<string>("");

    //Validate whenever value changes
    useEffect(() => {
        if (value === "") {
            setError("");
            return;
        }

        const hasInvalidChars = /^\d+(\.\d+)?$/.test(value);

        if (!hasInvalidChars) {
            setError("Please enter only valid positive numbers");
            return;
        }

        setError("");
    }, [value]);

    return (
        <div className="flex flex-col">
            {label && (
                <label className="font-medium text-sm mb-1 text-gray-500">
                    {label}
                </label>
            )}
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
                aria-label={label}
            />
            <div className="min-h-[1.25rem] mt-1">
                {error && (
                    <span className="text-red-600 text-xs flex items-center gap-1">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                        {error}
                </span>
                )}
            </div>
        </div>
    );
}