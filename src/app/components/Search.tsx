"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
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
    inputRef.current.value = "";
    setLoading(false);
  };

  const generateAnswer = async (prompt: string) => {
    const res = await fetch(location.origin + "/chat", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    if (res.status !== 200) {
      toastError();
    } else {
      const data = await res.json();
      console.log("🚀 ~ generateAnswer ~ data:", data.choices);
      setAnswer((currentAnswer) => [...currentAnswer, data.choices]);
    }
  };

  const generatePrompt = (contextText: string, searchText: string) => {
    const prompt = stripIndent`${oneLine`
    You are a very enthusiastic Dream interpreting expert who loves
    to help people! Given the following sections from the Dream
    documentation or make up something people can relate, answer the question using only that information,
    outputted in markdown format. 
	`}

    Context sections:
    ${contextText}

    Question: """
    ${searchText}
    """

    Answer as markdown (including related code snippets if available):
  `;
    return prompt;
  };

  return (
    <>
      <div className="flex-1 h-80vh overflow-y-auto space-y-10 ">
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
            <div className="space-y-3" key={index}>
              <div className="flex items-center gap-2 text-indigo-500">
                <PiSealQuestionThin className="w-5 h-5" />
                <h1>{question}</h1>
              </div>
              {isLoading ? (
                <h1>Loading...</h1>
              ) : (
                <p className="text-gray-300">{answer}</p>
              )}
            </div>
          );
        })}
      </div>
      <Input
        ref={inputRef}
        placeholder="Ask daily ai a question"
        className="p-5 text-white"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
    </>
  );
}
