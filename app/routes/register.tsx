import { useState } from "react";
import { useNavigate } from "react-router";
import { register } from "../lib/auth";
import { AlertCircle, CheckCircle } from "lucide-react";

export function meta() {
    return [
        { title: "Registrieren - Nexus" },
        { name: "description", content: "Create your account" },
    ];
}

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwörter stimmen nicht überein");
            return;
        }

        if (password.length < 6) {
            setError("Passwort muss mindestens 6 Zeichen lang sein");
            return;
        }

        setLoading(true);

        try {
            await register(username, email, password);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const passwordLongEnough = password.length >= 6;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <img
                        src="/images/logo.png"
                        alt="Logo"
                        className="h-20 w-20 mx-auto rounded-full"
                    />
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                        Account erstellen
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Erstelle deinen Account und starte mit deinem Dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Benutzername
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Benutzername"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                E-Mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Passwort
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                            />
                            {password && (
                                <p className={`mt-1 text-xs ${passwordLongEnough ? 'text-green-600' : 'text-red-600'}`}>
                                    {passwordLongEnough ? '✓' : '✗'} Mindestens 6 Zeichen
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Passwort bestätigen
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? "Wird erstellt..." : "Account erstellen"}
                    </button>

                    <div className="text-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Bereits einen Account? </span>
                        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                            Jetzt anmelden
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}