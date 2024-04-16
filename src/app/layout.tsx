import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}  bg-[#303030] `}>
        <div className="min-h-[100vh] ">
          <div className="bg-[url('/sub.jpg')] absolute top-0 bottom-0 left-0 right-0 bg-repeat opacity-10"></div>
          {/* <Image
            src="/sub.jpg"
            fill
            className="opacity-20 -z-10 repeat-"
            alt="DreamAi"
            
          /> */}
          {children} <Toaster />
        </div>
      </body>
    </html>
  );
}
