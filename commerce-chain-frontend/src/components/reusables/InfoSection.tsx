import type { InfoSectionProps } from "../../utils/propsUtils";
import { GRID_RESPONSIVE, receiptFontSemibold } from "../../utils/stylingUtils";

export default function InfoSection({ title, id, label, value, entity, onEntityClick }: InfoSectionProps) {
    return (
        <div>
            <span className="text-xl font-bold text-green-400">{title}</span>
            <div
                tabIndex={0}
                className={`grid ${GRID_RESPONSIVE} gap-4 text-gray-300 mt-4 py-4 px-2 cursor-pointer hover:bg-gray-500/50 transition-all rounded bg-gray-700 focus:ring-green-400  border-green-400 border focus:outline-none duration-200 focus:ring-2`}
                onClick={() => onEntityClick?.(entity)}
            >
                <div>
                    <span className="text-sm text-gray-400">ID:</span>{" "}
                    <span className={receiptFontSemibold}>{id}</span>
                </div>
                <div>
                    <span className={receiptFontSemibold}>{label}:</span> {value}
                </div>
            </div>
        </div>
    );
}