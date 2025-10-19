import { useState, useEffect } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { Plus, X, GripVertical, ChevronDown, Settings, Save, Upload, Download } from "lucide-react";
import ServiceConfigDialog from "./ServiceConfigDialog";
import ProxmoxWidget from "./widgets/ProxmoxWidget";
import {
    getServiceConfig,
    saveDashboardConfig,
    loadDashboardConfig,
    exportDashboardConfig,
    importDashboardConfig,
    type TileLayout
} from "../lib/serviceConfig";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface Tile {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    type: string;
    content?: React.ReactNode;
}

interface ServiceType {
    id: string;
    name: string;
    icon: string;
    defaultSize: { w: number; h: number };
    needsConfig: boolean;
}

export default function DashboardGrid() {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [configDialog, setConfigDialog] = useState<{
        isOpen: boolean;
        serviceType: string;
        serviceName: string;
        serviceId: string;
    }>({
        isOpen: false,
        serviceType: "",
        serviceName: "",
        serviceId: "",
    });

    // Lade Dashboard beim Start
    useEffect(() => {
        const savedConfig = loadDashboardConfig();
        if (savedConfig && savedConfig.tiles) {
            setTiles(savedConfig.tiles);
            console.log('📂 Dashboard geladen:', savedConfig.tiles.length, 'Kacheln');
        }
    }, []);

    const services: ServiceType[] = [
        { id: "proxmox", name: "Proxmox VMs", icon: "🖧", defaultSize: { w: 6, h: 4 }, needsConfig: true },
        { id: "cpu", name: "CPU Monitor", icon: "🖥️", defaultSize: { w: 3, h: 2 }, needsConfig: false },
        { id: "memory", name: "Memory Usage", icon: "💾", defaultSize: { w: 3, h: 2 }, needsConfig: false },
        { id: "disk", name: "Disk Space", icon: "💿", defaultSize: { w: 3, h: 2 }, needsConfig: false },
        { id: "network", name: "Network Traffic", icon: "🌐", defaultSize: { w: 4, h: 3 }, needsConfig: false },
        { id: "docker", name: "Docker Containers", icon: "🐳", defaultSize: { w: 6, h: 3 }, needsConfig: true },
    ];

    const addTile = (service: ServiceType) => {
        const tileId = `tile-${Date.now()}`;

        if (service.needsConfig) {
            setConfigDialog({
                isOpen: true,
                serviceType: service.id,
                serviceName: service.name,
                serviceId: tileId,
            });
            setIsDropdownOpen(false);
            return;
        }

        const newTile: Tile = {
            i: tileId,
            x: 0,
            y: Infinity,
            w: service.defaultSize.w,
            h: service.defaultSize.h,
            title: service.name,
            type: service.id,
        };
        setTiles([...tiles, newTile]);
        setIsDropdownOpen(false);
    };

    const handleConfigSaved = () => {
        const service = services.find(s => s.id === configDialog.serviceType);
        if (service) {
            const newTile: Tile = {
                i: configDialog.serviceId,
                x: 0,
                y: Infinity,
                w: service.defaultSize.w,
                h: service.defaultSize.h,
                title: service.name,
                type: service.id,
            };
            setTiles([...tiles, newTile]);
        }
        setConfigDialog({ ...configDialog, isOpen: false });
    };

    const removeTile = (id: string) => {
        setTiles(tiles.filter((tile) => tile.i !== id));
    };

    const openSettings = (tile: Tile) => {
        setConfigDialog({
            isOpen: true,
            serviceType: tile.type,
            serviceName: tile.title,
            serviceId: tile.i,
        });
    };

    const onLayoutChange = (layout: Layout[]) => {
        const updatedTiles = tiles.map((tile) => {
            const layoutItem = layout.find((l) => l.i === tile.i);
            return layoutItem ? { ...tile, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h } : tile;
        });
        setTiles(updatedTiles);
    };

    // Speichern
    const handleSave = () => {
        saveDashboardConfig(tiles);
        setIsSaveMenuOpen(false);
        // Toast notification (optional)
        alert('Dashboard gespeichert! ✅');
    };

    // Exportieren
    const handleExport = () => {
        const configJson = exportDashboardConfig();
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setIsSaveMenuOpen(false);
    };

    // Importieren
    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    try {
                        const config = importDashboardConfig(event.target.result);
                        setTiles(config.tiles);
                        alert('Dashboard importiert! ✅');
                        window.location.reload(); // Reload um Services zu laden
                    } catch (err) {
                        alert('Fehler beim Importieren! ❌');
                        console.error(err);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
        setIsSaveMenuOpen(false);
    };

    const renderTileContent = (tile: Tile) => {
        const config = getServiceConfig(tile.i);

        switch (tile.type) {
            case "proxmox":
                if (!config) {
                    return (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p className="mb-4">Proxmox nicht konfiguriert</p>
                            <button
                                onClick={() => openSettings(tile)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Jetzt konfigurieren
                            </button>
                        </div>
                    );
                }
                return <ProxmoxWidget config={config.config} />;

            case "cpu":
                return (
                    <div className="h-full flex flex-col justify-center items-center">
                        <div className="text-4xl font-bold text-blue-600">45%</div>
                        <div className="text-sm text-gray-500 mt-2">CPU Usage</div>
                    </div>
                );

            case "memory":
                return (
                    <div className="h-full flex flex-col justify-center items-center">
                        <div className="text-4xl font-bold text-green-600">8.2 GB</div>
                        <div className="text-sm text-gray-500 mt-2">of 16 GB used</div>
                    </div>
                );

            default:
                return (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        {tile.type} - Inhalt kommt hier...
                    </div>
                );
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dashboard</h1>

                <div className="flex items-center gap-3">
                    {/* Save Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Save size={18} />
                            Speichern
                        </button>

                        {isSaveMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsSaveMenuOpen(false)}
                                />

                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                                    <div className="p-2">
                                        <button
                                            onClick={handleSave}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                                        >
                                            <Save size={16} />
                                            <span className="text-sm">Speichern</span>
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                                        >
                                            <Download size={16} />
                                            <span className="text-sm">Exportieren</span>
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                                        >
                                            <Upload size={16} />
                                            <span className="text-sm">Importieren</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Add Tile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} />
                            Kachel hinzufügen
                            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />

                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                            Services auswählen
                                        </div>
                                        {services.map((service) => (
                                            <button
                                                key={service.id}
                                                onClick={() => addTile(service)}
                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                                            >
                                                <span className="text-2xl">{service.icon}</span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {service.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {service.defaultSize.w}x{service.defaultSize.h}
                                                        {service.needsConfig && " • Konfiguration erforderlich"}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <GridLayout
                className="layout"
                layout={tiles}
                cols={12}
                rowHeight={80}
                width={1200}
                onLayoutChange={onLayoutChange}
                draggableHandle=".drag-handle"
                isDraggable={true}
                isResizable={true}
                containerPadding={[0, 0]}
                margin={[16, 16]}
            >
                {tiles.map((tile) => (
                    <div
                        key={tile.i}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center gap-2">
                                    <GripVertical
                                        size={18}
                                        className="drag-handle cursor-move text-gray-400 hover:text-gray-600"
                                    />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {tile.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {services.find(s => s.id === tile.type)?.needsConfig && (
                                        <button
                                            onClick={() => openSettings(tile)}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Settings size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => removeTile(tile.i)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-4 overflow-auto">
                                {renderTileContent(tile)}
                            </div>
                        </div>
                    </div>
                ))}
            </GridLayout>

            <ServiceConfigDialog
                isOpen={configDialog.isOpen}
                onClose={handleConfigSaved}
                serviceType={configDialog.serviceType}
                serviceName={configDialog.serviceName}
                serviceId={configDialog.serviceId}
            />
        </div>
    );
}