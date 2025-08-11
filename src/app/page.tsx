import React from "react";
import Search from "./components/Search";
import ComplexityNavigation from "@/components/complexityNavigation";

export default async function Page() {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col px-5 md:px-10 py-10 min-h-screen">
      {/* Original Dream AI Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h1 className="md:text-[130px] text-5xl text-center leading-[.75] text-white md:pl-12 z-10 p-10 py-10">
            DECODING DREAMS
          </h1>
        </div>
        <div className="flex items-start justify-center md:w-2/3 w-[98%] mx-auto">
          <div className="relative group w-full flex flex-1">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative px-7 py-4 bg-black rounded-lg leading-none flex flex-col flex-1 justify-end w-full divide-x divide-gray-600 h-[70vh]">
              <Search />
            </div>
          </div>
        </div>
      </div>

      {/* SonarQube Complexity Demonstration Section */}
      <div className="mb-8">
        <ComplexityNavigation />
      </div>
    </div>
  );
}
