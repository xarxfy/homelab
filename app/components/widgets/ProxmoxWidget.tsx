import { useState, useEffect } from "react";
import { ProxmoxAPI, type ProxmoxVM } from "../../lib/proxmoxApi";
import type { ProxmoxConfig } from "../../lib/serviceConfig";
import { Play, Square, Loader, Server, Cpu, MemoryStick } from "lucide-react";

interface ProxmoxWidgetProps {
    config: ProxmoxConfig | any;
}

export default function ProxmoxWidget({ config }: ProxmoxWidgetProps) {
    const [vms, setVms] = useState<ProxmoxVM[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const proxmoxConfig = config as ProxmoxConfig;

    useEffect(() => {
        loadVMs();
        const interval = setInterval(loadVMs, 10000);
        return () => clearInterval(interval);
    }, [config]);

    const loadVMs = async () => {
        if (!proxmoxConfig.node) return;

        try {
            const api = new ProxmoxAPI(proxmoxConfig);
            const vmList = await api.getVMs(proxmoxConfig.node);
            setVms(vmList);
            setError(null);
        } catch (err) {
            setError("Fehler beim Laden der VMs");
        } finally {
            setLoading(false);
        }
    };

    const handleVMAction = async (vm: ProxmoxVM, action: 'start' | 'stop') => {
        if (!proxmoxConfig.node) return;

        try {
            const api = new ProxmoxAPI(proxmoxConfig);
            if (action === 'start') {
                await api.startVM(proxmoxConfig.node, vm.vmid, vm.type);
            } else {
                await api.stopVM(proxmoxConfig.node, vm.vmid, vm.type);
            }
            setTimeout(loadVMs, 2000);
        } catch (err) {
            // Silent error - user sees status nicht ändern
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <div className="space-y-3">
                {vms.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        Keine VMs gefunden
                    </div>
                ) : (
                    vms.map((vm) => {
                        const cpuPercent = (vm.cpu * 100).toFixed(0);
                        const memPercent = vm.maxmem > 0
                            ? ((vm.mem / vm.maxmem) * 100).toFixed(0)
                            : '0';
                        const memUsedGB = (vm.mem / 1024 / 1024 / 1024).toFixed(1);
                        const memMaxGB = (vm.maxmem / 1024 / 1024 / 1024).toFixed(1);
                        const diskGB = (vm.disk / 1024 / 1024 / 1024).toFixed(1);

                        return (
                            <div
                                key={vm.vmid}
                                className={`p-4 rounded-lg border transition-all ${
                                    vm.status === 'running'
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800'
                                        : 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Server
                                            size={24}
                                            className={vm.status === 'running' ? 'text-green-600' : 'text-gray-400'}
                                        />
                                        <div>
                                            <div className="font-semibold text-base text-gray-900 dark:text-white">
                                                {vm.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                ID: {vm.vmid} • {vm.type.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {vm.status === 'running' ? (
                                            <button
                                                onClick={() => handleVMAction(vm, 'stop')}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Stop"
                                            >
                                                <Square size={18} className="text-red-600" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleVMAction(vm, 'start')}
                                                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                title="Start"
                                            >
                                                <Play size={18} className="text-green-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                {vm.status === 'running' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* CPU */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Cpu size={16} className="text-blue-500" />
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    CPU
                                                </span>
                                            </div>
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {cpuPercent}%
                                            </div>
                                        </div>

                                        {/* Memory */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MemoryStick size={16} className="text-purple-500" />
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    RAM
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                    {memPercent}%
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                    ({memUsedGB}/{memMaxGB} GB)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Disk Info */}
                                {vm.status === 'running' && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                                            <span>Disk:</span>
                                            <span className="font-medium">{diskGB} GB</span>
                                        </div>
                                    </div>
                                )}

                                {/* Stopped Status */}
                                {vm.status !== 'running' && (
                                    <div className="text-center py-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400 uppercase font-medium">
                                            {vm.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}