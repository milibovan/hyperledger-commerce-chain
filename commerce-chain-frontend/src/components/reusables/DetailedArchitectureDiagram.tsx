import { useState, useEffect } from 'react';
import {
    Database, Shield, Server, Cloud, Activity, BarChart3,
    Zap, HardDrive, Settings,
    Eye, EyeOff, ZoomIn, ZoomOut, RefreshCcw, Layers
} from 'lucide-react';

// Initial Data Configuration
const INITIAL_PODS = {
    ingress: { id: 'ingress', name: 'Ingress Controller', type: 'network', replicas: 2, port: '80/443', color: 'bg-purple-500', x: 50, y: 50, details: 'NGINX Ingress, TLS termination', connections: ['rust-gateway'] },
    'rust-gateway': { id: 'rust-gateway', name: 'Rust API Gateway', type: 'security', replicas: 3, port: '8080', color: 'bg-red-500', x: 50, y: 180, details: 'Routing, CORS, Rate limiting', connections: ['rust-auth', 'backend', 'chaincode'] },
    'rust-auth': { id: 'rust-auth', name: 'Rust Auth Service', type: 'security', replicas: 3, port: '8081', color: 'bg-red-600', x: 250, y: 180, details: 'JWT, User registration', connections: ['postgres-auth'] },
    'rust-kafka-proxy': { id: 'rust-kafka-proxy', name: 'Rust Kafka Proxy', type: 'security', replicas: 2, port: '8082', color: 'bg-red-600', x: 450, y: 180, details: 'Schema validation, Audit', connections: ['kafka-broker'] },
    'extract-tool': { id: 'extract-tool', name: 'Extract Tool', type: 'ingestion', replicas: 2, port: '9090', color: 'bg-green-500', x: 250, y: 50, details: 'REST Poller', connections: ['rust-kafka-proxy'] },
    'batch-loader': { id: 'batch-loader', name: 'Batch Loader', type: 'ingestion', replicas: 1, port: '-', color: 'bg-green-600', x: 450, y: 50, details: 'CronJob, Daily Load', connections: ['hdfs-namenode'] },
    'kafka-broker': { id: 'kafka-broker', name: 'Kafka Broker', type: 'messaging', replicas: 3, port: '9092', color: 'bg-yellow-500', x: 450, y: 300, details: 'Topics: transactions, events', connections: ['kafka-streams'] },
    'kafka-streams': { id: 'kafka-streams', name: 'Stream Processor', type: 'messaging', replicas: 3, port: '-', color: 'bg-yellow-600', x: 450, y: 420, details: 'Real-time aggregations', connections: ['kafka-broker', 'hdfs-datanode', 'mongodb'] },
    'hdfs-namenode': { id: 'hdfs-namenode', name: 'HDFS NameNode', type: 'storage', replicas: 2, port: '9870', color: 'bg-blue-500', x: 650, y: 50, details: 'Metadata, HA', connections: ['hdfs-datanode'] },
    'hdfs-datanode': { id: 'hdfs-datanode', name: 'HDFS DataNode', type: 'storage', replicas: 5, port: '9864', color: 'bg-blue-600', x: 650, y: 180, details: 'Block storage', connections: ['spark-master'] },
    'spark-master': { id: 'spark-master', name: 'Spark Master', type: 'processing', replicas: 1, port: '7077', color: 'bg-orange-500', x: 850, y: 180, details: 'Job scheduling', connections: ['spark-worker'] },
    'spark-worker': { id: 'spark-worker', name: 'Spark Worker', type: 'processing', replicas: 5, port: '8081', color: 'bg-orange-600', x: 850, y: 300, details: 'Executors', connections: ['hdfs-datanode', 'mongodb'] },
    'mongodb': { id: 'mongodb', name: 'MongoDB', type: 'storage', replicas: 3, port: '27017', color: 'bg-teal-500', x: 650, y: 550, details: 'Curated zone storage', connections: ['backend', 'chaincode', 'metabase'] },
    'postgres-auth': { id: 'postgres-auth', name: 'PostgreSQL (Auth)', type: 'storage', replicas: 2, port: '5432', color: 'bg-teal-600', x: 250, y: 300, details: 'User credentials', connections: [] },
    'backend': { id: 'backend', name: 'Backend API', type: 'app', replicas: 4, port: '3000', color: 'bg-indigo-500', x: 50, y: 300, details: 'Business logic', connections: ['mongodb', 'kafka-broker'] },
    'chaincode': { id: 'chaincode', name: 'Chaincode', type: 'app', replicas: 2, port: '7051', color: 'bg-indigo-600', x: 50, y: 420, details: 'Hyperledger Fabric', connections: ['mongodb'] },
    'frontend': { id: 'frontend', name: 'Frontend', type: 'frontend', replicas: 3, port: '80', color: 'bg-pink-500', x: 50, y: 550, details: 'React SPA', connections: ['rust-gateway'] },
    'metabase': { id: 'metabase', name: 'Metabase', type: 'frontend', replicas: 2, port: '3000', color: 'bg-pink-600', x: 250, y: 550, details: 'BI dashboards', connections: ['mongodb'] },
    'airflow-scheduler': { id: 'airflow-scheduler', name: 'Airflow Scheduler', type: 'orchestration', replicas: 2, port: '8793', color: 'bg-purple-600', x: 850, y: 50, details: 'DAG parsing', connections: ['airflow-worker', 'postgres-airflow'] },
    'airflow-worker': { id: 'airflow-worker', name: 'Airflow Worker', type: 'orchestration', replicas: 4, port: '-', color: 'bg-purple-700', x: 1050, y: 50, details: 'Task execution', connections: ['batch-loader', 'spark-master'] },
    'postgres-airflow': { id: 'postgres-airflow', name: 'PostgreSQL (Airflow)', type: 'storage', replicas: 1, port: '5432', color: 'bg-teal-700', x: 850, y: -50, details: 'DAG metadata', connections: [] },
    'redis': { id: 'redis', name: 'Redis', type: 'storage', replicas: 3, port: '6379', color: 'bg-red-700', x: 1050, y: 180, details: 'Cache', connections: [] },
    'prometheus': { id: 'prometheus', name: 'Prometheus', type: 'monitoring', replicas: 1, port: '9090', color: 'bg-yellow-700', x: 1050, y: 420, details: 'Metrics', connections: ['grafana'] },
    'grafana': { id: 'grafana', name: 'Grafana', type: 'monitoring', replicas: 2, port: '3000', color: 'bg-orange-700', x: 1050, y: 550, details: 'Visualization', connections: [] }
};

