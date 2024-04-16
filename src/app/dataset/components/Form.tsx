"use client";
import React, { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { FilePond } from "react-filepond";

export default function Form() {
  const supabase = createClient();
  const { toast } = useToast();

  const inputRef = useRef() as React.MutableRefObject<HTMLTextAreaElement>;
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<any>();

  const toastError = (message = "Something went wrong") => {
    toast({
      title: "Fail to create embedding",
      description: message,
    });
  };

  const handleCreateEmbeddings = async (data) => {
    setLoading(true);
    if (data && data.trim()) {
      const res = await fetch(location.origin + "/embedding", {
        method: "POST",
        body: JSON.stringify({ text: data.replace(/\n/g, " ") }),
      });

      if (res.status !== 200) {
        toastError();
      } else {
        const result = await res.json();
        const embedding = result?.embedding?.values;
        const token = result.token;

        const { error } = await supabase.from("documents").insert({
          data,
          embedding,
          token,
        });
        if (error) {
          toastError(error.message);
        } else {
          toast({
            title: "Successfully create embedding.",
          });
          inputRef.current.value = "";
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    // setLoading(true);
    const content = inputRef.current.value;
    handleCreateEmbeddings(content);

    // if (content && content.trim()) {
    //   const res = await fetch(location.origin + "/embedding", {
    //     method: "POST",
    //     body: JSON.stringify({ text: content.replace(/\n/g, " ") }),
    //   });

    //   if (res.status !== 200) {
    //     toastError();
    //   } else {
    //     const result = await res.json();
    //     const embedding = result?.embedding?.values;
    //     const token = result.token;

    //     const { error } = await supabase.from("documents").insert({
    //       content,
    //       embedding,
    //       token,
    //     });
    //     if (error) {
    //       toastError(error.message);
    //     } else {
    //       toast({
    //         title: "Successfully create embedding.",
    //       });
    //       inputRef.current.value = "";
    //     }
    //   }
    // }
    // setLoading(false);
  };

  async function handleSubmitPdf(e) {
    e.preventDefault();
    const formData = new FormData();

    formData.append("title", "dreamAi.pdf");
    formData.append("title", file);

    const response = await fetch(location.origin + "/api/pdf", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    handleCreateEmbeddings(result.data);
    // console.log(result.data); // Output the extracted text
  }

  return (
    <>
      <Textarea
        placeholder="Add your dataset"
        className="h-96"
        ref={inputRef}
      />
      <Button className="w-full flex gap-2" onClick={handleSubmit}>
        {loading && (
          <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
        )}
        Submit
      </Button>
      {/* <form onSubmit={handleSubmitPdf}> */}
      <input
        type="file"
        name="file"
        required
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" onClick={handleSubmitPdf}>
        Convert PDF
      </button>
      {/* <FilePond
        server={{
          process: "/api/pdf",
          fetch: null,
          revert: null,
        }}
      /> */}
      {/* </form> */}
    </>
  );
}
