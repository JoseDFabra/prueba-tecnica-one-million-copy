'use client';
import React, { useState, createContext, useEffect, useCallback } from 'react';
import { LayoutState, ChildContainerProps, LayoutConfig, LayoutContextProps } from '@/types';

const STORAGE_KEY = 'omc_color_scheme';

const THEMES = {
    light: 'lara-light-indigo',
    dark: 'lara-dark-indigo',
} as const;

type ColorScheme = keyof typeof THEMES;

function applyTheme(scheme: ColorScheme) {
    const link = document.getElementById('theme-css') as HTMLLinkElement | null;
    if (link) link.href = `/themes/${THEMES[scheme]}/theme.css`;
}

export const LayoutContext = createContext({} as LayoutContextProps);

export const LayoutProvider = ({ children }: ChildContainerProps) => {
    const savedScheme = (): ColorScheme => {
        if (typeof window === 'undefined') return 'light';
        return (localStorage.getItem(STORAGE_KEY) as ColorScheme) ?? 'light';
    };

    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'light',
        theme: THEMES.light,
        scale: 14,
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
    });

    // Apply stored scheme on mount
    useEffect(() => {
        const scheme = savedScheme();
        setLayoutConfig((prev) => ({ ...prev, colorScheme: scheme, theme: THEMES[scheme] }));
        applyTheme(scheme);
    }, []);

    const toggleColorScheme = useCallback(() => {
        setLayoutConfig((prev) => {
            const next: ColorScheme = prev.colorScheme === 'light' ? 'dark' : 'light';
            localStorage.setItem(STORAGE_KEY, next);
            applyTheme(next);
            return { ...prev, colorScheme: next, theme: THEMES[next] };
        });
    }, []);

    const onMenuToggle = () => {
        if (layoutConfig.menuMode === 'overlay') {
            setLayoutState((prev) => ({ ...prev, overlayMenuActive: !prev.overlayMenuActive }));
        } else if (window.innerWidth > 991) {
            setLayoutState((prev) => ({ ...prev, staticMenuDesktopInactive: !prev.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prev) => ({ ...prev, staticMenuMobileActive: !prev.staticMenuMobileActive }));
        }
    };

    const value: LayoutContextProps = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        toggleColorScheme,
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
