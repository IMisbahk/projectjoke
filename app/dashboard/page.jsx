"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [jokeText, setJokeText] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          } else {
            console.error("User document not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error.message);
        }
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="p-6 flex justify-between items-center">
        <div className="h-8 w-32 bg-gray-300 rounded" />
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-300 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        User not found.
      </div>
    );
  }

  const initials = user.firstName[0] + (user.lastName ? user.lastName[0] : "");

  const submitJoke = async () => {
    if (!auth.currentUser || !jokeText.trim()) return;

    const userId = auth.currentUser.uid;
    const jokeRef = doc(db, "jokes", userId);
    const newJoke = {
      text: jokeText,
      upvote: 0,
      downvote: 0,
      timestamp: new Date(),
    };

    try {
      const jokeDoc = await getDoc(jokeRef);

      if (jokeDoc.exists()) {
        await updateDoc(jokeRef, { jokes: arrayUnion(newJoke) });
      } else {
        await setDoc(jokeRef, { userId, jokes: [newJoke] });
      }

      setJokeText("");

      toast("Joke posted successfully!", {
        description: jokeText,
        action: {
          label: "Undo",
          onClick: async () => {
            const updatedJokes = jokeDoc.exists()
              ? jokeDoc.data().jokes.filter((j) => j.text !== jokeText)
              : [];

            await updateDoc(jokeRef, { jokes: updatedJokes });

            toast("Joke deleted!", { description: "Your joke was removed." });
          },
        },
      });
    } catch (error) {
      console.error("Error submitting joke:", error);
      toast("Error posting joke!", { description: error.message });
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>DADabase</h1>
        <div className={styles.dashboardActions}>
          <ModeToggle />
          <Button variant="ghost" onClick={() => router.push("/profile")}>
            <Avatar>
              <AvatarImage src={user.profileImage || ""} alt="Profile" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>

      <div className={styles.jokeContainer}>
        <div className={styles.jokeInputWrapper}>
          <Textarea
            className={styles.jokeInput}
            placeholder="Post a joke..."
            value={jokeText}
            onChange={(e) => setJokeText(e.target.value)}
          />
          <Button className={styles.jokeSubmit} onClick={submitJoke}>
            Send
          </Button>
        </div>
      </div>

      {/* Cards Section */}
      <div className={styles.cardsContainer}>
        {/* Leaderboard Card */}
        <Link href="/leaderboard">
          <Card className={styles.dashboardCard}>
            <CardHeader>
              <CardTitle>🏆 Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              See the top jokesters with the most DadPoints!
            </CardContent>
          </Card>
        </Link>

        {/* Jokes Card */}
        <Link href="/jokes">
          <Card className={styles.dashboardCard}>
            <CardHeader>
              <CardTitle>😂 Jokes</CardTitle>
            </CardHeader>
            <CardContent>
              Check out the latest dad jokes from everyone!
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
