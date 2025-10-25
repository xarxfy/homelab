import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated, mustChangePassword, getUser } from "../lib/auth";
import { Loader } from "lucide-react";
import ChangePasswordDialog from "./ChangePasswordDialog";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [checking, setChecking] = useState(true);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login");
        } else {
            setChecking(false);
            if (mustChangePassword()) {
                setShowPasswordDialog(true);
            }
        }
    }, [navigate]);

    const handlePasswordChanged = () => {
        setShowPasswordDialog(false);
        // Reload user data
        window.location.reload();
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <>
            {showPasswordDialog && (
                <ChangePasswordDialog onSuccess={handlePasswordChanged} canClose={false} />
            )}
            {children}
        </>
    );
}