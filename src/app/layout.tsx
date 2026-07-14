import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuardTerms - 약관 요약 및 정보 보호 서비스",
  description: "AI 기반으로 서비스 약관을 요약하고, 개인정보 수집 동의 조절을 통해 정보 탈취 위험을 진단하고 예방하는 서비스입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F2F4F6] text-[#191F28] antialiased">
        {children}
      </body>
    </html>
  );
}

