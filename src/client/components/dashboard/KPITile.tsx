type KPITileProps = {
    label: string;
    value: string;
    icon?: string;
    accent?: string;
    variant?: "school" | "benchmark";
};

export default function KPITile({ label, value, icon, accent = "#0A3E6C", variant = "school" }: KPITileProps) {
    const isBenchmark = variant === "benchmark";

    return (
        <div
            className={`group relative flex flex-col justify-between rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden border ${
                isBenchmark
                    ? "bg-gray-50 border-dashed border-gray-300"
                    : "bg-white border-gray-100"
            }`}
        >
            {/* Accent bar */}
            <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                style={{ backgroundColor: isBenchmark ? "#9CA3AF" : accent }}
            />

            {/* Benchmark badge */}
            {isBenchmark && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5 leading-none">
                    All Schools
                </span>
            )}

            {/* Icon + Label */}
            <div className="pl-2">
                {icon && <span className="text-xl mb-1 block">{icon}</span>}
                <p className={`text-xs font-medium uppercase tracking-wide leading-tight ${isBenchmark ? "text-gray-400" : "text-gray-400"}`}>
                    {label}
                </p>
            </div>

            {/* Value */}
            <div className="pl-2 mt-3">
                <p
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: isBenchmark ? "#6B7280" : accent }}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}