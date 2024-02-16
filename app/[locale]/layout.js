import "./globals.scss";
import "swiper/css";
import "swiper/css/navigation";
import "../../public/css/bootstrap.min.css";
import "../../public/css/style.css";
import Layout from "./components/layout/Layout";
import "../../public/css/responsive.css";
import { Inter } from "next/font/google";
import { createSharedPathnamesNavigation } from "next-intl/navigation";
import NextTopLoader from "nextjs-toploader";

import { NextIntlClientProvider, useMessages } from "next-intl";
import { notFound } from "next/navigation";
import Providers from "./components/Providers";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/[...nextauth]/options";
import ToastContainerWrapper from "./components/toasProvider";
import { unstable_setRequestLocale } from "next-intl/server";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "IVIZA",
  description: "iviza.az",
};
const locales = ["az", "en", "ru"];

export default async function LocaleLayout({ children, params: { locale } }) {
  if (!locales.includes(locale)) notFound();

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  const { Link, redirect, usePathname, useRouter } =
    createSharedPathnamesNavigation({ locales });
  const session = await getServerSession(options);

  return (
    <html lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <body className={inter.className}>
          <Providers session={session}>
            <NextTopLoader />

            <Layout HeaderStyle="three">{children}</Layout>
            <ToastContainerWrapper />
          </Providers>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
