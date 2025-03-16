"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase"; // Adjust import based on your setup
import { onAuthStateChanged } from "firebase/auth";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard"); // Redirect if logged in
      } else {
        router.push("/login"); // Redirect to sign-in page
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return null; // This will never be shown as user gets redirected
}
