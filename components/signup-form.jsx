"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm({ className, ...props }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const saveUserToFirestore = async (user, firstName, lastName) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        userID: user.uid,
        createdAt: serverTimestamp(),
        firstName,
        lastName,
        email: user.email,
        dadPoints: 0, 
      });
    } catch (error) {
      console.error("Error saving user data:", error.message);
    }
  };

  // Google Sign-Up
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Extract names from display name
      const nameParts = user.displayName ? user.displayName.split(" ") : ["", ""];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await saveUserToFirestore(user, firstName, lastName);
      router.push("/dashboard");
    } catch (error) {
      alert("Google Signup Error:", error.message);
    }
  };

  // Email/Password Sign-Up
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await saveUserToFirestore(user, firstName, lastName);
      router.push("/dashboard");
    } catch (error) {
      console.error("Email Signup Error:", error.code, error.message);
      alert(`Signup failed: ${error.message}`);
    }
  };
  

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>Sign up with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup}>
            <div className="grid gap-6">
              <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Sign up with Google
              </Button>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" type="text" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" type="text" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="At least 6 letters" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full">
                Sign up
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Log in
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
