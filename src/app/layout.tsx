import type { Metadata } from "next";
import { DemoProvider } from "@/components/demo-provider";
import { Shell } from "@/components/shell";
import { FavoritesProvider } from "@/components/favorites";
import { LocaleProvider } from "@/components/locale-provider";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./globals.css";
import "./tokens.css";
export const metadata: Metadata = {
  title: "SanaLink — реальные задачи, сильные команды",
  description:
    "Открытая площадка для бизнес-задач и студенческих команд. Демо AI Sana.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <LocaleProvider>
          <DemoProvider>
            <FavoritesProvider>
              <Shell>{children}</Shell>
            </FavoritesProvider>
          </DemoProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
