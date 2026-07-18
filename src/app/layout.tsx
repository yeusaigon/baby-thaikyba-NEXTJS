import "./globals.css";
import "./responsive.css";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "ThaiKyPro - Trợ lý thai sản thông minh",
  description: "Hành trình 40 tuần hạnh phúc cùng mẹ và bé yêu. Ứng dụng theo dõi và nhắc nhở mốc thai kỳ.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
      <Script id="register-service-worker" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('ServiceWorker registered with scope: ', reg.scope);
              }).catch(function(err) {
                console.error('ServiceWorker registration failed: ', err);
              });
            });
          }
        `}
      </Script>
    </html>
  );
}
