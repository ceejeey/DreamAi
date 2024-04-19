"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";
import React, { LegacyRef, useEffect, useRef, useState } from "react";
import { BsRobot } from "react-icons/bs";
import { PiSealQuestionThin } from "react-icons/pi";
import { useToast } from "@/components/ui/use-toast";
import { stripIndent, oneLine } from "common-tags";
import { createClient } from "@/utils/supabase/client";

export default function Search() {
  const router = useRouter();
  const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>;
  const { toast } = useToast();
  const [questions, setQuestion] = useState<string[]>([]);
  const [answers, setAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const toastError = (message = "Something went wrong") => {
    toast({
      title: "Fail to create embedding",
      description: message,
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    const searchText = inputRef.current.value;
    inputRef.current.value = "";

    if (searchText && searchText.trim()) {
      setQuestion((currentQuestion) => [...currentQuestion, searchText]);
      const res = await fetch(location.origin + "/embedding", {
        method: "POST",
        body: JSON.stringify({ text: searchText.replace(/\n/g, " ") }),
      });

      if (res.status !== 200) {
        toastError();
      } else {
        const data = await res.json();

        const { data: documents } = await supabase.rpc("match_documents", {
          query_embedding: data?.embedding?.values,
          match_threshold: 0.2,
          match_count: 1,
        });

        let tokenCount = 0;
        let contextText = "";
        for (let i = 0; i < documents?.length; i++) {
          const document = documents[i];
          const content = document?.content;
          tokenCount += document?.token;

          if (tokenCount > 1500) {
            break;
          }
          contextText += `${content.trim()}\n--\n`;
        }
        const prompt = generatePrompt(contextText, searchText);
        await generateAnswer(prompt);
        // if (contextText) {
        //   const prompt = generatePrompt(contextText, searchText);
        //   await generateAnswer(prompt);
        // } else {
        //   setAnswer((currentAnswer) => [
        //     ...currentAnswer,
        //     "Sorry there is no context related to this question. Please ask something about Sokheng",
        //   ]);
        // }
      }
    }

    setLoading(false);
  };

  const generateAnswer = async (prompt: string) => {
    const res = await fetch(location.origin + "/chat", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    if (res.status !== 200) {
      // toastError();
      setAnswer((currentAnswer) => [
        ...currentAnswer,
        "Oh my child, Your lord is taking rest come later",
      ]);
    } else {
      const data = await res.json();
      setAnswer((currentAnswer) => [...currentAnswer, data.choices]);
    }
  };

  const generatePrompt = (contextText: string, searchText: string) => {
    const prompt = stripIndent`${oneLine`
    You are a very enthusiastic Dream mystical indian guru who loves
    to help people! Given the following sections from the Dream
    documentation or make up something people can relate and always give answer like you know evertthing, keep Philosophical and Reflective Tone, Use of Analogies and Metaphorical Language also be very emphathetic, answer the question using only that information,
    outputted in markdown format 
	`}





    Context sections:

	${searchText}

   

    Answer as markdown 
  `;
    return prompt;
  };

  const conversationEl: LegacyRef<HTMLDivElement> = useRef(null);
  useEffect(() => {
    if (conversationEl.current) {
      conversationEl.current.scroll({
        top: conversationEl.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [answers, questions]);

  return (
    <>
      <div className=" overflow-y-auto space-y-10 " ref={conversationEl}>
        <div className="flex items-center justify-between  pb-3">
          <div className="flex items-center gap-2">
            <BsRobot className="w-5 h-5" />
            <h1>Daily AI</h1>
          </div>
          {/* <Button onClick={handleLogout}>Logout</Button> */}
        </div>
        {questions.map((question, index) => {
          const answer = answers[index];

          const isLoading = loading && !answer;

          return (
            <div className="space-y-3  " key={index}>
              <div className="flex items-center gap-2 text-indigo-500 bg-[#1f1e1e] p-5 rounded-lg">
                <PiSealQuestionThin className="w-5 h-5" />
                <h1 className="">{question}</h1>
              </div>
              {isLoading ? (
                <h1 className="text-gray-500 ">Loading...</h1>
              ) : (
                <div className="flex items-center gap-2 text-gray-300 bg-[#1f1e1e] p-5 rounded-lg">
                  <PiSealQuestionThin className="w-5 h-5" />
                  <h1 className="">{answer}</h1>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Input
        ref={inputRef}
        placeholder="Describe your dream!"
        className="p-5 text-white mt-10"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
    </>
  );
}
