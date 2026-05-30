import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Login | Jokiwir",
    template: "%s | Jokiwir",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      {children}
    </main>
  );
}
