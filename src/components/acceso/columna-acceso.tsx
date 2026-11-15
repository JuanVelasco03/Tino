import type { ReactNode } from "react";

/** Columna de acceso (login y registro): marca, lema, raya, contenido y nota de privacidad. */
export function ColumnaAcceso({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[380px] flex-col gap-7">
        <div className="flex flex-col gap-2">
          <span className="text-[32px] font-bold leading-10 tracking-[0.16em]">TINO</span>
          <span className="text-[17px] leading-[26px] text-secundario">
            Tu libro de cuentas personal.
          </span>
        </div>
        <div className="flex flex-col gap-4 border-t border-raya pt-5">{children}</div>
        <span className="text-[12px] leading-[18px] text-secundario">
          Sin conexión con tu banco: todo lo registras tú. Tus datos son solo tuyos.
        </span>
      </div>
    </main>
  );
}
