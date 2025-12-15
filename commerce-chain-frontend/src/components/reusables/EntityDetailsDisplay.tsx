import type { FieldConfig } from "../../utils/dataTypesUtils";
import type { EntityDetailsDisplayProps } from "../../utils/propsUtils";

export default function EntityDetailsDisplay({
    title,
    titleColor,
    labelColor,
    fields,
    columns = 2,
    hasBorder = false,
    borderColor,
}: EntityDetailsDisplayProps) {
    const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';
    const borderClass = hasBorder && borderColor
        ? `pb-4 border-b-2 ${borderColor}`
        : '';

    const renderValue = (field: FieldConfig) => {
        if (field.formatter) {
            return field.formatter(field.value);
        }
        if (field.value instanceof Date) {
            return field.value.toISOString();
        }
        return field.value;
    };

    return (
        <>
            <h3 className={`text-2xl font-bold ${titleColor}`}>{title}</h3>
            <div className={`grid ${gridCols} gap-4 text-gray-300 ${borderClass}`}>
                {fields.map((field, index) => (
                    <div key={index}>
                        <span className={`font-semibold ${labelColor}`}>{field.label}:</span>{' '}
                        {renderValue(field)}
                    </div>
                ))}
            </div>
        </>
    );
}