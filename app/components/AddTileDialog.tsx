import { useState } from "react";
import { X } from "lucide-react";

interface AddTileDialogProps {
    onClose: () => void;
    onAdd: (title: string, type: string, widgetType: string) => void;
}

export default function AddTileDialog({ onClose, onAdd }: AddTileDialogProps) {
    const [title, setTitle] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const widgetTypes = [
        { id: "proxmox", name: "Proxmox", icon: "🖧", description: "Proxmox Server Status" },
        { id: "docker", name: "Docker", icon: "🐳", description: "Docker Container", disabled: true },
        { id: "weather", name: "Wetter", icon: "🌤️", description: "Wetter Widget", disabled: true },
        { id: "adguard", name: "AdGuard Home", icon: "🛡️", description: "DNS & Ad-Blocking Stats" },
    ];

    const handleAdd = () => {
        if (title && selectedType) {
            onAdd(title, selectedType, selectedType);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Widget hinzufügen
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Widget Titel
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="z.B. Mein Proxmox Server"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Widget Typ
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {widgetTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => !type.disabled && setSelectedType(type.id)}
                                    disabled={type.disabled}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                                        selectedType === type.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : type.disabled
                                                ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">{type.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {type.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>
                                    {type.disabled && (
                                        <span className="text-xs text-gray-500">Bald verfügbar</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                        Abbrechen
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!title || !selectedType}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                        Hinzufügen
                    </button>
                </div>
            </div>
        </div>
    );
}