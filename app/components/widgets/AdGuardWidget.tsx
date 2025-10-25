import { useEffect, useState } from "react";
import { getServiceConfig } from "../../lib/serviceConfig";
import { AdGuardAPI, type AdGuardStats, type AdGuardStatus } from "../../lib/adguardApi";
import { Shield, Activity, Ban, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface AdGuardWidgetProps {
    serviceId: string;
}

interface AdGuardConfig {
    host: string;
    port: string;
    username: string;
    password: string;
    integrationId?: string;
}

function isAdGuardConfig(config: any): config is AdGuardConfig {
    return (
        typeof config.host === 'string' &&
        typeof config.port === 'string' &&
        typeof config.username === 'string' &&
        typeof config.password === 'string'
    );
}

// Helper to convert AdGuard's format to our display format
interface DomainStat {
    name: string;
    count: number;
}

function parseTopDomains(data: Array<{ [domain: string]: number }>): DomainStat[] {
    if (!data || data.length === 0) return [];
    return data.map(item => {
        const [name, count] = Object.entries(item)[0];
        return { name, count };
    });
}

export default function AdGuardWidget({ serviceId }: AdGuardWidgetProps) {
    const [stats, setStats] = useState<AdGuardStats | null>(null);
    const [status, setStatus] = useState<AdGuardStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [serviceId]);

    const loadData = async () => {
        try {
            const config = getServiceConfig(serviceId);

            if (!config) {
                setError("Widget nicht konfiguriert");
                setLoading(false);
                return;
            }

            if (!isAdGuardConfig(config.config)) {
                setError("Ungültige AdGuard Konfiguration");
                setLoading(false);
                return;
            }

            if (!config.config.integrationId) {
                setError("Keine Integration ausgewählt");
                setLoading(false);
                return;
            }

            const api = new AdGuardAPI(config.config);

            const [statsData, statusData] = await Promise.all([
                api.getStats(),
                api.getStatus()
            ]);

            setStats(statsData);
            setStatus(statusData);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load AdGuard data:', err);
            setError(err.message || "Fehler beim Laden der Daten");
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num?: number) => {
        if (num === undefined || num === null) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const calculateBlockRate = () => {
        if (!stats) return '0';
        const total = stats.num_dns_queries || 0;
        const blocked = stats.num_blocked_filtering || 0;
        return total > 0 ? ((blocked / total) * 100).toFixed(1) : '0';
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
                <Shield className="text-red-500 mb-2" size={32} />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (!stats || !status) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Keine Daten verfügbar
            </div>
        );
    }

    const blockRate = calculateBlockRate();
    const topQueried = parseTopDomains(stats.top_queried_domains || []);
    const topBlocked = parseTopDomains(stats.top_blocked_domains || []);

    return (
        <div className="space-y-4 h-full overflow-y-auto">
            {/* Status Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield size={20} className={status.protection_enabled ? "text-green-500" : "text-red-500"} />
                    <span className="font-semibold text-gray-900 dark:text-white">AdGuard Home</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    status.running && status.protection_enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                    {status.protection_enabled ? 'Geschützt' : 'Deaktiviert'}
                </span>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
                {/* Total Queries */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-blue-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Anfragen</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(stats.num_dns_queries)}
                    </div>
                </div>

                {/* Blocked */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Ban size={14} className="text-red-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Blockiert</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatNumber(stats.num_blocked_filtering)}
                    </div>
                </div>
            </div>

            {/* Block Rate */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Block-Rate</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{blockRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${blockRate}%` }}
                    />
                </div>
            </div>

            {/* Processing Time */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock size={14} />
                    <span>Ø Antwortzeit</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                    {(stats.avg_processing_time || 0).toFixed(2)} ms
                </span>
            </div>

            {/* Top Domains */}
            {topQueried.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <TrendingUp size={14} />
                        Top Domains
                    </h4>
                    <div className="space-y-1">
                        {topQueried.slice(0, 5).map((domain, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                                    {domain.name}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white ml-2">
                                    {formatNumber(domain.count)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Blocked */}
            {topBlocked.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <TrendingDown size={14} className="text-red-500" />
                        Top Blockiert
                    </h4>
                    <div className="space-y-1">
                        {topBlocked.slice(0, 5).map((domain, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                                    {domain.name}
                                </span>
                                <span className="font-medium text-red-600 dark:text-red-400 ml-2">
                                    {formatNumber(domain.count)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}