import { useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { updateProfile } from "../lib/auth";

interface ChangePasswordDialogProps {
    onSuccess: () => void;
    canClose?: boolean;
}

export default function ChangePasswordDialog({ onSuccess, canClose = false }: ChangePasswordDialogProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username || !email) {
            setError("Benutzername und E-Mail sind erforderlich");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Neue Passwörter stimmen nicht überein");
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setError("Neues Passwort muss mindestens 6 Zeichen lang sein");
            return;
        }

        setLoading(true);

        try {
            await updateProfile(username, email, currentPassword, newPassword);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const passwordLongEnough = !newPassword || newPassword.length >= 6;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Profil aktualisieren
                        </h2>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            ⚠️ Bitte ändere deine Login-Daten aus Sicherheitsgründen
                        </p>
                    </div>
                    {canClose && (
                        <button
                            onClick={onSuccess}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Benutzername
                        </label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Neuer Benutzername"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            E-Mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="neue@email.de"
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Passwort ändern
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Aktuelles Passwort
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="admin123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Neues Passwort
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                                {newPassword && (
                                    <p className={`mt-1 text-xs ${passwordLongEnough ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordLongEnough ? '✓' : '✗'} Mindestens 6 Zeichen
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Neues Passwort bestätigen
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                                {confirmPassword && (
                                    <div className={`mt-1 text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordsMatch ? (
                                            <>
                                                <CheckCircle size={12} />
                                                Passwörter stimmen überein
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={12} />
                                                Passwörter stimmen nicht überein
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !passwordsMatch || !passwordLongEnough}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                    >
                        {loading ? "Wird gespeichert..." : "Profil aktualisieren"}
                    </button>
                </form>
            </div>
        </div>
    );
}