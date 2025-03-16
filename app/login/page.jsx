'use client';

import { LoginForm } from "@/components/login-form"
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function LoginPage() {
  const { setTheme } = useTheme(); 

  useEffect(() => {
    setTheme("system"); 
  }, []);
  return (
    <div
      className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-large">
          DADabase
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
