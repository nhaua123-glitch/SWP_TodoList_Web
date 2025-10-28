import "./globals.css";
import PresenceManager from "@/app/components/PresenceManager";

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
        {children}
      </body>
    </html>
  );
}




