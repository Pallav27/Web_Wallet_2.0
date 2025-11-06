"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import BeamsBackground from "@/components/kokonutui/beams-background";
import AttractButton from "@/components/kokonutui/attract-button";
import CardFlip from "@/components/kokonutui/card-flip";
import SwitchButton from "@/components/kokonutui/switch-button";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";

const page = () => {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    // initialize theme from localStorage if present, otherwise default to dark
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      } else {
        // default dark
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    } catch (e) {
      // if localStorage is unavailable, default to dark
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch (e) {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch (e) {}
    }
  };

  const clerk = useClerk();

  return (
    <div>
      {/* Hero / beams background with custom children */}
      <BeamsBackground>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight text-neutral-900 dark:text-white">
          Web Wallet 2.0
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-neutral-700 dark:text-neutral-300">
          Your secure and simple payments experience — control your assets with ease.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <SignedOut>
            <AttractButton onClick={() => clerk.openSignIn()}>
              Sign In
            </AttractButton>

            <AttractButton onClick={() => clerk.openSignUp()}>
              Sign Up
            </AttractButton>
          </SignedOut>

          <SignedIn>  
            <AttractButton>Dashboard 
              <UserButton />
            </AttractButton>
            
          </SignedIn>
        </div>

        {/* top-right theme toggle */}
        <div className="absolute top-6 right-6 z-20">
          <SwitchButton onClick={toggleTheme} />
        </div>

        <div className="mt-8 flex flex-row gap-6 items-start justify-center">
          <CardFlip />
          <CardFlip />
        </div>
      </BeamsBackground>
    </div>
  );
};

export default page;