import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  ChartNoAxesColumn,
  CreditCard,
  Landmark,
  List,
  Plus,
  Repeat,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { TipoCuenta } from "@/domain/cuenta/naturaleza";

/**
 * Lucide, 20 px, trazo 1,5, en el color del texto que acompañan (currentColor).
 * Uno por destino de navegación y uno por tipo de cuenta.
 * Las filas de movimientos NO llevan icono.
 */
export type DestinoNavegacion =
  | "resumen"
  | "movimientos"
  | "cuentas"
  | "deudas"
  | "registrar"
  | "avisos"
  | "recurrentes"
  | "inversiones"
  | "metas";

export const ROTULO_DESTINO: Record<DestinoNavegacion, string> = {
  resumen: "Resumen",
  movimientos: "Movimientos",
  cuentas: "Cuentas",
  deudas: "Deudas",
  registrar: "Registrar",
  avisos: "Avisos",
  recurrentes: "Recurrentes",
  inversiones: "Inversiones",
  metas: "Metas",
};

const ICONO_DESTINO: Record<DestinoNavegacion, LucideIcon> = {
  resumen: ChartNoAxesColumn,
  movimientos: List,
  cuentas: BookOpen,
  deudas: Users,
  registrar: Plus,
  avisos: Bell,
  recurrentes: Repeat,
  inversiones: TrendingUp,
  metas: Target,
};

const ICONO_CUENTA: Record<TipoCuenta, LucideIcon> = {
  efectivo: Wallet,
  banco: Landmark,
  tarjeta_credito: CreditCard,
  inversion: TrendingUp,
  prestamo_otorgado: ArrowUpRight,
  deuda_contraida: ArrowDownLeft,
};

export const ROTULO_TIPO_CUENTA: Record<TipoCuenta, string> = {
  efectivo: "Efectivo",
  banco: "Banco",
  tarjeta_credito: "Tarjeta de crédito",
  inversion: "Inversión",
  prestamo_otorgado: "Préstamo otorgado",
  deuda_contraida: "Deuda contraída",
};

export function IconoNavegacion({ destino }: { destino: DestinoNavegacion }) {
  const Icono = ICONO_DESTINO[destino];
  return <Icono size={20} strokeWidth={1.5} aria-hidden />;
}

export function IconoCuenta({ tipo }: { tipo: TipoCuenta }) {
  const Icono = ICONO_CUENTA[tipo];
  return <Icono size={20} strokeWidth={1.5} aria-hidden />;
}
