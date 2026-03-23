import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import Toast from '@/components/ui/Toast';
import SupabaseInit from '@/components/SupabaseInit';

export const metadata: Metadata = {
  title: '프랑스 여행 플래너',
  description: '니스 & 파리 11일 여행 일정 관리',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <SupabaseInit />
        {children}
        <BottomNav />
        <Toast />
      </body>
    </html>
  );
}
