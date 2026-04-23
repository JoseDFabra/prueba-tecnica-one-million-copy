import Link from 'next/link';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, onMenuToggle, toggleColorScheme } = useContext(LayoutContext);
    const menubuttonRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: null,
        topbarmenubutton: null,
    }));

    const isDark = layoutConfig.colorScheme === 'dark';

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <i className="pi pi-users text-primary" style={{ fontSize: '1.5rem' }} />
                <span>OMC Leads</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <div className="layout-topbar-menu">
                <button
                    type="button"
                    className="p-link layout-topbar-button"
                    onClick={toggleColorScheme}
                    title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    <i className={isDark ? 'pi pi-sun' : 'pi pi-moon'} />
                    <span>{isDark ? 'Claro' : 'Oscuro'}</span>
                </button>

                <Link href="/settings">
                    <button type="button" className="p-link layout-topbar-button">
                        <i className="pi pi-cog" />
                        <span>Configuración</span>
                    </button>
                </Link>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
