import { Tooltip } from 'flowbite-react';

interface TooltipInputProps {
    label: string;
    tooltipText: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    required?: boolean;
}

export default function TooltipInput({ label, tooltipText, name, value, onChange, required = false }: TooltipInputProps) {
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
                type="number"
                name={name}
                value={value}
                onChange={onChange}
                className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0693E3]"
                required={required}
            />
        </div>
    );
}