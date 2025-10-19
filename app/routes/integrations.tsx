import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import ProtectedRoute from "../components/ProtectedRoute";
import AppLayout from "../components/AppLayout";
import {
    getIntegrations,
    deleteIntegration,
    saveIntegration,
    updateIntegration,
    type Integration,
} from "../lib/integrationConfig";
import { testProxmoxConnection } from "../lib/proxmoxTest";

export function meta() {
    return [
        { title: "Nexus - Integrationen" },
        { name: "description", content: "Verwalte deine Service-Integrationen" },
    ];
}

// 1. Proxmox Integration Form
function ProxmoxIntegrationForm({
                                    onClose,
                                    onSave,
                                    existingIntegration,
                                }: {
    onClose: () => void;
    onSave: () => void;
    existingIntegration?: Integration;
}) {
    const [name, setName] = useState(existingIntegration?.name || '');
    const [host, setHost] = useState(existingIntegration?.config.host || '');
    const [port, setPort] = useState(existingIntegration?.config.port || '8006');
    const [tokenId, setTokenId] = useState(existingIntegration?.config.tokenId || '');
    const [tokenSecret, setTokenSecret] = useState(existingIntegration?.config.tokenSecret || '');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        const result = await testProxmoxConnection(host, port, tokenId, tokenSecret);

        setTestResult(result.success ? 'success' : 'error');
        setTesting(false);
    };

    const handleSave = async () => {
        const integration: Integration = {
            id: existingIntegration?.id || `proxmox-${Date.now()}`,
            name: name,
            type: 'proxmox',
            config: { host, port, tokenId, tokenSecret },
            created_at: existingIntegration?.created_at || new Date().toISOString(),
        };

        try {
            if (existingIntegration) {
                await updateIntegration(integration.id, integration);
            } else {
                await saveIntegration(integration);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save integration:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {existingIntegration ? 'Proxmox bearbeiten' : 'Proxmox hinzufügen'}
                    </h2>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mein Proxmox Server"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Host</label>
                        <input
                            type="text"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            placeholder="192.168.179.2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                        <input
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="8006"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Token ID</label>
                        <input
                            type="text"
                            value={tokenId}
                            onChange={(e) => setTokenId(e.target.value)}
                            placeholder="root@pam!mytoken"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Token Secret</label>
                        <input
                            type="password"
                            value={tokenSecret}
                            onChange={(e) => setTokenSecret(e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={testing || !host || !tokenId || !tokenSecret}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                        {testing ? 'Teste...' : 'Verbindung testen'}
                    </button>

                    {testResult === 'success' && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                            <CheckCircle size={16} />
                            Verbindung erfolgreich!
                        </div>
                    )}
                    {testResult === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                            <XCircle size={16} />
                            Verbindung fehlgeschlagen.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={testResult !== 'success' || !name}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    );
}

// 2. Add Integration Dialog
function AddIntegrationDialog({
                                  onClose,
                                  onSave,
                              }: {
    onClose: () => void;
    onSave: () => void;
}) {
    const [selectedType, setSelectedType] = useState<string>('');

    const integrationTypes = [
        { id: 'proxmox', name: 'Proxmox', icon: '🖧', description: 'Proxmox VE Server' },
        { id: 'docker', name: 'Docker', icon: '🐳', description: 'Docker Container', disabled: true },
        { id: 'homeassistant', name: 'Home Assistant', icon: '🏠', description: 'Smart Home', disabled: true },
    ];

    if (selectedType === 'proxmox') {
        return <ProxmoxIntegrationForm onClose={onClose} onSave={onSave} />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Integration hinzufügen</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Wähle den Service aus, den du verbinden möchtest</p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrationTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => !type.disabled && setSelectedType(type.id)}
                            disabled={type.disabled}
                            className={`p-6 rounded-lg border-2 transition-all text-left ${
                                type.disabled
                                    ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-4xl">{type.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{type.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                                </div>
                            </div>
                            {type.disabled && <span className="text-xs text-gray-500">Bald verfügbar</span>}
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
}

// 3. Edit Integration Dialog
function EditIntegrationDialog({
                                   integration,
                                   onClose,
                                   onSave,
                               }: {
    integration: Integration;
    onClose: () => void;
    onSave: () => void;
}) {
    if (integration.type === 'proxmox') {
        return <ProxmoxIntegrationForm onClose={onClose} onSave={onSave} existingIntegration={integration} />;
    }
    return null;
}

// 4. Integration Card
function IntegrationCard({
                             integration,
                             onDelete,
                             onUpdate,
                         }: {
    integration: Integration;
    onDelete: (id: string) => void;
    onUpdate: () => void;
}) {
    const [showEdit, setShowEdit] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        const result = await testProxmoxConnection(
            integration.config.host,
            integration.config.port,
            integration.config.tokenId,
            integration.config.tokenSecret
        );

        setTestResult(result.success ? 'success' : 'error');
        setTesting(false);
    };

    const getIcon = () => {
        switch (integration.type) {
            case 'proxmox': return '🖧';
            case 'docker': return '🐳';
            default: return '🔧';
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{getIcon()}</span>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{integration.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{integration.type}</p>
                        </div>
                    </div>
                    {testResult && (
                        testResult === 'success' ? (
                            <CheckCircle size={20} className="text-green-500" />
                        ) : (
                            <XCircle size={20} className="text-red-500" />
                        )
                    )}
                </div>

                <div className="mb-4 space-y-1 text-sm">
                    {integration.type === 'proxmox' && (
                        <>
                            <div className="text-gray-600 dark:text-gray-400">
                                Host: <span className="font-mono">{integration.config.host}</span>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Port: <span className="font-mono">{integration.config.port}</span>
                            </div>
                        </>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Erstellt: {new Date(integration.created_at).toLocaleDateString('de-DE')}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleTest}
                        disabled={testing}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
                    >
                        {testing ? 'Teste...' : 'Testen'}
                    </button>
                    <button onClick={() => setShowEdit(true)} className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" title="Bearbeiten">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => onDelete(integration.id)} className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title="Löschen">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {showEdit && <EditIntegrationDialog integration={integration} onClose={() => setShowEdit(false)} onSave={onUpdate} />}
        </>
    );
}

// 5. Main Component
export default function Integrations() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            const data = await getIntegrations();
            setIntegrations(data);
        } catch (error) {
            console.error('Failed to load integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Integration wirklich löschen?')) {
            try {
                await deleteIntegration(id);
                loadIntegrations();
            } catch (error) {
                console.error('Failed to delete integration:', error);
            }
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-full">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6">
                            <p className="text-gray-600 dark:text-gray-400">Verwalte deine Service-Verbindungen zentral</p>
                        </div>

                        <div className="mb-6">
                            <button onClick={() => setShowAddDialog(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                                <Plus size={20} />
                                Integration hinzufügen
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {integrations.length === 0 ? (
                                    <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                                        <p className="text-lg mb-2">Keine Integrationen vorhanden</p>
                                        <p className="text-sm">Füge deine erste Integration hinzu</p>
                                    </div>
                                ) : (
                                    integrations.map((integration) => (
                                        <IntegrationCard key={integration.id} integration={integration} onDelete={handleDelete} onUpdate={loadIntegrations} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {showAddDialog && <AddIntegrationDialog onClose={() => setShowAddDialog(false)} onSave={loadIntegrations} />}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}