import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
    saveServiceConfig,
    getServiceConfig,
    type ServiceConfig,
} from "../lib/serviceConfig";
import {
    getIntegrations,
    getIntegrationsByType,
    type Integration,
} from "../lib/integrationConfig";
import { ProxmoxAPI } from "../lib/proxmoxApi";

interface ServiceConfigDialogProps {
    serviceId: string;
    serviceType: string;
    onClose: () => void;
    onSave: () => void | Promise<void>;
}

export default function ServiceConfigDialog({
                                                serviceId,
                                                serviceType,
                                                onClose,
                                                onSave,
                                            }: ServiceConfigDialogProps) {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [selectedIntegration, setSelectedIntegration] = useState<string>("");
    const [nodes, setNodes] = useState<string[]>([]);
    const [selectedNode, setSelectedNode] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allIntegrations = await getIntegrations();
            const filtered = getIntegrationsByType(serviceType, allIntegrations);
            setIntegrations(filtered);

            const existingConfig = getServiceConfig(serviceId);
            if (existingConfig && existingConfig.config.integrationId) {
                setSelectedIntegration(existingConfig.config.integrationId);

                const integration = filtered.find(i => i.id === existingConfig.config.integrationId);
                if (integration && serviceType === "proxmox") {
                    await loadNodes(integration);
                    if (existingConfig.config.node) {
                        setSelectedNode(existingConfig.config.node);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadNodes = async (integration: Integration) => {
        try {
            // Type assertion für ProxmoxConfig
            const proxmoxConfig = integration.config as {
                host: string;
                port: string;
                tokenId: string;
                tokenSecret: string;
            };

            const api = new ProxmoxAPI(proxmoxConfig);
            const nodeList = await api.getNodes();
            setNodes(nodeList.map((n: any) => n.node));
        } catch (error) {
            console.error('Failed to load nodes:', error);
            setNodes([]);
        }
    };

    const handleIntegrationChange = async (integrationId: string) => {
        setSelectedIntegration(integrationId);
        setSelectedNode("");

        const integration = integrations.find(i => i.id === integrationId);
        if (integration && serviceType === "proxmox") {
            await loadNodes(integration);
        }
    };

    const handleSave = async () => {
        const integration = integrations.find(i => i.id === selectedIntegration);
        if (!integration) return;

        const configData: any = {
            ...integration.config,
            integrationId: selectedIntegration,
        };

        // Nur für Proxmox Node hinzufügen
        if (serviceType === "proxmox") {
            configData.node = selectedNode;
        }

        const config: ServiceConfig = {
            id: serviceId,
            type: serviceType,
            config: configData,
        };

        saveServiceConfig(serviceId, config);
        await onSave();
        onClose();
    };

    const needsNodeSelection = serviceType === "proxmox";
    const canSave = selectedIntegration && (!needsNodeSelection || selectedNode);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {serviceType === "proxmox" ? "Proxmox" : serviceType === "adguard" ? "AdGuard Home" : "Service"} konfigurieren
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {integrations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Keine {serviceType === "proxmox" ? "Proxmox" : serviceType === "adguard" ? "AdGuard Home" : serviceType} Integration gefunden
                            </p>
                            <a href="/integrations" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 underline">
                                Integration hinzufügen
                            </a>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Integration
                                </label>
                                <select
                                    value={selectedIntegration}
                                    onChange={(e) => handleIntegrationChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Wähle eine Integration</option>
                                    {integrations.map((integration) => (
                                        <option key={integration.id} value={integration.id}>
                                            {integration.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {needsNodeSelection && selectedIntegration && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Node
                                    </label>
                                    <select
                                        value={selectedNode}
                                        onChange={(e) => setSelectedNode(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        disabled={nodes.length === 0}
                                    >
                                        <option value="">Wähle einen Node</option>
                                        {nodes.map((node) => (
                                            <option key={node} value={node}>
                                                {node}
                                            </option>
                                        ))}
                                    </select>
                                    {nodes.length === 0 && selectedIntegration && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Lade Nodes...
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    );
}