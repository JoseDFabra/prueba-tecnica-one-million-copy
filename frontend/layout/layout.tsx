'use client';

import { useEventListener, useUnmountEffect } from 'primereact/hooks';
import React, { useContext, useEffect, useRef } from 'react';
import { classNames } from 'primereact/utils';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import { LayoutContext } from './context/layoutcontext';
import { ChildContainerProps, LayoutState, AppTopbarRef } from '@/types';
import { usePathname, useSearchParams } from 'next/navigation';

const Layout = ({ children }: ChildContainerProps) => {
    const { layoutConfig, layoutState, setLayoutState } = useContext(LayoutContext);
    const topbarRef = useRef<AppTopbarRef>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
        type: 'click',
        listener: (event) => {
            const isOutsideClicked = !(
                sidebarRef.current?.isSameNode(event.target as Node) ||
                sidebarRef.current?.contains(event.target as Node) ||
                topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
                topbarRef.current?.menubutton?.contains(event.target as Node)
            );
            if (isOutsideClicked) hideMenu();
        },
    });

    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        hideMenu();
    }, [pathname, searchParams]);

    const hideMenu = () => {
        setLayoutState((prev: LayoutState) => ({
            ...prev,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false,
        }));
        unbindMenuOutsideClickListener();
        document.body.classList.remove('blocked-scroll');
    };

    useEffect(() => {
        if (layoutState.overlayMenuActive || layoutState.staticMenuMobileActive) {
            bindMenuOutsideClickListener();
        }
        if (layoutState.staticMenuMobileActive) {
            document.body.classList.add('blocked-scroll');
        }
    }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive]);

    useUnmountEffect(() => {
        unbindMenuOutsideClickListener();
    });

    const containerClass = classNames('layout-wrapper', {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive,
        'p-input-filled': layoutConfig.inputStyle === 'filled',
        'p-ripple-disabled': !layoutConfig.ripple,
    });

    return (
        <div className={containerClass}>
            <AppTopbar ref={topbarRef} />
            <div ref={sidebarRef} className="layout-sidebar">
                <AppSidebar />
            </div>
            <div className="layout-main-container">
                <div className="layout-main">{children}</div>
            </div>
            <div className="layout-mask" />
        </div>
    );
};

export default Layout;
