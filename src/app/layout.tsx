import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeApplier } from "@/components/shell/ThemeApplier";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "doro-doro — 1인 전용 초집중 워크스페이스",
    template: "%s · doro-doro",
  },
  description:
    "뽀모도로 타이머, 타임박싱 보드, 캘린더, 퓨처백 플래너를 한 화면에. 모든 데이터는 브라우저(IndexedDB)에만 저장되고 서버로 나가지 않습니다.",
  applicationName: "doro-doro",
  keywords: [
    "pomodoro",
    "timeboxing",
    "calendar",
    "focus",
    "productivity",
    "뽀모도로",
    "타임박싱",
    "집중",
    "생산성",
  ],
  authors: [{ name: "doro-doro" }],
  openGraph: {
    title: "doro-doro — 1인 전용 초집중 워크스페이스",
    description:
      "타이머·타임박싱·캘린더·퓨처백을 단축키 하나로. 데이터는 기기에만 저장됩니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "doro-doro",
  },
  twitter: {
    card: "summary_large_image",
    title: "doro-doro",
    description:
      "키보드 우선 집중 워크스페이스 — 뽀모도로·타임박싱·캘린더·퓨처백 통합, 오프라인 우선.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
