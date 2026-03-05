import { Tooltip } from 'flowbite-react';
import ChevronUpRight from '../../assets/ChevronUpRight.svg';

type KPITileProps = {
    label: string;
    value: string;
    icon?: string;
    accent?: string;
    variant?: "school" | "benchmark";
    tooltip?: string;
    onClick?: () => void;
};

export default function KPITile({ label, value, icon, accent = "#0A3E6C", variant = "school", tooltip, onClick }: KPITileProps) {
    const isBenchmark = variant === "benchmark";
    const isClickable = !!onClick;

    return (
        <div
            className={`group relative flex flex-col justify-between rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border z-0 hover:z-50 ${
                isClickable ? "cursor-pointer" : "cursor-default"
            } ${
                isBenchmark
                    ? "bg-gray-50 border-dashed border-gray-300"
                    : "bg-white border-gray-100"
            }`}
            onClick={onClick}
        >
            {/* Accent bar */}
            <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                style={{ backgroundColor: isBenchmark ? "#9CA3AF" : accent }}
            />

            {/* Icon + Label row */}
            <div className="pl-2 flex items-start justify-between gap-1">
                <div>
                    {icon && <span className="text-xl mb-1 block">{icon}</span>}
                    <p className="text-xs font-medium uppercase tracking-wide leading-tight text-gray-400">
                        {label}
                    </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {/* Info icon with flowbite tooltip */}
                    {tooltip && (
                        <Tooltip
                            content={<span className="block w-56 text-xs leading-relaxed whitespace-normal">{tooltip}</span>}
                            placement="bottom"
                            style="light"
                            arrow={false}
                        >
                            <svg
                                width="15px" height="15px" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="cursor-help text-gray-300 hover:text-gray-500 transition-colors"
                                onClick={e => e.stopPropagation()}
                            >
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="12" y="8" width="0.01" height="0.01" stroke="currentColor" strokeWidth="3.75" strokeLinejoin="round" />
                                <path d="M12 12V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Tooltip>
                    )}

                    {/* Navigate arrow — only shown when clickable */}
                    {isClickable && (
                        <img src={ChevronUpRight} alt="" className="w-3 h-3 opacity-30 group-hover:opacity-60 transition-opacity" />
                    )}
                </div>
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

            {/* Benchmark badge */}
            {isBenchmark && (
                <span className="mt-2 self-start ml-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5 leading-none">
                    All Schools
                </span>
            )}
        </div>
    );
}