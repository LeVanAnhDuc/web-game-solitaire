import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klondike Solitaire",
  description: "Một ván Klondike chơi ngay trong trình duyệt. Không tài khoản, không quảng cáo.",
};

export const viewport: Viewport = {
  // The board is sized to the viewport width; letting the page zoom would reintroduce
  // the horizontal scroll FR-11 exists to prevent.
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b3d2e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
