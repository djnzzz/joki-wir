import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json({ success: false, error, details }, { status: 400 });
}

export function unauthorized(error = "Unauthorized") {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbidden(error = "Forbidden") {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function notFound(error = "Not found") {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

export function serverError(error = "Internal server error") {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

// Handler error otomatis — wrap semua route handler dengan ini
export function handleError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    return badRequest("Validasi gagal", error.flatten().fieldErrors);
  }

  if (error instanceof Error) {
    // Prisma: record tidak ditemukan
    if (error.message.includes("Record to update not found")) {
      return notFound();
    }
    // Prisma: unique constraint violated
    if (error.message.includes("Unique constraint failed")) {
      return badRequest("Data sudah ada");
    }
  }

  return serverError();
}
