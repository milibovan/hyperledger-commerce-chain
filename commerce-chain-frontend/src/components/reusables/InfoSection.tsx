import type { InfoSectionProps } from "../../utils/propsUtils";
import { GRID_RESPONSIVE, receiptFontSemibold, SECTION_BORDER } from "../../utils/stylingUtils";

export default function InfoSection({ title, id, label, value, entity, onEntityClick }: InfoSectionProps) {
    return (
        <div>
            <span className="text-xl font-bold text-green-400">{title}</span>
            <div
                className={`grid ${GRID_RESPONSIVE} gap-4 text-gray-300 py-4 ${SECTION_BORDER} cursor-pointer hover:bg-gray-700/50 transition-colors rounded`}
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