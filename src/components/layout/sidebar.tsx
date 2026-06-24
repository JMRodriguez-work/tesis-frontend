import {
  BellIcon,
  BellRingingIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  GearIcon,
  HouseIcon,
  PackageIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';

type NavLink = { to: string; label: string; icon: React.ReactNode };

const NAV: NavLink[] = [
  { to: '/dashboard', label: 'Inicio', icon: <HouseIcon className="size-4" /> },
  { to: '/items', label: 'Items', icon: <PackageIcon className="size-4" /> },
  { to: '/sales', label: 'Ventas', icon: <ShoppingCartIcon className="size-4" /> },
  { to: '/customers', label: 'Clientes', icon: <UsersIcon className="size-4" /> },
  { to: '/warehouses', label: 'Depósitos', icon: <WarehouseIcon className="size-4" /> },
  { to: '/providers', label: 'Proveedores', icon: <TruckIcon className="size-4" /> },
  { to: '/provider_orders', label: 'Órdenes', icon: <ClipboardTextIcon className="size-4" /> },
  {
    to: '/recommendations',
    label: 'Recomendaciones',
    icon: <BellRingingIcon className="size-4" />,
  },
  { to: '/reports', label: 'Reportes', icon: <ChartLineUpIcon className="size-4" /> },
  { to: '/settings/organization', label: 'Configuración', icon: <GearIcon className="size-4" /> },
];

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-semibold">TFG Frontend</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors',
              'hover:bg-muted hover:text-foreground',
            )}
            activeProps={{ className: 'bg-muted text-foreground' }}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <Link
          to="/notifications"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <BellIcon className="size-4" />
          <span>Notificaciones</span>
        </Link>
      </div>
    </aside>
  );
}

export { Sidebar };
