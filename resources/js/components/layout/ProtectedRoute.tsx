import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../api/settings';

export default function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    const { data: license, isLoading: isLicenseLoading } = useQuery({
        queryKey: ['license_status'],
        queryFn: settingsApi.getLicenseStatus,
        enabled: !!user,
        staleTime: 30_000,
    });

    if (loading || (user && isLicenseLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Selama lisensi belum aktif, semua pengguna hanya boleh membuka halaman settings untuk melakukan aktivasi
    if (license && !license.is_licensed) {
        if (location.pathname !== '/settings') {
            return <Navigate to="/settings?group=license" replace />;
        }
    }

    return <Outlet />;
}
