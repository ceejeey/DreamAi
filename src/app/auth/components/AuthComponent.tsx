// "use client";
import React from "react";
import { Button } from "@/components/ui/button";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default function AuthComponent() {
  // const supabase = createClientComponentClient();

  const handleLoginWithGithub = async () => {
    "use server";
    const supabase = createClient();
    const origin = headers().get("origin");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.log("🚀 ~ handleLoginWithGithub ~ server:", "server");
      console.log("error");
    } else {
      return redirect(data.url);
    }
  };

  return (
    <div className=" w-full h-screen flex justify-center items-center">
      <div className="w-96 border shadow-sm p-5 rounded-sm space-y-3">
        <h1 className=" font-bold text-lg">{"Welcome to Daily's AI"}</h1>
        <p className="text-sm">
          {
            " It is platform that build using Supabase and Chatgpt's API to create a ChatGPT like that can answer with our own knowledeg base."
          }
        </p>
        <form action={handleLoginWithGithub}>
          <Button className="w-full bg-indigo-500">Login With Github</Button>
        </form>
      </div>
    </div>
  );
}
