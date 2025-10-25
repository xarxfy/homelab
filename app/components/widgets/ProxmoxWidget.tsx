import { useEffect, useState } from "react";
import { getServiceConfig } from "../../lib/serviceConfig";
import { ProxmoxAPI } from "../../lib/proxmoxApi";
import { Server, Activity, HardDrive, Cpu, MemoryStick, MonitorPlay, Box } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
interface ProxmoxWidgetProps {
    serviceId: string;
}

interface ProxmoxConfig {
    host: string;
    port: string;
    tokenId: string;
    tokenSecret: string;
    node?: string;
    integrationId?: string;
}

interface NodeStats {
    node: string;
    status: string;
    uptime: number;
    cpu: number;
    mem: number;
    maxmem: number;
    disk: number;
    maxdisk: number;
}

interface VM {
    vmid: number;
    name: string;
    status: string;
    cpu: number;
    mem: number;
    maxmem: number;
    disk: number;
    maxdisk: number;
    type: 'qemu' | 'lxc';
}

function isProxmoxConfig(config: any): config is ProxmoxConfig {
    return (
        typeof config.host === 'string' &&
        typeof config.port === 'string' &&
        typeof config.tokenId === 'string' &&
        typeof config.tokenSecret === 'string'
    );
}

export default function ProxmoxWidget({ serviceId }: ProxmoxWidgetProps) {
    const [stats, setStats] = useState<NodeStats | null>(null);
    const [vms, setVms] = useState<VM[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [serviceId]);

    const loadStats = async () => {
        try {
            const config = getServiceConfig(serviceId);

            if (!config) {
                setError("Widget nicht konfiguriert");
                setLoading(false);
                return;
            }

            if (!isProxmoxConfig(config.config)) {
                setError("Ungültige Proxmox Konfiguration");
                setLoading(false);
                return;
            }

            if (!config.config.integrationId) {
                setError("Keine Integration ausgewählt");
                setLoading(false);
                return;
            }

            const api = new ProxmoxAPI(config.config);

            // Load nodes
            const nodes = await api.getNodes();

            if (nodes && nodes.length > 0) {
                const targetNode = config.config.node || nodes[0].node;
                const nodeData = nodes.find((n: any) => n.node === targetNode) || nodes[0];
                setStats(nodeData);

                // Load VMs (already includes both qemu and lxc)
                const allVMs = await api.getVMs(targetNode);
                setVms(allVMs.sort((a, b) => a.vmid - b.vmid));

                setError(null);
            }
        } catch (err: any) {
            console.error('Failed to load Proxmox stats:', err);
            setError(err.message || "Fehler beim Laden der Daten");
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        const gb = bytes / (1024 ** 3);
        return `${gb.toFixed(1)} GB`;
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Server className="text-red-500 mb-2" size={32} />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Keine Daten verfügbar
            </div>
        );
    }

    const cpuPercent = (stats.cpu * 100).toFixed(1);
    const memPercent = ((stats.mem / stats.maxmem) * 100).toFixed(1);
    const diskPercent = ((stats.disk / stats.maxdisk) * 100).toFixed(1);

    return (
        <div className="space-y-4 h-full overflow-y-auto">
            {/* Node Stats */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server size={20} className="text-blue-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{stats.node}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        stats.status === 'online'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                        {stats.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-purple-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">CPU</span>
                                <span className="font-medium text-gray-900 dark:text-white">{cpuPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${cpuPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <MemoryStick size={14} className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">RAM</span>
                                <span className="font-medium text-gray-900 dark:text-white text-xs">
                                    {formatBytes(stats.mem)} / {formatBytes(stats.maxmem)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${memPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <HardDrive size={14} className="text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Disk</span>
                                <span className="font-medium text-gray-900 dark:text-white text-xs">
                                    {formatBytes(stats.disk)} / {formatBytes(stats.maxdisk)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${diskPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Accordion defaultValue={"Item-1"} type="single" collapsible className="w-full">
                <AccordionItem value="Item-1">

            {/* VMs and Containers */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <AccordionTrigger>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <MonitorPlay size={16} />
                    VMs & Container ({vms.length})
                </h4>
                    </AccordionTrigger>
                <AccordionContent>

                <div className="space-y-2">
                    {vms.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                            Keine VMs oder Container gefunden
                        </p>
                    ) : (
                        vms.map((vm) => {
                            const vmCpuPercent = (vm.cpu * 100).toFixed(1);
                            const vmMemPercent = ((vm.mem / vm.maxmem) * 100).toFixed(1);

                            return (
                                <div key={vm.vmid} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {vm.type === 'qemu' ? (
                                                <MonitorPlay size={14} className="text-blue-500 flex-shrink-0" />
                                            ) : (
                                                <Box size={14} className="text-purple-500 flex-shrink-0" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {vm.name || `${vm.type.toUpperCase()} ${vm.vmid}`}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                            vm.status === 'running'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            {vm.status}
                                        </span>
                                    </div>

                                    {vm.status === 'running' && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">CPU</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{vmCpuPercent}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                                    <div className="bg-purple-500 h-1 rounded-full transition-all" style={{ width: `${vmCpuPercent}%` }} />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">RAM</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{vmMemPercent}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                                    <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${vmMemPercent}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                </AccordionContent>
            </div>
                </AccordionItem>
            </Accordion>
        </div>
    );
}