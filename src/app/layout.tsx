import type { Metadata, Viewport } from "next";
import ActivityTracker from "@/components/activity-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamPilot — Study with direction",
  description: "Your academic planner for smarter, calmer exam preparation.",
  applicationName: "ExamPilot",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f6f8fc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<ActivityTracker /></body>
    </html>
  );
}
