import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import {
    getIntegrations,
    saveIntegration,
    deleteIntegration,
    type Integration,
} from "../lib/integrationConfig";
import { getAllIntegrations, getIntegrationByType } from "../lib/integrations";
import ProtectedRoute from "~/components/ProtectedRoute";1
import AppLayout from "~/components/AppLayout";

interface IntegrationFormData {
    [key: string]: string;
}

export default function Integrations() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedType, setSelectedType] = useState<string>("");
    const [formData, setFormData] = useState<IntegrationFormData>({});
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, boolean>>({});

    const integrationTypes = getAllIntegrations();

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        const data = await getIntegrations();
        setIntegrations(data);
    };

    const handleTypeSelect = (typeId: string) => {
        setSelectedType(typeId);
        const type = getIntegrationByType(typeId);

        const initialData: IntegrationFormData = {
            name: "",
            type: typeId,
            host: "",
            port: type?.defaultPort || "",
        };

        setFormData(initialData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const integrationType = getIntegrationByType(formData.type);
        if (!integrationType) return;

        const config = integrationType.validateConfig(formData);

        const integration: Integration = {
            id: `${formData.type}-${Date.now()}`,
            name: formData.name,
            type: formData.type,
            config,
        };

        await saveIntegration(integration);
        await loadIntegrations();
        setShowDialog(false);
        setSelectedType("");
        setFormData({});
    };

    const handleDelete = async (id: string) => {
        if (confirm("Integration wirklich löschen?")) {
            await deleteIntegration(id);
            await loadIntegrations();
        }
    };

    const handleTest = async (integration: Integration) => {
        setTesting(integration.id);
        try {
            const integrationType = getIntegrationByType(integration.type);
            if (!integrationType) {
                setTestResults({ ...testResults, [integration.id]: false });
                return;
            }

            const success = await integrationType.testConnection(integration);
            setTestResults({ ...testResults, [integration.id]: success });
        } catch (error) {
            setTestResults({ ...testResults, [integration.id]: false });
        } finally {
            setTesting(null);
        }
    };

    const handleInputChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    return (
        <ProtectedRoute>
            <AppLayout>


        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Integrationen
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Verbinde externe Services mit deinem Dashboard
                    </p>
                </div>
                <button
                    onClick={() => setShowDialog(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Integration hinzufügen
                </button>
            </div>

            {/* Listenansicht */}
            <div className="space-y-3">
                {integrations.map((integration) => {
                    const integrationType = getIntegrationByType(integration.type);
                    const Icon = integrationType?.icon;

                    return (
                        <div
                            key={integration.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    {Icon && <Icon size={24} className={integrationType?.iconColor} />}

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {integration.name}
                                            </h3>
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                                {integrationType?.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {integration.config.host}:{integration.config.port}
                                            </span>
                                            {testResults[integration.id] !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    {testResults[integration.id] ? (
                                                        <>
                                                            <CheckCircle size={14} className="text-green-600" />
                                                            <span className="text-xs text-green-600">Verbunden</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={14} className="text-red-600" />
                                                            <span className="text-xs text-red-600">Fehler</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleTest(integration)}
                                        disabled={testing === integration.id}
                                        className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                                    >
                                        {testing === integration.id ? "Teste..." : "Testen"}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(integration.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        title="Löschen"
                                    >
                                        <Trash2 size={18} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {integrations.length === 0 && (
                <div className="text-center py-20">
                    <Plus size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                        Noch keine Integrationen vorhanden
                    </p>
                    <button
                        onClick={() => setShowDialog(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Erste Integration hinzufügen
                    </button>
                </div>
            )}

            {showDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDialog(false)} />

                    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Integration hinzufügen
                            </h2>
                        </div>

                        {!selectedType ? (
                            <div className="p-6">
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Wähle einen Service:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {integrationTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => handleTypeSelect(type.id)}
                                                className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Icon size={24} className={type.iconColor} />
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {type.name}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {type.description}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {getIntegrationByType(selectedType)?.fields.map((field) => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            value={formData[field.name] || ""}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                ))}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDialog(false);
                                            setSelectedType("");
                                        }}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                    >
                                        Hinzufügen
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
            </AppLayout>
        </ProtectedRoute>
    );
}