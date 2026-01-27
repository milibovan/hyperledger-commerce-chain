import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
    Database, Shield, Server, Activity, BarChart3,
    Zap, HardDrive, ZoomIn, ZoomOut,
    RefreshCcw, Gauge, Network,
    Workflow, Bell, TrendingUp, Container, Globe, Radio, Search,
    MoveHorizontal, Eye, EyeOff, X
} from 'lucide-react';

// --- UPDATED CONFIGURATION (Spark replaced by Flink Batch) ---
const INITIAL_PODS = {
    ingress: { id: 'ingress', name: 'NGINX Ingress', type: 'network', replicas: 2, port: '80/443', color: 'bg-purple-500', x: 50, y: 50, details: 'TLS termination, Load balancing', connections: ['gateway'] },
    gateway: { id: 'gateway', name: 'API Gateway', type: 'security', replicas: 3, port: '8080', color: 'bg-red-500', x: 50, y: 180, details: 'Rust - Routing, Rate limiting, Auth middleware', connections: ['auth-service', 'backend', 'redis'] },
    'auth-service': { id: 'auth-service', name: 'Auth Service', type: 'security', replicas: 3, port: '8081', color: 'bg-red-600', x: 280, y: 180, details: 'Rust - JWT, Registration, Login', connections: ['postgres-auth', 'redis', 'kafka-broker'] },
    'email-service': { id: 'email-service', name: 'Email Service', type: 'notification', replicas: 2, port: '8082', color: 'bg-cyan-500', x: 280, y: 50, details: 'Rust - Kafka consumer, SMTP sender', connections: ['kafka-broker'] },
    'notification-service': { id: 'notification-service', name: 'Notification Service', type: 'notification', replicas: 2, port: '8083', color: 'bg-cyan-600', x: 510, y: 50, details: 'WebSocket server, Push notifications', connections: ['kafka-broker', 'postgres-notif'] },
    'faker-generator': { id: 'faker-generator', name: 'Data Generator', type: 'ingestion', replicas: 1, port: '9090', color: 'bg-green-500', x: 740, y: 50, details: 'Python - 300MB+ historical data', connections: ['backend', 'hdfs-namenode'] },
    'realtime-generator': { id: 'realtime-generator', name: 'RT Event Generator', type: 'ingestion', replicas: 2, port: '9091', color: 'bg-green-600', x: 970, y: 50, details: 'Python/Node - Live trading events', connections: ['kafka-broker'] },
    'kafka-connect': { id: 'kafka-connect', name: 'Kafka Connect', type: 'ingestion', replicas: 3, port: '8083', color: 'bg-green-700', x: 970, y: 180, details: 'HDFS Sink connector', connections: ['kafka-broker', 'hdfs-namenode'] },
    'kafka-broker': { id: 'kafka-broker', name: 'Kafka Cluster', type: 'messaging', replicas: 3, port: '9092', color: 'bg-yellow-500', x: 740, y: 300, details: 'Message broker, Event streaming', connections: ['schema-registry', 'flink-job'] },
    'schema-registry': { id: 'schema-registry', name: 'Schema Registry', type: 'messaging', replicas: 2, port: '8081', color: 'bg-yellow-600', x: 970, y: 300, details: 'Avro schema management', connections: [] },
    'hdfs-namenode': { id: 'hdfs-namenode', name: 'HDFS NameNode', type: 'datalake', replicas: 2, port: '9870', color: 'bg-blue-500', x: 1200, y: 50, details: 'HDFS metadata, HA setup', connections: ['hdfs-datanode'] },
    'hdfs-datanode': { id: 'hdfs-datanode', name: 'HDFS DataNode', type: 'datalake', replicas: 5, port: '9864', color: 'bg-blue-600', x: 1200, y: 180, details: 'Raw/Transform/Curated zones', connections: ['flink-batch-master'] },

    // Flink Stream Layer
    'flink-jobmanager': { id: 'flink-jobmanager', name: 'Flink Stream Master', type: 'stream', replicas: 1, port: '8081', color: 'bg-orange-500', x: 740, y: 450, details: 'Flink JobManager (Streaming)', connections: ['flink-taskmanager'] },
    'flink-taskmanager': { id: 'flink-taskmanager', name: 'Flink Stream Worker', type: 'stream', replicas: 4, port: '6121', color: 'bg-orange-600', x: 970, y: 450, details: 'TaskManagers (Streaming)', connections: ['elasticsearch', 'timescaledb'] },
    'flink-job': { id: 'flink-job', name: 'Flink Stream Jobs', type: 'stream', replicas: 5, port: '-', color: 'bg-orange-700', x: 740, y: 580, details: 'Real-time windowing & enrichment', connections: ['flink-jobmanager', 'kafka-broker'] },

    // Flink Batch Layer (Replaced Spark)
    'flink-batch-master': { id: 'flink-batch-master', name: 'Flink Batch Master', type: 'batch', replicas: 1, port: '8082', color: 'bg-amber-500', x: 1430, y: 180, details: 'Flink JobManager (Batch processing)', connections: ['flink-batch-worker'] },
    'flink-batch-worker': { id: 'flink-batch-worker', name: 'Flink Batch Worker', type: 'batch', replicas: 5, port: '6122', color: 'bg-amber-600', x: 1430, y: 310, details: 'TaskManagers (Batch analytics)', connections: ['hdfs-datanode', 'postgres-curated'] },

    'postgres-auth': { id: 'postgres-auth', name: 'PostgreSQL Auth', type: 'storage', replicas: 2, port: '5432', color: 'bg-teal-500', x: 50, y: 310, details: 'User credentials, sessions', connections: [] },
    'postgres-notif': { id: 'postgres-notif', name: 'PostgreSQL Notif', type: 'storage', replicas: 1, port: '5432', color: 'bg-teal-600', x: 280, y: 310, details: 'Notification history', connections: [] },
    'postgres-curated': { id: 'postgres-curated', name: 'PostgreSQL Analytics', type: 'storage', replicas: 2, port: '5432', color: 'bg-teal-700', x: 1430, y: 450, details: 'Curated analytics data', connections: [] },
    'redis': { id: 'redis', name: 'Redis Cluster', type: 'storage', replicas: 3, port: '6379', color: 'bg-red-700', x: 50, y: 450, details: 'Session cache, Rate limiting', connections: [] },
    'couchdb': { id: 'couchdb', name: 'CouchDB', type: 'storage', replicas: 3, port: '5984', color: 'bg-teal-800', x: 280, y: 710, details: 'Fabric state database', connections: [] },
    'elasticsearch': { id: 'elasticsearch', name: 'Elasticsearch', type: 'storage', replicas: 3, port: '9200', color: 'bg-blue-700', x: 970, y: 580, details: 'Search, Alerts, Audit logs', connections: [] },
    'timescaledb': { id: 'timescaledb', name: 'TimescaleDB', type: 'storage', replicas: 2, port: '5432', color: 'bg-blue-800', x: 1200, y: 450, details: 'Time-series metrics', connections: [] },
    'backend': { id: 'backend', name: 'Backend API', type: 'app', replicas: 4, port: '3000', color: 'bg-indigo-500', x: 50, y: 580, details: 'Business logic, REST API', connections: ['fabric-peer', 'kafka-broker', 'audit-service'] },
    'fabric-peer': { id: 'fabric-peer', name: 'Fabric Peers', type: 'app', replicas: 6, port: '7051', color: 'bg-indigo-600', x: 50, y: 710, details: '3 Orgs x 2 peers, Chaincode', connections: ['couchdb', 'fabric-orderer'] },
    'fabric-orderer': { id: 'fabric-orderer', name: 'Fabric Orderer', type: 'app', replicas: 3, port: '7050', color: 'bg-indigo-700', x: 50, y: 840, details: 'Raft consensus', connections: [] },
    'audit-service': { id: 'audit-service', name: 'Audit Service', type: 'app', replicas: 2, port: '8084', color: 'bg-indigo-800', x: 280, y: 580, details: 'Transaction tracking, Fabric events', connections: ['elasticsearch', 'fabric-peer'] },
    'frontend': { id: 'frontend', name: 'Frontend SPA', type: 'frontend', replicas: 3, port: '80', color: 'bg-pink-500', x: 50, y: 970, details: 'React, WebSocket client', connections: ['gateway'] },
    'superset': { id: 'superset', name: 'Apache Superset', type: 'visualization', replicas: 2, port: '8088', color: 'bg-pink-600', x: 1430, y: 580, details: 'BI dashboards, 3+ visualizations', connections: ['postgres-curated', 'timescaledb', 'elasticsearch'] },
    'superset-worker': { id: 'superset-worker', name: 'Superset Worker', type: 'visualization', replicas: 3, port: '-', color: 'bg-pink-700', x: 1430, y: 710, details: 'Celery workers', connections: ['redis'] },
    'airflow-scheduler': { id: 'airflow-scheduler', name: 'Airflow Scheduler', type: 'orchestration', replicas: 2, port: '8793', color: 'bg-purple-600', x: 1660, y: 50, details: 'DAG parsing, Task scheduling', connections: ['airflow-worker', 'postgres-airflow'] },
    'airflow-worker': { id: 'airflow-worker', name: 'Airflow Worker', type: 'orchestration', replicas: 4, port: '-', color: 'bg-purple-700', x: 1890, y: 50, details: 'Task execution', connections: ['flink-batch-master', 'hdfs-datanode'] },
    'airflow-webserver': { id: 'airflow-webserver', name: 'Airflow Web', type: 'orchestration', replicas: 2, port: '8080', color: 'bg-purple-800', x: 1660, y: 180, details: 'Web UI', connections: ['postgres-airflow'] },
    'postgres-airflow': { id: 'postgres-airflow', name: 'PostgreSQL Airflow', type: 'storage', replicas: 1, port: '5432', color: 'bg-teal-900', x: 1660, y: 310, details: 'Metadata, DAG state', connections: [] },
    'prometheus': { id: 'prometheus', name: 'Prometheus', type: 'monitoring', replicas: 2, port: '9090', color: 'bg-yellow-700', x: 1660, y: 450, details: 'Metrics collection', connections: ['grafana', 'alertmanager'] },
    'grafana': { id: 'grafana', name: 'Grafana', type: 'monitoring', replicas: 2, port: '3000', color: 'bg-orange-800', x: 1660, y: 580, details: 'Dashboards, Visualization', connections: ['prometheus', 'loki'] },
    'loki': { id: 'loki', name: 'Loki', type: 'monitoring', replicas: 1, port: '3100', color: 'bg-orange-900', x: 1660, y: 710, details: 'Log aggregation', connections: [] },
    'promtail': { id: 'promtail', name: 'Promtail', type: 'monitoring', replicas: 1, port: '-', color: 'bg-yellow-800', x: 1890, y: 710, details: 'DaemonSet - Log shipper', connections: ['loki'] },
    'alertmanager': { id: 'alertmanager', name: 'Alertmanager', type: 'monitoring', replicas: 1, port: '9093', color: 'bg-red-800', x: 1890, y: 450, details: 'Alert routing, Notifications', connections: [] }
};

