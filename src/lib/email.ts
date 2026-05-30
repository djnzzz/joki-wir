const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "joki-wir";
const FROM = `${APP_NAME} <onboarding@resend.dev>`;

// Lazy-load Resend agar tidak error saat belum di-install
async function getResend() {
  const { Resend } = await import("resend");
  return new Resend(process.env.RESEND_API_KEY!);
}

// Template helper
function emailWrapper(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">${APP_NAME}</h1>
      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
      ${content}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">
        Email ini dikirim otomatis oleh sistem ${APP_NAME}. Jangan balas email ini.
      </p>
    </body>
    </html>
  `;
}

// Kirim email verifikasi
export async function sendVerificationEmail({
  name,
  email,
  token,
}: {
  name: string;
  email: string;
  token: string;
}) {
  const url = `${APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const resend = await getResend();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Verifikasi email kamu — ${APP_NAME}`,
    html: emailWrapper(`
      <p>Halo <strong>${name}</strong>,</p>
      <p>Klik tombol di bawah untuk verifikasi email kamu. Link berlaku <strong>24 jam</strong>.</p>
      <a href="${url}"
         style="display: inline-block; background: #111; color: #fff;
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                font-weight: 600; margin: 16px 0;">
        Verifikasi Email
      </a>
      <p style="font-size: 13px; color: #666;">
        Atau copy link ini ke browser:<br/>
        <a href="${url}" style="color: #555;">${url}</a>
      </p>
    `),
  });
}

// Kirim email reset password
export async function sendPasswordResetEmail({
  name,
  email,
  token,
}: {
  name: string;
  email: string;
  token: string;
}) {
  const url = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const resend = await getResend();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Reset password — ${APP_NAME}`,
    html: emailWrapper(`
      <p>Halo <strong>${name}</strong>,</p>
      <p>Kami menerima permintaan reset password untuk akun kamu. Klik tombol di bawah. Link berlaku <strong>1 jam</strong>.</p>
      <a href="${url}"
         style="display: inline-block; background: #111; color: #fff;
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                font-weight: 600; margin: 16px 0;">
        Reset Password
      </a>
      <p style="font-size: 13px; color: #666;">
        Jika kamu tidak meminta reset password, abaikan email ini.
      </p>
    `),
  });
}

// Kirim notifikasi order
export async function sendOrderNotificationEmail({
  name,
  email,
  orderNumber,
  message,
}: {
  name: string;
  email: string;
  orderNumber: string;
  message: string;
}) {
  const url = `${APP_URL}/orders`;
  const resend = await getResend();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Update Order ${orderNumber} — ${APP_NAME}`,
    html: emailWrapper(`
      <p>Halo <strong>${name}</strong>,</p>
      <p>${message}</p>
      <a href="${url}"
         style="display: inline-block; background: #111; color: #fff;
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                font-weight: 600; margin: 16px 0;">
        Lihat Order
      </a>
    `),
  });
}
