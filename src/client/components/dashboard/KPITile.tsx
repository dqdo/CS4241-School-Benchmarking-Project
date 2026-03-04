type KPITileProps = {
    label: string;
    value: string;
    icon?: string;
    accent?: string;
};

export default function KPITile({ label, value, icon, accent = "#0A3E6C" }: KPITileProps) {
    return (
        <div
            className="group relative flex flex-col justify-between bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden"
        >
            {/* Accent bar */}
            <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                style={{ backgroundColor: accent }}
            />

            {/* Icon + Label */}
            <div className="pl-2">
                {icon && <span className="text-xl mb-1 block">{icon}</span>}
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-tight">
                    {label}
                </p>
            </div>

            {/* Value */}
            <div className="pl-2 mt-3">
                <p
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: accent }}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}