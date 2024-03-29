import type { GetStaticProps, NextPage } from "next";

import React from "react";
import Head from "next/head";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import Image from "next/image";

import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import PageLayout from "~/components/layout";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({ username });

  if (!data) return <div>Not found</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
        <meta content="Generated by create-t3-app" name="description" />
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image
            alt={`${data.username ?? ""}'s profile pic`}
            // eslint-disable-next-line tailwindcss/enforces-negative-arbitrary-values
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-2 border-black"
            height={128}
            src={data.profileImageUrl}
            width={128}
          />
        </div>
        <div className="h-[64px]" />
        <div className="p-4 text-2xl font-bold">{`@${data.username ?? ""}`}</div>
        <div className="w-full border-b border-slate-400" />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("Invalid slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default ProfilePage;
