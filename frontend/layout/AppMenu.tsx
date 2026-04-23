'use client';
import React from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
  const model: AppMenuItem[] = [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
        { label: 'Leads', icon: 'pi pi-fw pi-users', to: '/leads' },
        { label: 'Configuración', icon: 'pi pi-fw pi-cog', to: '/settings' },
      ],
    },
  ];

  return (
    <MenuProvider>
      <ul className="layout-menu">
        {model.map((item, i) =>
          !item?.seperator ? (
            <AppMenuitem item={item} root={true} index={i} key={item.label} />
          ) : (
            <li className="menu-separator" key={i} />
          )
        )}
      </ul>
    </MenuProvider>
  );
};

export default AppMenu;
