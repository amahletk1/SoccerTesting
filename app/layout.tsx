import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PlayerFynder | Football Talent Network",
  description:
    "Discover African football talent and connect players, scouts and agents through PlayerFynder.",
  icons: {
    icon: "/player-fynder-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: "#080f0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#101c1b",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "500",
              padding: "12px 16px",
              boxShadow: "0 12px 35px rgba(0, 0, 0, 0.35)",
            },
            success: {
              iconTheme: {
                primary: "#00e676",
                secondary: "#080f0f",
              },
            },
            error: {
              iconTheme: {
                primary: "#ff5252",
                secondary: "#080f0f",
              },
            },
          }}
        />
      </body>
    </html>
  );
}