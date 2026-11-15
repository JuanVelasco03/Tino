import { NextResponse, type NextRequest } from "next/server";
import { confirmarEnlace } from "@/services/autenticacion";

const TIPOS_ACEPTADOS = ["email", "signup"] as const;

/** Destino del enlace del correo de confirmación: verifica el token e inicia sesión. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = TIPOS_ACEPTADOS.find((t) => t === searchParams.get("type"));

  const verificado = tokenHash && tipo ? await confirmarEnlace(tokenHash, tipo) : false;

  const destino = verificado ? "/" : "/login?error=confirmacion";
  return NextResponse.redirect(new URL(destino, request.url));
}
