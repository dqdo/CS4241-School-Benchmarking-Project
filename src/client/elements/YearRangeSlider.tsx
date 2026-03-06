import { useRef, useCallback, useEffect } from "react";
import { Year } from "../components/admissions/Admissions";

type YearRangeSliderProps = {
    years: Year[];
    yearStart: Year | null;
    yearEnd: Year | null;
    setYearStart: (y: Year) => void;
    setYearEnd: (y: Year) => void;
};

export default function YearRangeSlider({
                                            years,
                                            yearStart,
                                            yearEnd,
                                            setYearStart,
                                            setYearEnd,
                                        }: YearRangeSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<"start" | "end" | null>(null);

    // Sort ascending by display year
    const sorted: Year[] = [...years].sort((a, b) => Number(a.SCHOOL_YEAR) - Number(b.SCHOOL_YEAR));
    const total = sorted.length - 1 || 1;

    const idxOf = (y: Year | null) => {
        if (!y) return total;
        const i = sorted.findIndex(s => s.ID === y.ID);
        return i === -1 ? total : i;
    };

    const startIdx = idxOf(yearStart);
    const endIdx   = idxOf(yearEnd);
    const startPct = (startIdx / total) * 100;
    const endPct   = (endIdx   / total) * 100;

    const pixelToYear = useCallback((clientX: number): Year => {
        const track = trackRef.current;
        if (!track || sorted.length === 0) return sorted[sorted.length - 1];
        const { left, width } = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
        return sorted[Math.round(ratio * total)];
    }, [sorted, total]);

    const handleMove = useCallback((clientX: number) => {
        if (!dragging.current || sorted.length === 0) return;
        const y = pixelToYear(clientX);
        const yi = sorted.findIndex(s => s.ID === y.ID);
        if (dragging.current === "start") {
            if (yi <= endIdx) { setYearStart(y); }
            else { setYearStart(sorted[endIdx]); setYearEnd(y); dragging.current = "end"; }
        } else {
            if (yi >= startIdx) { setYearEnd(y); }
            else { setYearEnd(sorted[startIdx]); setYearStart(y); dragging.current = "start"; }
        }
    }, [pixelToYear, sorted, startIdx, endIdx, setYearStart, setYearEnd]);

    const onMouseMove  = useCallback((e: MouseEvent)  => handleMove(e.clientX), [handleMove]);
    const onTouchMove  = useCallback((e: TouchEvent)  => { e.preventDefault(); handleMove(e.touches[0].clientX); }, [handleMove]);
    const onUp         = useCallback(() => { dragging.current = null; }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup",   onUp);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend",  onUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup",   onUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend",  onUp);
        };
    }, [onMouseMove, onTouchMove, onUp]);

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const y = pixelToYear(e.clientX);
        const yi = sorted.findIndex(s => s.ID === y.ID);
        const ds = Math.abs(yi - startIdx);
        const de = Math.abs(yi - endIdx);
        if (ds <= de) { if (yi <= endIdx)  setYearStart(y); }
        else          { if (yi >= startIdx) setYearEnd(y); }
    };

    if (sorted.length === 0) {
        return (
            <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center text-gray-400 text-sm">
                Loading years…
            </div>
        );
    }

    const single     = yearStart?.ID === yearEnd?.ID;
    const rangeLabel = single
        ? `${yearStart?.SCHOOL_YEAR ?? "—"}`
        : `${yearStart?.SCHOOL_YEAR ?? "—"} – ${yearEnd?.SCHOOL_YEAR ?? "—"}`;
    const labelEvery = Math.ceil(sorted.length / 12);

    return (
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-6 select-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Viewing Period</p>
                    <p className="text-2xl font-bold text-[#0A3E6C]">{rangeLabel}</p>
                </div>
                {!single && yearStart && yearEnd && (
                    <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                        {Number(yearEnd.SCHOOL_YEAR) - Number(yearStart.SCHOOL_YEAR) + 1} years
                    </span>
                )}
            </div>

            {/* Track */}
            <div
                ref={trackRef}
                className="relative h-2 bg-gray-200 rounded-full cursor-pointer mx-3"
                onClick={handleTrackClick}
            >
                {/* Filled range */}
                <div
                    className="absolute h-full bg-[#0A3E6C] rounded-full pointer-events-none"
                    style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
                />

                {/* Start handle — white ring */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-[3px] border-[#0A3E6C] rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-20"
                    style={{ left: `${startPct}%` }}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); dragging.current = "start"; }}
                    onTouchStart={e => { e.preventDefault(); e.stopPropagation(); dragging.current = "start"; }}
                />

                {/* End handle — solid navy */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-[#0A3E6C] border-[3px] border-[#0A3E6C] rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-20"
                    style={{ left: `${endPct}%` }}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); dragging.current = "end"; }}
                    onTouchStart={e => { e.preventDefault(); e.stopPropagation(); dragging.current = "end"; }}
                />
            </div>

            {/* Tick marks + labels */}
            <div className="relative mt-4 mx-3" style={{ height: "28px" }}>
                {sorted.map((y, i) => {
                    const pct      = (i / total) * 100;
                    const inRange  = i >= startIdx && i <= endIdx;
                    const showLbl  = i % labelEvery === 0 || i === total;
                    return (
                        <div key={y.ID} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${pct}%` }}>
                            <div className={`w-px mb-1 ${inRange ? "h-2 bg-[#0A3E6C]" : "h-1.5 bg-gray-300"}`} />
                            {showLbl && (
                                <span className={`text-xs font-medium whitespace-nowrap ${inRange ? "text-[#0A3E6C]" : "text-gray-400"}`}>
                                    {y.SCHOOL_YEAR}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
                Drag handles to select a range · Click the track to snap the nearest handle
            </p>
        </div>
    );
}