const NAMESPACES = [
    { id: 'network', label: 'Network / Ingress', color: 'border-purple-500', icon: Network },
    { id: 'security', label: 'Security (Rust)', color: 'border-red-500', icon: Shield },
    { id: 'notification', label: 'Notifications', color: 'border-cyan-500', icon: Bell },
    { id: 'ingestion', label: 'Data Ingestion', color: 'border-green-500', icon: TrendingUp },
    { id: 'messaging', label: 'Messaging (Kafka)', color: 'border-yellow-500', icon: Activity },
    { id: 'datalake', label: 'Data Lake (HDFS)', color: 'border-blue-500', icon: HardDrive },
    { id: 'stream', label: 'Flink (Streaming)', color: 'border-orange-500', icon: Radio },
    { id: 'batch', label: 'Flink (Batch Processing)', color: 'border-amber-500', icon: Zap },
    { id: 'storage', label: 'Storage / Databases', color: 'border-teal-500', icon: Database },
    { id: 'app', label: 'Application (Fabric)', color: 'border-indigo-500', icon: Server },
    { id: 'frontend', label: 'Frontend', color: 'border-pink-500', icon: Globe },
    { id: 'visualization', label: 'Visualization (Superset)', color: 'border-pink-600', icon: BarChart3 },
    { id: 'orchestration', label: 'Orchestration (Airflow)', color: 'border-purple-700', icon: Workflow },
    { id: 'monitoring', label: 'Monitoring (Prometheus)', color: 'border-yellow-700', icon: Gauge }
];

