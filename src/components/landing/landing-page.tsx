import {
  ChartLineUpIcon,
  PackageIcon,
  ShoppingCartIcon,
  WarehouseIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { FeatureCard } from "@/components/landing/feature-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-linear-to-b from-background to-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <ChartLineUpIcon className="size-5 text-primary" weight="duotone" />
            <span className="text-sm font-semibold">TFG</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Iniciar sesión
            </Link>
            <Link to="/signup" className={cn(buttonVariants({ size: "sm" }))}>
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Inteligencia analítica para almacenes y despensas
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground text-balance sm:text-base">
          Registrá ventas, stock y clientes. Detectá patrones, anticipá
          faltantes y tomá decisiones basadas en datos, no en intuición.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to="/signup" className={cn(buttonVariants({ size: "lg" }))}>
            Empezar gratis
          </Link>
          <Link
            to="/login"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <FeatureCard
          icon={<ShoppingCartIcon className="size-5" weight="duotone" />}
          title="Ventas"
          description="Registrá ventas con barcode scanner, descuentos y múltiples medios de pago."
        />
        <FeatureCard
          icon={<PackageIcon className="size-5" weight="duotone" />}
          title="Stock"
          description="Control de stock por depósito con alertas automáticas de reposición."
        />
        <FeatureCard
          icon={<WarehouseIcon className="size-5" weight="duotone" />}
          title="Depósitos"
          description="Transferencias entre sucursales y depósitos con trazabilidad completa."
        />
      </section>

      <footer className="border-t border-border bg-card py-4">
        <div className="mx-auto max-w-5xl px-6 text-center text-xs text-muted-foreground">
          TFG · Trabajo Final de Grado
        </div>
      </footer>
    </main>
  );
}

export { LandingPage };
