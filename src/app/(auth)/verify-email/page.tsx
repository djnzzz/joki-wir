import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

interface Props {
  searchParams: { token?: string; email?: string };
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, email } = searchParams;

  // Tidak ada token/email → redirect ke login
  if (!token || !email) {
    redirect(ROUTES.login);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const res = await fetch(
      `${baseUrl}${ROUTES.api.auth.verifyEmail}?token=${token}&email=${encodeURIComponent(email)}`,
      { cache: "no-store" },
    );

    const data = await res.json();

    if (data.success) {
      // Sukses → redirect ke login dengan query param sukses
      redirect(`${ROUTES.login}?verified=true`);
    } else {
      // Gagal → redirect ke login dengan pesan error
      redirect(`${ROUTES.login}?error=${encodeURIComponent(data.error)}`);
    }
  } catch {
    redirect(`${ROUTES.login}?error=Gagal+verifikasi+email`);
  }
}
