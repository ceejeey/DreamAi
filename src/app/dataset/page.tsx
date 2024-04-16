import React from "react";

import { redirect } from "next/navigation";
import { BsDatabase } from "react-icons/bs";
import Form from "./components/Form";
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = createClient();

  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/auth");
  }

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (user?.role !== "admin") {
    return redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex justify-center items-center">
      <div className="w-full p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BsDatabase className="w-5 h-5" />
          <h1>Daily AI dataset</h1>
        </div>
        <Form />
      </div>
    </div>
  );
}
