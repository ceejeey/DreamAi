import React from "react";
import AuthComponent from "./components/AuthComponent";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function page() {
  // const supabase = createClient();

  // const { data } = await supabase.auth.getUser();

  // if (data.user) {
  //   redirect("/");
  // }

  return <AuthComponent />;
}
