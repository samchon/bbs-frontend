import type { Metadata } from "next";
import "../src/styles/global.css";
import { AppShell } from "../src/shared/components/AppShell";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Community board",
  description: "A small BBS frontend built against the samchon BBS SDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
