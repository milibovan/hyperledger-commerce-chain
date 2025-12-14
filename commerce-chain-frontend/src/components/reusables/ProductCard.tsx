import { getFormattedDate } from "../../utils/dataTypesUtils";
import type { ProductCardProps } from "../../utils/propsUtils";
import { orderFontBold, orderFontSemibold, receiptFontBold, receiptFontSemibold, traderFontBold, traderFontSemibold } from "../../utils/stylingUtils";

export default function ProductCard({ product, quantity, onClick, colorScheme = "green" }: ProductCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
            e.preventDefault();
            onClick();
        }
    };

    // Determine color classes based on scheme and quantity
    const isOutOfStock = quantity === 0;

    const borderColor = isOutOfStock
        ? "border-red-600"
        : colorScheme === "pink"
            ? "border-pink-400"
            : colorScheme === "indigo"
                ? "border-indigo-400"
                : "border-green-400";

    const shadowColor = colorScheme === "pink"
        ? "hover:shadow-pink-400/50"
        : colorScheme === "indigo"
            ? "hover:shadow-indigo-400/50"
            : "hover:shadow-green-400/50";

    const focusRing = colorScheme === "pink"
        ? "focus:ring-pink-400"
        : colorScheme === "indigo"
            ? "focus:ring-indigo-400"
            : "focus:ring-green-400";


    const quantityStyle = isOutOfStock
        ? "font-bold text-red-600"
        : colorScheme === "pink"
            ? traderFontBold
            : colorScheme === "indigo"
                ? orderFontBold
                : receiptFontBold;

    const titleStyle = colorScheme === "pink" ? traderFontSemibold : colorScheme === "indigo" ? orderFontSemibold : receiptFontSemibold;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`flex items-center justify-between px-4 py-3 bg-gray-700 rounded border ${borderColor} hover:shadow-lg ${shadowColor} hover:bg-gray-600 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 ${focusRing}`}
            aria-label={`View details for ${product.name}`}
        >
            <div className="flex-1">
                <h5 className={titleStyle}>{product.name}</h5>
                <p className="text-xs text-gray-400">ID: {product.id}</p>
            </div>
            <div className="text-right">
                <p className={quantityStyle}>Quantity: {quantity ?? "N/A"}</p>
                <p className="text-xs text-gray-400">
                    Expiry: {getFormattedDate(product["expiry-date"])}
                </p>
            </div>
        </div>
    );
}