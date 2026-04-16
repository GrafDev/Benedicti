import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
    const location = useLocation();
    const isGamePage = location.pathname.startsWith('/play/');

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <Header />
            <main className={isGamePage ? "flex-grow relative overflow-hidden" : "flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto"}>
                <Outlet />
            </main>
        </div>
    );
}
