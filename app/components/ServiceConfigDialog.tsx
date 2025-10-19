import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { saveServiceConfig } from "../lib/serviceConfig";
import { getIntegrationsByType, type Integration } from "../lib/integrationConfig";
import { ProxmoxAPI } from "../lib/proxmoxApi";

interface ServiceConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    serviceType: string;
    serviceName: string;
    serviceId: string;
}

export default function ServiceConfigDialog({
                                                isOpen,
                                                onClose,
                                                serviceType,
                                                serviceName,
                                                serviceId,
                                            }: ServiceConfigDialogProps) {
    const [selectedIntegration, setSelectedIntegration] = useState<string>('');
    const [selectedNode, setSelectedNode] = useState<string>('');
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [nodes, setNodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && serviceType === 'proxmox') {
            const proxmoxIntegrations = getIntegrationsByType('proxmox');
            setIntegrations(proxmoxIntegrations);
        }
    }, [isOpen, serviceType]);

    useEffect(() => {
        if (selectedIntegration) {
            loadNodes();
        }
    }, [selectedIntegration]);

    const loadNodes = async () => {
        const integration = integrations.find(i => i.id === selectedIntegration);
        if (!integration) return;

        setLoading(true);
        try {
            const api = new ProxmoxAPI(integration.config);
            const nodeList = await api.getNodes();
            setNodes(nodeList.map((n: any) => n.node));
            if (nodeList.length > 0) {
                setSelectedNode(nodeList[0].node);
            }
        } catch (err) {
            console.error('Failed to load nodes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        const integration = integrations.find(i => i.id === selectedIntegration);
        if (!integration) return;

        saveServiceConfig(serviceId, {
            id: serviceId,
            type: serviceType,
            config: {
                ...integration.config,
                node: selectedNode,
                integrationId: selectedIntegration,
            },
        });
        onClose();
    };

    if (!isOpen) return null;

    const renderProxmoxConfig = () => {
        if (integrations.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Keine Proxmox Integration gefunden
                    </p>
                    <a href="/integrations" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block">
                        Integration erstellen
                    </a>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Proxmox Server auswählen
                    </label>
                    <select
                        value={selectedIntegration}
                        onChange={(e) => setSelectedIntegration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Wähle einen Server</option>
                        {integrations.map((integration) => (
                            <option key={integration.id} value={integration.id}>
                                {integration.name} ({integration.config.host})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedIntegration && nodes.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Node auswählen
                        </label>
                        <select
                            value={selectedNode}
                            onChange={(e) => setSelectedNode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {nodes.map((node) => (
                                <option key={node} value={node}>
                                    {node}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {loading && (
                    <div className="text-center text-sm text-gray-500">
                        Lade Nodes...
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {serviceName} konfigurieren
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Wähle eine Integration aus
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {serviceType === "proxmox" && renderProxmoxConfig()}
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedIntegration || !selectedNode}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    );
}