const NAMESPACES = [
    { id: 'network', label: 'Ingress / Network', color: 'border-purple-500' },
    { id: 'security', label: 'Security (Rust)', color: 'border-red-500' },
    { id: 'ingestion', label: 'Data Ingestion', color: 'border-green-500' },
    { id: 'messaging', label: 'Messaging (Kafka)', color: 'border-yellow-500' },
    { id: 'storage', label: 'Storage / DBs', color: 'border-blue-500' },
    { id: 'processing', label: 'Processing (Spark)', color: 'border-orange-500' },
    { id: 'app', label: 'Application', color: 'border-indigo-500' },
    { id: 'frontend', label: 'Frontend', color: 'border-pink-500' },
    { id: 'orchestration', label: 'Orchestration', color: 'border-purple-700' },
    { id: 'monitoring', label: 'Monitoring', color: 'border-yellow-700' }
];

const InteractiveArchitectureDiagram = () => {
    // --- State Management ---
    const [pods, setPods] = useState(INITIAL_PODS);
    const [selectedPod, setSelectedPod] = useState(null);
    const [visibleNamespaces, setVisibleNamespaces] = useState(
        NAMESPACES.reduce((acc, ns) => ({ ...acc, [ns.id]: true }), {})
    );

    // Viewport State
    const [scale, setScale] = useState(0.8);
    const [offset, setOffset] = useState({ x: 100, y: 100 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Node Dragging State
    const [draggingNode, setDraggingNode] = useState(null);

    // --- Handlers ---

    // Canvas Navigation
    const handleWheel = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const newScale = Math.min(Math.max(0.3, scale - e.deltaY * 0.001), 2);
            setScale(newScale);
        } else {
            setOffset(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    const handleCanvasMouseDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Click
            setIsDraggingCanvas(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    // Node Dragging
    const handleNodeMouseDown = (e, podId) => {
        e.stopPropagation(); // Prevent canvas drag
        setDraggingNode({
            id: podId,
            startX: e.clientX,
            startY: e.clientY,
            initialPodX: pods[podId].x,
            initialPodY: pods[podId].y
        });
        setSelectedPod(podId);
    };

    // Global Mouse Move & Up
    useEffect(() => {
        const handleMouseMove = (e) => {
            // Handle Canvas Pan
            if (isDraggingCanvas) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                setDragStart({ x: e.clientX, y: e.clientY });
                return;
            }

            // Handle Node Drag
            if (draggingNode) {
                const dx = (e.clientX - draggingNode.startX) / scale;
                const dy = (e.clientY - draggingNode.startY) / scale;

                setPods(prev => ({
                    ...prev,
                    [draggingNode.id]: {
                        ...prev[draggingNode.id],
                        x: draggingNode.initialPodX + dx,
                        y: draggingNode.initialPodY + dy
                    }
                }));
            }
        };

        const handleMouseUp = () => {
            setIsDraggingCanvas(false);
            setDraggingNode(null);
        };

        if (isDraggingCanvas || draggingNode) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingCanvas, draggingNode, dragStart, scale]);


    // Helper: Get Icon
    const getIcon = (pod) => {
        if (pod.name.includes('DB') || pod.name.includes('SQL') || pod.name.includes('Mongo')) return <Database size={16} />;
        if (pod.name.includes('Auth') || pod.name.includes('Security')) return <Shield size={16} />;
        if (pod.name.includes('Kafka')) return <Activity size={16} />;
        if (pod.name.includes('HDFS') || pod.name.includes('Storage')) return <HardDrive size={16} />;
        if (pod.name.includes('Spark')) return <Zap size={16} />;
        if (pod.name.includes('Frontend') || pod.name.includes('Metabase')) return <Cloud size={16} />;
        if (pod.name.includes('Prometheus') || pod.name.includes('Grafana')) return <BarChart3 size={16} />;
        return <Server size={16} />;
    };

    // --- Render Components ---

    const ConnectionPath = ({ fromId, toId }) => {
        const from = pods[fromId];
        const to = pods[toId];

        // Don't render if either node is filtered out
        if (!visibleNamespaces[from.type] || !visibleNamespaces[to.type]) return null;

        const startX = from.x + 140; // width of card
        const startY = from.y + 40;  // half height
        const endX = to.x;
        const endY = to.y + 40;

        // Bezier control points for smooth S-curve
        const c1x = startX + (endX - startX) * 0.5;
        const c1y = startY;
        const c2x = endX - (endX - startX) * 0.5;
        const c2y = endY;

        const isHighlighted = selectedPod === fromId || selectedPod === toId;

        return (
            <g>
                {/* Background thick line for easier hover/visibility */}
                <path
                    d={`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
                    fill="none"
                    stroke={isHighlighted ? "#3b82f6" : "#4b5563"}
                    strokeWidth={isHighlighted ? 3 : 1}
                    strokeOpacity={isHighlighted ? 0.8 : 0.3}
                    className="transition-all duration-300 ease-in-out"
                />
                {isHighlighted && (
                    <circle cx={startX} cy={startY} r="3" fill="#3b82f6">
                        <animate attributeName="cx" values={`${startX};${endX}`} dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
                        <animate attributeName="cy" values={`${startY};${endY}`} dur="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
                    </circle>
                )}
            </g>
        );
    };

    return (
        <div className="flex h-screen w-full bg-slate-900 text-white overflow-hidden">

            {/* Sidebar Controls */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl">
                <div className="p-4 border-b border-slate-700">
                    <h2 className="font-bold flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Control Panel
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Drag nodes to rearrange. <br />Alt+Drag to pan canvas.
                    </p>
                </div>

                {/* Visibility Toggles */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Layers
                    </h3>
                    <div className="space-y-2">
                        {NAMESPACES.map(ns => (
                            <div
                                key={ns.id}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${visibleNamespaces[ns.id] ? 'bg-slate-700' : 'bg-slate-900 opacity-50'}`}
                                onClick={() => setVisibleNamespaces(prev => ({ ...prev, [ns.id]: !prev[ns.id] }))}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ns.color.replace('border', 'bg')}`}></div>
                                    <span className="text-sm">{ns.label}</span>
                                </div>
                                {visibleNamespaces[ns.id] ? <Eye size={14} /> : <EyeOff size={14} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Details */}
                <div className="p-4 border-t border-slate-700 bg-slate-800">
                    {selectedPod ? (
                        <div className="animate-in slide-in-from-bottom duration-300">
                            <h3 className="font-bold text-sm mb-1">{pods[selectedPod].name}</h3>
                            <div className="text-xs text-slate-300 mb-2">{pods[selectedPod].details}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-700 p-1 rounded">Replicas: {pods[selectedPod].replicas}</div>
                                <div className="bg-slate-700 p-1 rounded">Port: {pods[selectedPod].port}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500 text-center italic">
                            Select a pod to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Main Canvas Area */}
            <div
                className="flex-1 relative cursor-move overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
            >

                {/* Floating Toolbar */}
                <div className="absolute top-4 right-4 flex gap-2 bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-700 z-30">
                    <button onClick={() => setScale(s => s + 0.1)} className="p-2 hover:bg-slate-700 rounded"><ZoomIn size={18} /></button>
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-2 hover:bg-slate-700 rounded"><ZoomOut size={18} /></button>
                    <div className="w-px bg-slate-600 mx-1"></div>
                    <button onClick={() => { setScale(0.8); setOffset({ x: 100, y: 100 }); }} className="p-2 hover:bg-slate-700 rounded"><RefreshCcw size={18} /></button>
                </div>

                {/* Transformable Canvas Content */}
                <div
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        width: '100%',
                        height: '100%'
                    }}
                    className="relative transition-transform duration-75 ease-out"
                >
                    <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0">
                        {/* Render Connections */}
                        {Object.values(pods).map(pod => (
                            pod.connections.map(targetId => (
                                <ConnectionPath key={`${pod.id}-${targetId}`} fromId={pod.id} toId={targetId} />
                            ))
                        ))}
                    </svg>

                    {/* Render Nodes */}
                    {Object.values(pods).filter(pod => visibleNamespaces[pod.type]).map(pod => (
                        <div
                            key={pod.id}
                            className={`absolute group w-[140px] select-none`}
                            style={{ left: pod.x, top: pod.y }}
                            onMouseDown={(e) => handleNodeMouseDown(e, pod.id)}
                        >
                            {/* Connector Points */}
                            <div className="absolute -left-1 top-10 w-2 h-2 bg-slate-500 rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -right-1 top-10 w-2 h-2 bg-slate-500 rounded-full z-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* The Card */}
                            <div
                                className={`
                  relative z-10 p-3 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-200
                  ${selectedPod === pod.id
                                        ? `border-white ring-2 ring-blue-500 ring-opacity-50 scale-105 z-20`
                                        : `border-slate-600 hover:border-slate-400 bg-slate-800/90`
                                    }
                `}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-1.5 rounded-md text-white ${pod.color}`}>
                                        {getIcon(pod)}
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Healthy"></div>
                                    </div>
                                </div>

                                <div className="font-bold text-xs truncate mb-1">{pod.name}</div>

                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                    <span>x{pod.replicas}</span>
                                    <span>:{pod.port}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
};

export default InteractiveArchitectureDiagram;