import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated } from "../lib/auth";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [checking, setChecking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login");
        } else {
            setChecking(false);
        }
    }, [navigate]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return <>{children}</>;
}