"use client"
import CardFlip from '@/components/kokonutui/card-flip'
import React from 'react'
import SwitchButton from '@/components/kokonutui/switch-button'
import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'

const contactus = () => {

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

  return (
    <div className='relative min-h-screen'>
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <div className="w-10 h-10 px-10 flex items-center justify-center rounded-md bg-white/5 backdrop-blur-sm dark:bg-black/20">
          <SwitchButton onClick={toggleTheme} aria-label="Toggle theme" />
        </div>
        <div className="w-10 h-10 px-10 flex items-center justify-center rounded-md bg-white/5 backdrop-blur-sm dark:bg-black/20">
          <UserButton />
        </div>
      </div>
    </div>
  )
}

export default contactus