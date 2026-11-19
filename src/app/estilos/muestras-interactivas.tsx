"use client";

import { useRef, useState } from "react";
import { Boton } from "@/components/boton";
import { CampoMonto } from "@/components/campo-monto";
import { IconoCuenta } from "@/components/iconos";
import { OpcionUnica } from "@/components/opcion-unica";
import { PanelLateral, type ControlPanel } from "@/components/panel-lateral";

type Tipo = "banco" | "efectivo" | "tarjeta_credito";

const OPCIONES = [
  { valor: "banco", rotulo: "Banco", icono: <IconoCuenta tipo="banco" /> },
  { valor: "efectivo", rotulo: "Efectivo", icono: <IconoCuenta tipo="efectivo" /> },
  { valor: "tarjeta_credito", rotulo: "Tarjeta de crédito", icono: <IconoCuenta tipo="tarjeta_credito" /> },
] as const;

/** C4 editable: formatea pesos al teclear. `sufijo` separa los ids de claro y oscuro. */
export function MuestraMontoEditable({ sufijo }: { sufijo: string }) {
  const [valor, setValor] = useState("1.284.300");
  const [vacio, setVacio] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <CampoMonto valor={vacio} moneda="COP" etiqueta="Saldo de hoy" editable={{ nombre: `monto-vacio-${sufijo}`, alCambiar: setVacio }} />
      <CampoMonto
        valor={valor}
        moneda="COP"
        etiqueta="Saldo inicial"
        editable={{ nombre: `monto-valor-${sufijo}`, alCambiar: setValor, nota: "Cambiarlo queda registrado." }}
      />
      <CampoMonto
        valor="0"
        moneda="COP"
        etiqueta="Cupo total"
        editable={{
          nombre: `monto-error-${sufijo}`,
          alCambiar: () => {},
          error: "La tarjeta necesita un cupo mayor que cero.",
        }}
      />
    </div>
  );
}

/** C34 · Opción única con ícono. */
export function MuestraOpcionUnica({ sufijo }: { sufijo: string }) {
  const [tipo, setTipo] = useState<Tipo>("banco");
  return <OpcionUnica nombre={`tipo-${sufijo}`} etiqueta="Tipo" opciones={OPCIONES} valor={tipo} alCambiar={setTipo} />;
}

/** C22 · Panel lateral: se abre sobre la página; Escape, «Cerrar» o el velo lo cierran. */
export function MuestraPanelLateral() {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<ControlPanel>(null);

  async function cerrar() {
    await panel.current?.cerrar();
    setAbierto(false);
  }

  return (
    <>
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        Abrir panel
      </Boton>
      {abierto && (
        <PanelLateral ref={panel} titulo="Panel lateral" alSolicitarCierre={() => void cerrar()}>
          <div className="flex flex-col gap-6">
            <p className="text-cuerpo text-secundario">
              Hoja de 400 px a la derecha con raya a la izquierda en escritorio; hoja inferior en móvil. Sin sombra.
            </p>
            <MuestraOpcionUnica sufijo="panel" />
            <MuestraMontoEditable sufijo="panel" />
            <Boton className="w-full justify-center" onClick={() => void cerrar()}>
              Listo
            </Boton>
          </div>
        </PanelLateral>
      )}
    </>
  );
}
