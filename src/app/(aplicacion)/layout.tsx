import type { ReactNode } from "react";
import { BarraPestanas } from "@/components/menu/barra-pestanas";
import { MenuLateral } from "@/components/menu/menu-lateral";
import { salir } from "../(acceso)/acciones";

/**
 * Aplicación autenticada: barra lateral desde 768 px (md), pestañas abajo por
 * debajo. El relleno lateral del contenido baja a 24 px entre 768 y 1023 px.
 */
export default function LayoutAplicacion({ children }: { children: ReactNode }) {
  return (
    <div className="w-full flex-1 md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <div className="hidden md:block">
        <MenuLateral salir={salir} />
      </div>
      <main className="flex min-w-0 max-w-[1120px] flex-col px-4 pt-3 pb-[calc(88px+max(env(safe-area-inset-bottom),28px))] md:px-6 md:pt-6 md:pb-16 lg:px-12">
        {children}
      </main>
      <BarraPestanas salir={salir} />
    </div>
  );
}
