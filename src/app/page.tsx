import { Boton } from "@/components/boton";
import { salir } from "./(acceso)/acciones";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Tino
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Next.js + Tailwind CSS
      </p>
      <form action={salir}>
        <Boton type="submit" variante="secundario">
          Salir
        </Boton>
      </form>
    </main>
  );
}
