"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import BeamsBackground from "@/components/kokonutui/beams-background";
import AttractButton from "@/components/kokonutui/attract-button";
import CardFlip from "@/components/kokonutui/card-flip";
import SwitchButton from "@/components/kokonutui/switch-button";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Loader from "@/components/kokonutui/loader";
import CardStackExample from "@/components/kokonutui/card-stack";

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
  const router = useRouter();
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [enter, setEnter] = useState(false);
  const signInTimeoutRef = React.useRef<number | null>(null);
  const signUpTimeoutRef = React.useRef<number | null>(null);
  const enterTimeoutRef = React.useRef<number | null>(null);


  const handleSignIn = () => {
    setSignInLoading(true);
    signInTimeoutRef.current = window.setTimeout(() => {
      setSignInLoading(false);
      clerk.openSignIn();
    }, 1500);
  };

  const handleSignUp = () => {
    setSignUpLoading(true);
    signUpTimeoutRef.current = window.setTimeout(() => {
      setSignUpLoading(false);
      clerk.openSignUp();
    }, 1500);
  };

  const enterdashboard = () => {
    setEnter(true);
    signUpTimeoutRef.current = window.setTimeout(() => {
      setEnter(false);
      router.push('/dashboard');
    }, 1500);
  };

  React.useEffect(() => {
    return () => {
      if (signInTimeoutRef.current) {
        clearTimeout(signInTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (signUpTimeoutRef.current) {
        clearTimeout(signUpTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      {/* Hero / beams background with custom children */}
      <BeamsBackground>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight text-neutral-900 dark:text-white">
          Web Wallet 2.0
        </h1>

        {/* <p className="max-w-2xl text-lg md:text-xl text-neutral-700 dark:text-neutral-300">
          Your secure and simple payments experience — control your assets with ease.
        </p> */}

        <div className="mt-4 flex items-center gap-3">
          <SignedOut>
            <AttractButton onClick={handleSignIn}>
              {signInLoading ? <Loader title="Signing In..." /> : "Sign In"}
            </AttractButton>

            <AttractButton onClick={handleSignUp}>
              {signUpLoading ? <Loader title="Signing Up..." /> : "Sign Up"}
            </AttractButton>
          </SignedOut>

          <SignedIn>
            <AttractButton onClick={enterdashboard}>
              {enter ? <Loader title="Configuring Dashboard..." /> : "Dashboard"}
            </AttractButton>
            <UserButton />
          </SignedIn>
        </div>
        <div className="absolute top-6 right-6 z-20">
          <SwitchButton onClick={toggleTheme} />
        </div>

        <div className="mt-8 flex flex-row gap-6 items-start justify-center">
          {/* Left card - fixed width so it doesn't shrink */}
          <div className="flex-none w-[280px]">
            <CardFlip 
            title="Scan & Pay"
            subtitle="Simplify payments"
            description="Pay or receive money instantly by scanning a secure QR code.
No manual entry, no delays — just tap, scan, and go."

            />
          </div>

          {/* Card stack - give it a fixed container and allow overflow so stacked cards are visible */}
          <div className="flex-none w-[420px] md:w-[520px] overflow-visible">
            <CardStackExample className="mx-auto" />
          </div>

          {/* Right card - fixed width */}
          <div className="flex-none w-[280px]">
            <CardFlip 
            
              title="Request Money"
            subtitle="Smart & seamless"
            description="Send or receive payment requests directly using a VPA ID.
Get notified in real time when your request is accepted or declined."

            />
          </div>
        </div>
        
      </BeamsBackground>
    </div>
  );
};

export default page;