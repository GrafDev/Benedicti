import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import styles from './Layout.module.css';

export default function Layout() {
    const location = useLocation();
    const isGameProcess = location.pathname.startsWith('/play/');
    const isWidePage = isGameProcess ||
        location.pathname === '/dictionaries' ||
        location.pathname === '/games' ||
        location.pathname.startsWith('/dict/');

    return (
        <div className={styles.appContainer}>
            {!isGameProcess && <Header />}
            <main className={`${styles.mainContent} ${isWidePage ? styles.widePage : styles.centeredPage}`}>
                <Outlet />
            </main>
        </div>
    );
}
