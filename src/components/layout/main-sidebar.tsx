import {
  ArrowsLeftRightIcon,
  BellRingingIcon,
  ChartBarIcon,
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
import { canSeeLink, type NavLinkKey } from "@/lib/permissions";
import type { UserRole } from "@/lib/role";

type NavLink = {
  to: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
  linkKey: NavLinkKey;
};

const OPERATION_LINKS: NavLink[] = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: <HouseIcon className="size-4" />,
    exact: true,
    linkKey: "dashboard",
  },
  {
    to: "/items",
    label: "Items",
    icon: <PackageIcon className="size-4" />,
    linkKey: "items",
  },
  {
    to: "/sales",
    label: "Ventas",
    icon: <ShoppingCartIcon className="size-4" />,
    linkKey: "sales",
  },
  {
    to: "/customers",
    label: "Clientes",
    icon: <UsersIcon className="size-4" />,
    linkKey: "customers",
  },
  {
    to: "/customers/segments",
    label: "Segmentación",
    icon: <ChartBarIcon className="size-4" />,
    linkKey: "segments",
  },
  {
    to: "/warehouses",
    label: "Depósitos",
    icon: <WarehouseIcon className="size-4" />,
    linkKey: "warehouses",
  },
  {
    to: "/stock-movements",
    label: "Movimientos",
    icon: <ArrowsLeftRightIcon className="size-4" />,
    linkKey: "stock-movements",
  },
  {
    to: "/providers",
    label: "Proveedores",
    icon: <TruckIcon className="size-4" />,
    linkKey: "providers",
  },
  {
    to: "/provider-orders",
    label: "Órdenes",
    icon: <ClipboardTextIcon className="size-4" />,
    linkKey: "provider-orders",
  },
  {
    to: "/reports",
    label: "Reportes",
    icon: <ChartLineUpIcon className="size-4" />,
    linkKey: "reports",
  },
];

const ALERT_LINKS: NavLink[] = [
  {
    to: "/recommendations",
    label: "Recomendaciones",
    icon: <BellRingingIcon className="size-4" />,
    linkKey: "recommendations",
  },
];

const SETTINGS_LINKS: NavLink[] = [
  {
    to: "/settings/organization",
    label: "Organización",
    exact: true,
    linkKey: "settings-organization",
  },
  {
    to: "/settings/branches",
    label: "Sucursales",
    linkKey: "settings-branches",
  },
  {
    to: "/settings/categories",
    label: "Categorías",
    linkKey: "settings-categories",
  },
  { to: "/settings/users", label: "Usuarios", linkKey: "settings-users" },
  {
    to: "/settings/external-data",
    label: "Datos externos",
    linkKey: "settings-external-data",
  },
];

function isLinkActive(pathname: string, to: string, exact = false): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

type MainSidebarProps = {
  role: UserRole | null;
};

function MainSidebar({ role }: MainSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const visibleOperations = OPERATION_LINKS.filter((link) =>
    canSeeLink(role, link.linkKey),
  );
  const visibleAlerts = ALERT_LINKS.filter((link) =>
    canSeeLink(role, link.linkKey),
  );
  const visibleSettings = SETTINGS_LINKS.filter((link) =>
    canSeeLink(role, link.linkKey),
  );
  const showSettingsGroup = visibleSettings.length > 0;
  const showOrganizationParent = canSeeLink(role, "settings-organization");
  const settingsSubLinks = visibleSettings.filter(
    (link) => link.linkKey !== "settings-organization",
  );

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
              {visibleOperations.map((link) => (
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

        {visibleAlerts.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Alertas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAlerts.map((link) => (
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
        ) : null}

        {showSettingsGroup ? (
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
                  {showOrganizationParent ? (
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
                  ) : null}
                  {settingsSubLinks.length > 0 ? (
                    <SidebarMenuSub>
                      {settingsSubLinks.map((link) => (
                        <SidebarMenuSubItem key={link.to}>
                          <SidebarMenuSubButton
                            isActive={isLinkActive(pathname, link.to)}
                            render={<Link to={link.to}>{link.label}</Link>}
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export { MainSidebar };
