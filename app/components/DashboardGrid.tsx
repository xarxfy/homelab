import { useState, useEffect, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import AddTileDialog from "./AddTileDialog";
import ServiceConfigDialog from "./ServiceConfigDialog";
import ProxmoxWidget from "./widgets/ProxmoxWidget";
import AdGuardWidget from "./widgets/AdGuardWidget";
import { Plus, Settings, Trash2 } from "lucide-react";
import {
    saveDashboardConfig,
    loadDashboardConfig,
    deleteServiceConfig,
    type TileLayout
} from "../lib/serviceConfig";
import NginxProxyManagerWidget from "~/components/widgets/NginxProxyManagerWidgets";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardGrid() {
    const [tiles, setTiles] = useState<TileLayout[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [configTile, setConfigTile] = useState<{ id: string; type: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [widgetKey, setWidgetKey] = useState(0);
    const isUserInteracting = useRef(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const config = await loadDashboardConfig();
            if (config && config.tiles) {
                setTiles(config.tiles);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLayoutChange = (newLayout: Layout[]) => {
        // Nur speichern wenn User aktiv Layout ändert
        if (!isUserInteracting.current) return;

        const updatedTiles = tiles.map((tile) => {
            const layoutItem = newLayout.find((l) => l.i === tile.i);
            if (layoutItem) {
                return {
                    ...tile,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                };
            }
            return tile;
        });

        setTiles(updatedTiles);
    };

    const handleDragStart = () => {
        isUserInteracting.current = true;
    };

    const handleDragStop = async (layout: Layout[]) => {
        isUserInteracting.current = false;

        const updatedTiles = tiles.map((tile) => {
            const layoutItem = layout.find((l) => l.i === tile.i);
            if (layoutItem) {
                return {
                    ...tile,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                };
            }
            return tile;
        });

        setTiles(updatedTiles);
        await saveDashboardConfig(updatedTiles);
    };

    const handleResizeStart = () => {
        isUserInteracting.current = true;
    };

    const handleResizeStop = async (layout: Layout[]) => {
        isUserInteracting.current = false;

        const updatedTiles = tiles.map((tile) => {
            const layoutItem = layout.find((l) => l.i === tile.i);
            if (layoutItem) {
                return {
                    ...tile,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                };
            }
            return tile;
        });

        setTiles(updatedTiles);
        await saveDashboardConfig(updatedTiles);
    };

    const handleAddTile = async (title: string, type: string, widgetType: string) => {
        const newTileId = `tile-${Date.now()}`;

        const newTile: TileLayout = {
            i: newTileId,
            x: (tiles.length * 2) % 12,
            y: Infinity,
            w: 4,
            h: 4,
            title,
            type: widgetType,
        };

        const updatedTiles = [...tiles, newTile];
        setTiles(updatedTiles);
        await saveDashboardConfig(updatedTiles);
        setShowAddDialog(false);

        setConfigTile({ id: newTileId, type: widgetType });
    };

    const handleRemoveTile = async (id: string) => {
        const updatedTiles = tiles.filter((tile) => tile.i !== id);
        setTiles(updatedTiles);
        deleteServiceConfig(id);
        await saveDashboardConfig(updatedTiles);
    };

    const handleConfigSave = async () => {
        await saveDashboardConfig(tiles);
        setConfigTile(null);
        setWidgetKey(prev => prev + 1);
    };

    const renderWidget = (tile: TileLayout) => {
        switch (tile.type) {
            case "proxmox":
                return <ProxmoxWidget key={`${tile.i}-${widgetKey}`} serviceId={tile.i} />;
            case "adguard":
                return <AdGuardWidget key={`${tile.i}-${widgetKey}`} serviceId={tile.i} />;
            case "nginx-proxy-manager":
                return <NginxProxyManagerWidget key={`${tile.i}-${widgetKey}`} serviceId={tile.i} />;
            default:
                return (
                    <div className="text-gray-500 dark:text-gray-400 text-center">
                        Widget type not found
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Widget hinzufügen
                </button>
            </div>

            {tiles.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                        Noch keine Widgets vorhanden
                    </p>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Erstes Widget hinzufügen
                    </button>
                </div>
            ) : (
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: tiles }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={80}
                    onLayoutChange={handleLayoutChange}
                    onDragStart={handleDragStart}
                    onDragStop={(layout) => handleDragStop(layout)}
                    onResizeStart={handleResizeStart}
                    onResizeStop={(layout) => handleResizeStop(layout)}
                    draggableHandle=".drag-handle"
                    compactType="vertical"
                    preventCollision={false}
                >
                    {tiles.map((tile) => (
                        <div
                            key={tile.i}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <div className="drag-handle flex items-center gap-2 flex-1 cursor-move">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {tile.title}
                                    </h3>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfigTile({ id: tile.i, type: tile.type });
                                        }}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        title="Konfigurieren"
                                    >
                                        <Settings size={16} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveTile(tile.i);
                                        }}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Entfernen"
                                    >
                                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 flex-1 overflow-auto">
                                {renderWidget(tile)}
                            </div>
                        </div>
                    ))}
                </ResponsiveGridLayout>
            )}

            {showAddDialog && (
                <AddTileDialog
                    onClose={() => setShowAddDialog(false)}
                    onAdd={handleAddTile}
                />
            )}

            {configTile && (
                <ServiceConfigDialog
                    serviceId={configTile.id}
                    serviceType={configTile.type}
                    onClose={() => setConfigTile(null)}
                    onSave={handleConfigSave}
                />
            )}
        </div>
    );
}