// --- MEMOIZED HELPERS ---

const ConnectionLine = memo(({ from, to, isHighlighted, isDimmed }) => {
    if (!from || !to) return null;
    const startX = from.x + 150;
    const startY = from.y + 40;
    const endX = to.x;
    const endY = to.y + 40;
    const pathData = `M ${startX} ${startY} C ${startX + (endX - startX) * 0.4} ${startY}, ${endX - (endX - startX) * 0.4} ${endY}, ${endX} ${endY}`;

    return (
        <g className="transition-all duration-300" style={{ opacity: isDimmed ? 0.1 : 1 }}>
            <path d={pathData} fill="none" stroke={isHighlighted ? "#60a5fa" : "#334155"} strokeWidth={isHighlighted ? 3 : 1} className="transition-all duration-300" />
            {isHighlighted && (
                <circle r="3" fill="#60a5fa">
                    <animateMotion path={pathData} dur="1.5s" repeatCount="indefinite" />
                </circle>
            )}
        </g>
    );
});

const PodNode = memo(({ pod, isDimmed, isSelected, onMouseDown, onHide, getIcon }) => (
    <div
        className={`absolute group w-[150px] select-none transition-all duration-300 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
        style={{ left: pod.x, top: pod.y, zIndex: isSelected ? 50 : 10 }}
        onMouseDown={(e) => onMouseDown(e, pod.id)}
    >
        <div className={`relative p-3 rounded-lg shadow-xl border backdrop-blur-sm transition-all duration-200 ${isSelected ? 'border-blue-400 ring-2 ring-blue-500/50 scale-105 bg-slate-800' : 'border-slate-600 bg-slate-800/90'}`}>
            {/* Hide button - only visible on hover or when selected */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onHide(pod.id);
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Hide this pod"
            >
                <EyeOff size={12} className="text-white" />
            </button>

            <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded-md text-white ${pod.color} shadow-lg`}>{getIcon(pod)}</div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="font-bold text-[11px] truncate mb-1.5">{pod.name}</div>
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span className="flex items-center gap-1"><Server size={10} /> {pod.replicas}x</span>
                <span className="truncate ml-1">{pod.port}</span>
            </div>
        </div>
    </div>
));

