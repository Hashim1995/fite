import React from "react";
import dynamic from "next/dynamic";

import PageTitle from "../../components/sections/PageTitle";

import { getLocale, getTranslations } from "next-intl/server";
import { returnCurrentLangId } from "../../../../utils/currentLang";
import bg from "../../../../public/images/blog-bg.jpg";
import Page404 from "../../components/sections/Page404";
import Link from "next/link";

const BlogDetails = dynamic(
  () => import("../../components/sections/BlogDetails"),
  {
    loading: () => <p>Loading...</p>,
  }
);

export async function generateMetadata({ params }) {
  const id = params["slug]&[...id"][1];
  const t = await getLocale();
  const res = await fetch(
    `https://ivisavmlinux.azurewebsites.net/api/v1/blog/details?Id=${id}&Language=${returnCurrentLangId(
      t
    )}`,
    {
      method: "GET",
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res?.json(); // Correctly parsing the JSON data
  const item = data?.data; // Correctly parsing the JSON data
  const keywords = item?.tags?.join(", "); // Assuming tags is an array
  const title = item?.title || "Default title";
  const description = item?.description;

  return {
    title: title,
    keywords: keywords,
    description: description,
  };
}

async function getData(id) {
  try {
    const t = await getLocale();
    const res = await fetch(
      `https://ivisavmlinux.azurewebsites.net/api/v1/blog/details?Id=${id}&Language=${returnCurrentLangId(
        t
      )}`,
      {
        method: "GET",
      }
    );
    if (!res.ok) {
      return null;
    }
    return res?.json();
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null; // Indicate failure
  }
}

export default async function NewsDetail({ params }) {
  const id = params["slug]&[...id"][1];

  const res = await getData(id || 1);
  const data = res?.data;

  const t = await getTranslations();

  return (
    <>
      <PageTitle
        data={() => {
          return (
            <ul className="page-breadcrumb">
              <li>
                <Link href="/">{t("homePage")}</Link>
              </li>
              <li>
                <Link href="/news-grid">{t("blog")}</Link>
              </li>
              <li>{data?.title}</li>
            </ul>
          );
        }}
        bg={bg}
        title={data?.title}
      />
      {data ? <BlogDetails item={data} /> : <Page404 />}
    </>
  );
}
