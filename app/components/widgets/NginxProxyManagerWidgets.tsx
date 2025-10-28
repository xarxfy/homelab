import { useEffect, useState } from "react";
import { getServiceConfig } from "../../lib/serviceConfig";
import { NginxProxyManagerAPI, type Stats, type ProxyHost, type Certificate } from "../../lib/nginxProxyManagerApi";
import { Network, Globe, Shield, CheckCircle, XCircle, Clock, Power } from "lucide-react";

interface NginxProxyManagerWidgetProps {
    serviceId: string;
}

interface NginxProxyManagerConfig {
    host: string;
    port: string;
    email: string;
    password: string;
    integrationId?: string;
}

function isNginxProxyManagerConfig(config: any): config is NginxProxyManagerConfig {
    return (
        typeof config.host === 'string' &&
        typeof config.port === 'string' &&
        typeof config.email === 'string' &&
        typeof config.password === 'string'
    );
}

export default function NginxProxyManagerWidget({ serviceId }: NginxProxyManagerWidgetProps) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [hosts, setHosts] = useState<ProxyHost[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [togglingHost, setTogglingHost] = useState<number | null>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000);
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

            if (!isNginxProxyManagerConfig(config.config)) {
                setError("Ungültige NPM Konfiguration");
                setLoading(false);
                return;
            }

            if (!config.config.integrationId) {
                setError("Keine Integration ausgewählt");
                setLoading(false);
                return;
            }

            const api = new NginxProxyManagerAPI(config.config);

            const [statsData, hostsData, certsData] = await Promise.all([
                api.getStats(),
                api.getProxyHosts(),
                api.getCertificates()
            ]);

            setStats(statsData);
            setHosts(hostsData);
            setCertificates(certsData);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load NPM data:', err);
            setError(err.message || "Fehler beim Laden der Daten");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleHost = async (hostId: number, currentEnabled: boolean) => {
        setTogglingHost(hostId);
        try {
            const config = getServiceConfig(serviceId);
            if (!config || !isNginxProxyManagerConfig(config.config)) return;

            const api = new NginxProxyManagerAPI(config.config);
            await api.toggleProxyHost(hostId, !currentEnabled);

            // Reload data after toggle
            await loadData();
        } catch (err: any) {
            console.error('Failed to toggle host:', err);
            alert(`Fehler beim Umschalten: ${err.message}`);
        } finally {
            setTogglingHost(null);
        }
    };

    const getExpiringCertificates = () => {
        if (!certificates) return [];
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return certificates.filter(cert => {
            const expiresOn = new Date(cert.expires_on);
            return expiresOn <= thirtyDaysFromNow && expiresOn > now;
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                <Network className="text-red-500 mb-2" size={32} />
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

    const expiringCerts = getExpiringCertificates();
    const enabledHosts = hosts.filter(h => h.enabled);

    return (
        <div className="space-y-4 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Network size={20} className="text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Nginx Proxy Manager</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Proxy Hosts */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Globe size={14} className="text-blue-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Proxy Hosts</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.proxy_hosts}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {enabledHosts.length} aktiv
                    </div>
                </div>

                {/* Certificates */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className="text-green-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Zertifikate</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.certificates}
                    </div>
                    {expiringCerts.length > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {expiringCerts.length} laufen bald ab
                        </div>
                    )}
                </div>
            </div>

            {/* Expiring Certificates Warning */}
            {expiringCerts.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-orange-500" />
                        <span className="text-xs font-semibold text-orange-900 dark:text-orange-300">
                            Zertifikate laufen bald ab
                        </span>
                    </div>
                    <div className="space-y-1">
                        {expiringCerts.slice(0, 3).map((cert) => (
                            <div key={cert.id} className="text-xs text-orange-800 dark:text-orange-200">
                                {cert.nice_name} - {formatDate(cert.expires_on)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Proxy Hosts with Toggle */}
            {hosts.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Proxy Hosts
                    </h4>
                    <div className="space-y-2">
                        {hosts.slice().map((host) => (
                            <div key={host.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900/50 rounded p-2">
                                <div className="flex items-center gap-2 flex-1 truncate">
                                    {host.enabled ? (
                                        <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                                    ) : (
                                        <XCircle size={12} className="text-red-600 flex-shrink-0" />
                                    )}
                                    <span className="text-gray-600 dark:text-gray-400 truncate">
                                        {host.domain_names[0]}
                                    </span>
                                    {host.ssl_forced && (
                                        <Shield size={12} className="text-green-600 flex-shrink-0" />
                                    )}
                                </div>

                                <button
                                    onClick={() => handleToggleHost(host.id, host.enabled)}
                                    disabled={togglingHost === host.id}
                                    className={`p-1 rounded transition-colors ${
                                        host.enabled
                                            ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40'
                                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    } disabled:opacity-50`}
                                    title={host.enabled ? 'Deaktivieren' : 'Aktivieren'}
                                >
                                    <Power size={14} className={host.enabled ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}