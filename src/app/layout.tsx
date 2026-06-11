import "./globals.css";
import "./responsive.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThaiKyPro - Trợ lý thai sản thông minh",
  description: "Hành trình 40 tuần hạnh phúc cùng mẹ và bé yêu. Ứng dụng theo dõi và nhắc nhở lịch khám thai.",
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
      <head>
        {/* Font chữ Be Vietnam Pro đã được import qua CSS file */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('ServiceWorker registered with scope: ', reg.scope);
                  }).catch(function(err) {
                    console.error('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
