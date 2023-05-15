import React from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";

import { type RouterOutputs, api } from "~/utils/api";
import LoadingSpinner, { LoadingPage } from "~/components/loading";
import PageLayout from "~/components/layout";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [content, setContent] = React.useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setContent("");
      void ctx.posts.getAll.invalidate();
    },

    onError: (e) => {
      const errrorMessage = e.data?.zodError?.fieldErrors?.content;

      if (errrorMessage && errrorMessage[0]) toast.error(errrorMessage[0]);
      else toast.error("Failed to post. Please try again later.");
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        alt="user profile picture"
        className="h-14 w-14 rounded-full"
        height={56}
        src={user.profileImageUrl}
        width={56}
      />
      <input
        className="grow bg-transparent outline-none"
        disabled={isPosting}
        placeholder="Type some emojis!"
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && content !== "") {
            mutate({ content });
          }
        }}
      />
      {content !== "" && !isPosting && (
        <button
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          disabled={isPosting}
          onClick={() => {
            mutate({ content });
          }}
        >
          Post
        </button>
      )}

      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        alt={`@${author.username}'s profile picture`}
        className="h-14 w-14 rounded-full"
        height={56}
        src={author.profileImageUrl}
        width={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` · ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start loading posts immediately
  api.posts.getAll.useQuery();

  // Return empty div if user is not loaded
  if (!userLoaded) return <div />;

  return (
    <>
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">
          {!isSignedIn && (
            <div className="flex justify-center">
              <SignInButton mode="modal" />
            </div>
          )}
          {isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
