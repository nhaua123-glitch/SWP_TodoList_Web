import "./globals.css";
import PresenceManager from "@/app/components/PresenceManager";
import HeaderUserBar from "@/app/components/HeaderUserBar";
import BackgroundApplier from "@/app/components/BackgroundApplier";

export const metadata = {
  title: "My App",
  description: "Login Page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Theo dõi trạng thái online/offline */}
        <PresenceManager />
        {/* Apply persisted background across pages */}
        <BackgroundApplier />
        {/* Global user popover (avatar + profile view) */}
        <HeaderUserBar />
        {children}
      </body>
    </html>
  );
}




