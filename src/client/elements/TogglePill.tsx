type TogglePillProps = {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
};

export default function TogglePill({ label, value, onChange }: TogglePillProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    value ? "bg-[#0693E3]" : "bg-gray-300"
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        value ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </button>
        </div>
    );
}