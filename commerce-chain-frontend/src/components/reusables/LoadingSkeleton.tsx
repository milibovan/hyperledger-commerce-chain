export default function LoadingSkeleton() {
    return (
        <div className="space-y-2">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-20 bg-gray-700 rounded border border-green-400 animate-pulse"
                />
            ))}
        </div>
    );
}