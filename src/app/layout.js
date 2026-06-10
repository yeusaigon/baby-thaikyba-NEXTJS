import "./globals.css";

export const metadata = {
  title: "AuraAI — The Intelligent Workspace for Teams",
  description: "AuraAI optimizes your creative workflow, generates high-performing content, and organizes your files in a premium glassmorphic workspace.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