// --- MAIN ARCHITECTURE COMPONENT ---

const InteractiveArchitectureDiagram = () => {
    const [pods, setPods] = useState(INITIAL_PODS);
    const [selectedPod, setSelectedPod] = useState(null);
    const [hiddenPods, setHiddenPods] = useState(new Set());
    const [visibleNamespaces, setVisibleNamespaces] = useState(NAMESPACES.reduce((acc, ns) => ({ ...acc, [ns.id]: true }), {}));
    const [scale, setScale] = useState(0.5);
    const [offset, setOffset] = useState({ x: 100, y: 100 });
    const [draggingNode, setDraggingNode] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // --- KEYBOARD NAVIGATION (Left/Right/Up/Down + Escape to deselect) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const step = 40;
            switch (e.key) {
                case 'ArrowRight': case 'd': setOffset(o => ({ ...o, x: o.x - step })); break;
                case 'ArrowLeft': case 'a': setOffset(o => ({ ...o, x: o.x + step })); break;
                case 'ArrowUp': case 'w': setOffset(o => ({ ...o, y: o.y + step })); break;
                case 'ArrowDown': case 's': setOffset(o => ({ ...o, y: o.y - step })); break;
                case 'Escape': setSelectedPod(null); break;
                default: break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const activeConnections = useMemo(() => {
        if (!selectedPod) return new Set();
        const connections = new Set([selectedPod]);
        pods[selectedPod]?.connections?.forEach(id => connections.add(id));
        Object.values(pods).forEach(p => { if (p.connections.includes(selectedPod)) connections.add(p.id); });
        return connections;
    }, [selectedPod, pods]);

    // Focus Camera on Node
    const focusOnNode = (id) => {
        setSelectedPod(id);
        const pod = pods[id];
        const container = document.getElementById('canvas-container');
        if (container) {
            const centerX = container.clientWidth / 2;
            const centerY = container.clientHeight / 2;
            setOffset({
                x: centerX - (pod.x * scale),
                y: centerY - (pod.y * scale)
            });
        }
    };

    const handleNodeMouseDown = useCallback((e, podId) => {
        e.stopPropagation();
        setSelectedPod(podId);
        setDraggingNode({ id: podId, startX: e.clientX, startY: e.clientY, initialPodX: pods[podId].x, initialPodY: pods[podId].y });
    }, [pods]);

    // Handle canvas click to deselect
    const handleCanvasClick = useCallback((e) => {
        if (e.target.id === 'canvas-container' || e.target.closest('svg')) {
            setSelectedPod(null);
        }
    }, []);

    // Hide pod
    const handleHidePod = useCallback((podId) => {
        setHiddenPods(prev => new Set([...prev, podId]));
        if (selectedPod === podId) {
            setSelectedPod(null);
        }
    }, [selectedPod]);

    // Show pod
    const handleShowPod = useCallback((podId) => {
        setHiddenPods(prev => {
            const newSet = new Set(prev);
            newSet.delete(podId);
            return newSet;
        });
    }, []);

    // Show all pods
    const handleShowAllPods = useCallback(() => {
        setHiddenPods(new Set());
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggingNode) {
                const dx = (e.clientX - draggingNode.startX) / scale;
                const dy = (e.clientY - draggingNode.startY) / scale;
                setPods(prev => ({ ...prev, [draggingNode.id]: { ...prev[draggingNode.id], x: draggingNode.initialPodX + dx, y: draggingNode.initialPodY + dy } }));
            }
        };
        const handleMouseUp = () => setDraggingNode(null);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [draggingNode, scale]);

    const getIcon = (pod) => {
        const name = pod.name.toLowerCase();
        if (name.includes('db') || name.includes('postgres')) return <Database size={14} />;
        if (name.includes('flink')) return <Radio size={14} />;
        if (name.includes('kafka')) return <Activity size={14} />;
        if (name.includes('auth')) return <Shield size={14} />;
        if (name.includes('airflow')) return <Workflow size={14} />;
        return <Server size={14} />;
    };

    const filteredPods = Object.values(pods).filter(pod =>
        visibleNamespaces[pod.type] &&
        !hiddenPods.has(pod.id) &&
        (searchQuery === '' || pod.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const hiddenPodsList = Object.values(pods).filter(pod => hiddenPods.has(pod.id));

    return (
        <div className="flex h-screen w-full bg-[#020617] text-slate-200 overflow-hidden">
            {/* Sidebar with Auto-Focus interaction */}
            <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4">
                        <Container className="w-6 h-6 text-orange-400" />
                        <div>
                            <h1 className="font-bold text-lg">Flink Ecosystem</h1>
                            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Streaming & Batch Cluster</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" placeholder="Search and Jump to Pod..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                </div>

                {/* Deselect Button */}
                {selectedPod && (
                    <div className="p-4 border-b border-slate-800 bg-orange-500/10">
                        <button
                            onClick={() => setSelectedPod(null)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X size={16} />
                            Deselect Pod
                        </button>
                    </div>
                )}

                {/* Hidden Pods Section */}
                {hiddenPodsList.length > 0 && (
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <EyeOff size={12} />
                                Hidden Pods ({hiddenPodsList.length})
                            </h3>
                            <button
                                onClick={handleShowAllPods}
                                className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
                            >
                                Show All
                            </button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {hiddenPodsList.map(pod => (
                                <button
                                    key={pod.id}
                                    onClick={() => handleShowPod(pod.id)}
                                    className="w-full flex items-center justify-between p-2 rounded text-xs hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    <span className="truncate">{pod.name}</span>
                                    <Eye size={12} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Visible Pods List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Visible Pods</h3>
                    {Object.values(pods)
                        .filter(p => !hiddenPods.has(p.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(pod => (
                            <button
                                key={pod.id}
                                onClick={() => focusOnNode(pod.id)}
                                className={`w-full text-left p-2 rounded text-xs transition-colors ${selectedPod === pod.id
                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                    : 'hover:bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {pod.name}
                            </button>
                        ))
                    }
                </div>
            </aside>

            {/* Main Canvas */}
            <main
                id="canvas-container"
                className="flex-1 relative bg-[#020617] cursor-crosshair"
                onClick={handleCanvasClick}
            >
                {/* Keyboard Controls Legend */}
                <div className="absolute top-6 left-6 z-30 bg-slate-900/90 p-4 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-orange-400 font-bold text-xs uppercase"><MoveHorizontal size={14} /> Navigation</div>
                    <div className="space-y-1">
                        <div className="flex gap-2">
                            <div className="bg-slate-800 p-2 rounded text-[10px] border border-slate-700 font-mono">ARROWS / WASD</div>
                            <div className="flex items-center text-[10px] text-slate-500">Move Viewport</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-slate-800 p-2 rounded text-[10px] border border-slate-700 font-mono">ESC</div>
                            <div className="flex items-center text-[10px] text-slate-500">Deselect Pod</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-slate-800 p-2 rounded text-[10px] border border-slate-700 font-mono">HOVER + CLICK X</div>
                            <div className="flex items-center text-[10px] text-slate-500">Hide Pod</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="absolute top-6 right-6 flex items-center gap-2 z-30">
                    <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800"><ZoomIn size={18} /></button>
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800"><ZoomOut size={18} /></button>
                    <button onClick={() => { setScale(0.5); setOffset({ x: 100, y: 100 }); }} className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800"><RefreshCcw size={18} /></button>
                </div>

                <div className="absolute inset-0 transition-all duration-150 ease-out" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none">
                        {Object.values(pods).map(pod =>
                            pod.connections.map(targetId => {
                                // Only show connections if both pods are visible
                                if (hiddenPods.has(pod.id) || hiddenPods.has(targetId)) return null;
                                return (
                                    <ConnectionLine
                                        key={`${pod.id}-${targetId}`}
                                        from={pod}
                                        to={pods[targetId]}
                                        isHighlighted={activeConnections.has(pod.id) && activeConnections.has(targetId)}
                                        isDimmed={activeConnections.size > 0 && (!activeConnections.has(pod.id) || !activeConnections.has(targetId))}
                                    />
                                );
                            })
                        )}
                    </svg>

                    {filteredPods.map(pod => (
                        <PodNode
                            key={pod.id}
                            pod={pod}
                            getIcon={getIcon}
                            onMouseDown={handleNodeMouseDown}
                            onHide={handleHidePod}
                            isSelected={selectedPod === pod.id}
                            isDimmed={activeConnections.size > 0 && !activeConnections.has(pod.id)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default InteractiveArchitectureDiagram;