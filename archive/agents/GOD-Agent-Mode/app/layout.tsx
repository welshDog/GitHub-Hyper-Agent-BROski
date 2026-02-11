export const metadata = {
  title: "Hyperflow Editor",
  description: "Gods Agents Mode",
};

import "./globals.css";

import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
