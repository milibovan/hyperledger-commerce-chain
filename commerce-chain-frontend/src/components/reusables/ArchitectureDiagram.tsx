import { useState } from 'react';
import { Database, Shield, Boxes, Server, Cloud, Activity, BarChart3, GitBranch, Lock, FileText, Zap, HardDrive, Layers, Workflow, Container } from 'lucide-react';

const ArchitectureDiagram = () => {
    const [hoveredComponent, setHoveredComponent] = useState(null);

    const components = {
        sources: [
            { id: 'source1', name: 'SOURCE I', subtitle: 'Real-time Events', icon: Activity, color: 'bg-yellow-200', desc: 'Transaction stream, User activity' },
            { id: 'source2', name: 'SOURCE II', subtitle: 'Batch Data', icon: Database, color: 'bg-yellow-200', desc: 'Customer DB exports, Historical data' }
        ],
        ingestion: [
            { id: 'extract', name: 'Extract Tool', subtitle: 'Python/Bash', icon: GitBranch, color: 'bg-green-200', desc: 'Data extraction from sources' },
            { id: 'batchloader', name: 'Batch Loader', subtitle: 'Python', icon: FileText, color: 'bg-green-200', desc: 'Large volume imports' }
        ],
        security: [
            { id: 'rust-auth', name: 'Auth Service', subtitle: 'RUST', icon: Shield, color: 'bg-red-300', desc: 'JWT, Registration, Login' },
            { id: 'rust-proxy', name: 'Kafka Proxy', subtitle: 'RUST', icon: Lock, color: 'bg-red-300', desc: 'Schema validation, Rate limiting' },
            { id: 'rust-gateway', name: 'API Gateway', subtitle: 'RUST', icon: Shield, color: 'bg-red-300', desc: 'Request routing, CORS, TLS' }
        ],
        messaging: [
            { id: 'kafka', name: 'Kafka', subtitle: 'Message Queue', icon: Zap, color: 'bg-green-300', desc: 'Event streaming platform' },
            { id: 'streams', name: 'Stream Processing', subtitle: 'KStreams', icon: Activity, color: 'bg-green-300', desc: 'Real-time transformations' }
        ],
        storage: [
            { id: 'hdfs-raw', name: 'HDFS Raw', subtitle: 'Raw Zone', icon: HardDrive, color: 'bg-blue-200', desc: 'Unprocessed data' },
            { id: 'hdfs-trans', name: 'HDFS Trans', subtitle: 'Transformation', icon: HardDrive, color: 'bg-blue-300', desc: 'Intermediate processing' },
            { id: 'mongodb', name: 'MongoDB/CITUS', subtitle: 'Curated Zone', icon: Database, color: 'bg-blue-400', desc: 'Production-ready data' }
        ],
        processing: [
            { id: 'transformer', name: 'Transformer', subtitle: 'Spark/Hadoop', icon: Layers, color: 'bg-green-400', desc: 'ETL jobs, Aggregations' }
        ],
        backend: [
            { id: 'backend', name: 'Backend', subtitle: 'Golang', icon: Server, color: 'bg-purple-300', desc: 'Business logic' },
            { id: 'chaincode', name: 'Chaincode', subtitle: 'Blockchain', icon: Boxes, color: 'bg-purple-300', desc: 'Smart contracts' }
        ],
        frontend: [
            { id: 'frontend', name: 'Frontend', subtitle: 'React', icon: Activity, color: 'bg-purple-200', desc: 'User interface' },
            { id: 'dashboard', name: 'Dashboard', subtitle: 'Metabase/Superset/Grafana', icon: BarChart3, color: 'bg-purple-200', desc: 'Analytics & BI' }
        ],
        infrastructure: [
            { id: 'docker', name: 'Docker', subtitle: 'Containers', icon: Container, color: 'bg-orange-200', desc: 'Containerization' },
            { id: 'k8s', name: 'Kubernetes', subtitle: 'Orchestration', icon: Cloud, color: 'bg-orange-300', desc: 'Container management' },
            { id: 'terraform', name: 'Terraform', subtitle: 'IaC', icon: Workflow, color: 'bg-orange-400', desc: 'Infrastructure provisioning' },
            { id: 'airflow', name: 'Airflow', subtitle: 'Workflow', icon: Workflow, color: 'bg-orange-200', desc: 'Job scheduling' }
        ]
    };

    // const connections = [
    //     // Sources to Ingestion
    //     { from: 'source1', to: 'extract', label: 'Events' },
    //     { from: 'source2', to: 'batchloader', label: 'Bulk Data' },

    //     // Ingestion to Security
    //     { from: 'extract', to: 'rust-proxy', label: 'Validate' },

    //     // Security to Messaging
    //     { from: 'rust-proxy', to: 'kafka', label: 'Secure' },

    //     // Kafka to Processing
    //     { from: 'kafka', to: 'streams', label: 'Stream' },

    //     // Stream Processing to Storage
    //     { from: 'streams', to: 'hdfs-raw', label: 'Write' },
    //     { from: 'streams', to: 'mongodb', label: 'Curated' },

    //     // Batch to Storage
    //     { from: 'batchloader', to: 'hdfs-raw', label: 'Load' },

    //     // Raw to Transformation
    //     { from: 'hdfs-raw', to: 'transformer', label: 'Process' },
    //     { from: 'transformer', to: 'hdfs-trans', label: 'Store' },
    //     { from: 'hdfs-trans', to: 'transformer', label: 'Iterate' },
    //     { from: 'transformer', to: 'mongodb', label: 'Final' },

    //     // Backend connections
    //     { from: 'rust-auth', to: 'backend', label: 'Auth' },
    //     { from: 'rust-auth', to: 'chaincode', label: 'Auth' },
    //     { from: 'mongodb', to: 'backend', label: 'Query' },
    //     { from: 'mongodb', to: 'chaincode', label: 'Query' },

    //     // Frontend connections
    //     { from: 'frontend', to: 'rust-gateway', label: 'API' },
    //     { from: 'rust-gateway', to: 'backend', label: 'Route' },
    //     { from: 'mongodb', to: 'dashboard', label: 'Analytics' }
    // ];

    const ComponentCard = ({ comp, index }) => {
        const Icon = comp.icon;
        const isHovered = hoveredComponent === comp.id;

        return (
            <div
                onMouseEnter={() => setHoveredComponent(comp.id)}
                onMouseLeave={() => setHoveredComponent(null)}
                className={`${comp.color} p-3 rounded-lg shadow-md transition-all duration-200 ${isHovered ? 'scale-105 shadow-xl z-10' : ''
                    } cursor-pointer relative`}
            >
                <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-5 h-5" />
                    <div className="font-bold text-sm">{comp.name}</div>
                </div>
                <div className="text-xs text-gray-700 mb-1">{comp.subtitle}</div>
                {isHovered && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-900 text-white text-xs p-2 rounded shadow-lg w-48 z-20">
                        {comp.desc}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">Complete Project Architecture</h1>
                <p className="text-sm text-gray-600 mb-6">Hover over components for details</p>

                {/* Data Sources */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">📥 Data Sources</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {components.sources.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Ingestion Layer */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">🔄 Data Ingestion</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {components.ingestion.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Security Layer - RUST */}
                <div className="mb-6 border-2 border-red-400 rounded-lg p-4 bg-red-50">
                    <h2 className="text-lg font-semibold mb-3 text-red-800">🔒 Security Layer (RUST)</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {components.security.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Messaging & Streaming */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">⚡ Messaging & Streaming</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {components.messaging.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Storage Layer */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">💾 Storage (Data Lake)</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {components.storage.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Processing */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">⚙️ Data Processing</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {components.processing.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Backend Services */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">🖥️ Backend Services</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {components.backend.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Frontend */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-700">🎨 Frontend & Analytics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {components.frontend.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Infrastructure */}
                <div className="mb-6 border-2 border-orange-400 rounded-lg p-4 bg-orange-50">
                    <h2 className="text-lg font-semibold mb-3 text-orange-800">☁️ Infrastructure & Orchestration</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {components.infrastructure.map((comp, i) => (
                            <ComponentCard key={comp.id} comp={comp} index={i} />
                        ))}
                    </div>
                </div>

                {/* Data Flow Summary */}
                <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">📊 Data Flow Summary</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-yellow-200 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">1</div>
                            <div>
                                <strong>Data Sources:</strong> Real-time events (SOURCE I) and batch data (SOURCE II) generate data continuously or periodically
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-200 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">2</div>
                            <div>
                                <strong>Ingestion:</strong> Extract Tool captures streams, Batch Loader handles bulk imports
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-red-300 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">3</div>
                            <div>
                                <strong>Security (RUST):</strong> All data passes through Rust middleware for authentication, validation, and audit logging
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-300 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">4</div>
                            <div>
                                <strong>Streaming:</strong> Kafka distributes events, Stream Processing handles real-time transformations
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-300 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">5</div>
                            <div>
                                <strong>Storage:</strong> Data flows through Raw → Transformation → Curated zones in HDFS and MongoDB
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-400 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">6</div>
                            <div>
                                <strong>Processing:</strong> Spark Transformer runs ETL jobs, aggregations, and data quality checks
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-purple-300 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">7</div>
                            <div>
                                <strong>Application:</strong> Backend and Chaincode query curated data, protected by Rust auth
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-purple-200 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">8</div>
                            <div>
                                <strong>Presentation:</strong> Frontend UI and Analytics Dashboard present insights to users
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-300 w-8 h-8 rounded flex items-center justify-center flex-shrink-0">9</div>
                            <div>
                                <strong>Infrastructure:</strong> Everything runs in Docker containers, orchestrated by Kubernetes, provisioned by Terraform, scheduled by Airflow
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technology Stack Summary */}
                <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">🛠️ Technology Stack</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <h3 className="font-semibold text-sm mb-2 text-gray-700">Languages</h3>
                            <ul className="text-xs space-y-1">
                                <li>• Rust (Security)</li>
                                <li>• Python (Data)</li>
                                <li>• Golang (Backend)</li>
                                <li>• TypeScript (Frontend)</li>
                                <li>• Bash (Scripts)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-2 text-gray-700">Data Processing</h3>
                            <ul className="text-xs space-y-1">
                                <li>• Apache Kafka</li>
                                <li>• Kafka Streams</li>
                                <li>• Apache Spark</li>
                                <li>• Hadoop HDFS</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-2 text-gray-700">Storage</h3>
                            <ul className="text-xs space-y-1">
                                <li>• MongoDB</li>
                                <li>• CouchDB</li>
                                <li>• CITUS</li>
                                <li>• HDFS</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-2 text-gray-700">Infrastructure</h3>
                            <ul className="text-xs space-y-1">
                                <li>• Docker</li>
                                <li>• Kubernetes</li>
                                <li>• Terraform</li>
                                <li>• Airflow</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">✨ Key Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-red-700">🔒 Security First</h3>
                            <p className="text-xs text-gray-600">Rust-based security middleware ensures authentication, authorization, and audit logging across all components</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-green-700">⚡ Real-time + Batch</h3>
                            <p className="text-xs text-gray-600">Handles both streaming data (sub-second) and batch processing (large volumes) in unified architecture</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-blue-700">📈 Scalable</h3>
                            <p className="text-xs text-gray-600">Kubernetes orchestration with auto-scaling, containerized services, and distributed storage</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchitectureDiagram;