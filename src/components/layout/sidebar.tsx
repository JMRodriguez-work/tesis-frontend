import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
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
} from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";

type NavLink = {
  to: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
};

const OPERATION_LINKS: NavLink[] = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: <HouseIcon className="size-4" />,
    exact: true,
  },
  { to: "/items", label: "Items", icon: <PackageIcon className="size-4" /> },
  {
    to: "/sales",
    label: "Ventas",
    icon: <ShoppingCartIcon className="size-4" />,
  },
  {
    to: "/customers",
    label: "Clientes",
    icon: <UsersIcon className="size-4" />,
  },
  {
    to: "/warehouses",
    label: "Depósitos",
    icon: <WarehouseIcon className="size-4" />,
  },
  {
    to: "/providers",
    label: "Proveedores",
    icon: <TruckIcon className="size-4" />,
  },
  {
    to: "/provider-orders",
    label: "Órdenes",
    icon: <ClipboardTextIcon className="size-4" />,
  },
  {
    to: "/reports",
    label: "Reportes",
    icon: <ChartLineUpIcon className="size-4" />,
  },
];

const ALERT_LINKS: NavLink[] = [
  {
    to: "/recommendations",
    label: "Recomendaciones",
    icon: <BellRingingIcon className="size-4" />,
  },
  {
    to: "/notifications",
    label: "Notificaciones",
    icon: <BellIcon className="size-4" />,
  },
];

const SETTINGS_LINKS: NavLink[] = [
  { to: "/settings/organization", label: "Organización", exact: true },
  { to: "/settings/branches", label: "Sucursales" },
  { to: "/settings/categories", label: "Categorías" },
  { to: "/settings/users", label: "Usuarios" },
  { to: "/settings/external-data", label: "Datos externos" },
];

function isLinkActive(pathname: string, to: string, exact = false): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function MainSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to="/dashboard" aria-label="Ir al inicio">
                  <span className="text-sm font-semibold">TFG Frontend</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {OPERATION_LINKS.map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton
                    isActive={isLinkActive(pathname, link.to, link.exact)}
                    render={
                      <Link
                        to={link.to}
                        activeOptions={{ exact: link.exact ?? false }}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Alertas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ALERT_LINKS.map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton
                    isActive={isLinkActive(pathname, link.to, link.exact)}
                    render={
                      <Link
                        to={link.to}
                        activeOptions={{ exact: link.exact ?? false }}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="flex items-center gap-2">
              <GearIcon className="size-3.5" />
              Configuración
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isLinkActive(
                    pathname,
                    "/settings/organization",
                    true,
                  )}
                  render={
                    <Link to="/settings/organization">
                      <span>General</span>
                    </Link>
                  }
                />
                <SidebarMenuSub>
                  {SETTINGS_LINKS.slice(1).map((link) => (
                    <SidebarMenuSubItem key={link.to}>
                      <SidebarMenuSubButton
                        isActive={isLinkActive(pathname, link.to)}
                        render={<Link to={link.to}>{link.label}</Link>}
                      />
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export { MainSidebar };
