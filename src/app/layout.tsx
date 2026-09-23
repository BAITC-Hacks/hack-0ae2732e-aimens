import type { Metadata } from "next";
import { DemoProvider } from "@/components/demo-provider";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "Практика — реальные задачи, новые возможности",
  description:
    "Открытая площадка для бизнес-задач и студенческих команд. Демо AI Sana.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <DemoProvider>
          <Shell>{children}</Shell>
        </DemoProvider>
      </body>
    </html>
  );
}
