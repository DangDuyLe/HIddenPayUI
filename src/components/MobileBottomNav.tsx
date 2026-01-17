import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User } from 'lucide-react';

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;

    // Only show on dashboard and history pages
    if (location.pathname !== '/dashboard' && location.pathname !== '/history') {
        return null;
    }

    return (
        <nav className="mobile-bottom-nav">
            <button
                onClick={() => navigate('/dashboard')}
                className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
                <Home className="nav-icon" />
                <span className="nav-label">Home</span>
            </button>

            <button
                onClick={() => navigate('/settings')}
                className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
            >
                <User className="nav-icon" />
                <span className="nav-label">Account</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
