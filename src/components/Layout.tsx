import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
    const location = useLocation();
    const isGamePage = location.pathname.startsWith('/play/');

    // Базовый стиль для всего приложения
    const layoutStyle = {
        minHeight: '100dvh',
        backgroundColor: '#0f172a', // Тёмный фон
        display: 'flex',
        flexDirection: 'column' as const,
        margin: 0,
        padding: 0
    };

    const mainStyle = {
        width: '100%',
        maxWidth: isGamePage ? 'none' : '1200px',
        margin: '0 auto',
        padding: isGamePage ? '0' : '1.5rem 1rem',
        boxSizing: 'border-box' as const
    };

    return (
        <div style={layoutStyle}>
            {!isGamePage && <Header />}
            <main style={mainStyle}>
                <Outlet />
            </main>
        </div>
    );
}
