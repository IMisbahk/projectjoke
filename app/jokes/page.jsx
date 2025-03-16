"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import styles from "./jokes.module.css";
import { Terminal, X } from "lucide-react"
 
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { runTransaction } from "firebase/firestore";

export default function Jokes() {
  const [jokes, setJokes] = useState([]);
  const [users, setUsers] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJokes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jokes"));
        let jokesArray = [];
    
        querySnapshot.forEach((doc) => {
          const userJokes = (doc.data().jokes || []).map((joke) => ({
            ...joke,
            userId: doc.id, 
          }));
          jokesArray = [...jokesArray, ...userJokes];
        });
    
        jokesArray.sort((a, b) => b.timestamp - a.timestamp);
        setJokes(jokesArray);
      } catch (error) {
        console.error("Error fetching jokes:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersCollection = await getDocs(collection(db, "users"));
        let usersData = {};

        usersCollection.forEach((doc) => {
          usersData[doc.id] = {
            ...doc.data(),
            id: doc.id
          };
        });

        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers().then(fetchJokes);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);


  const handleVote = async (joke, type) => {
    if (!auth.currentUser) {
      setError("Please sign in to vote!");
      return;
    }
  
    const userId = auth.currentUser.uid;
    const jokeOwnerId = joke.userId;
    const jokeRef = doc(db, "jokes", jokeOwnerId);
  
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(jokeRef);
        if (!docSnap.exists()) {
          throw new Error("Joke not found!");
        }
  
        let jokesData = docSnap.data().jokes || [];
  
        const jokeIndex = jokesData.findIndex(
          (j) =>
            j.text === joke.text &&
            j.timestamp?.seconds === joke.timestamp?.seconds
        );
  
        if (jokeIndex === -1) {
          throw new Error("Joke not found!");
        }
  
        const currentJoke = jokesData[jokeIndex];
  
        if (!currentJoke.votedBy) {
          currentJoke.votedBy = {};
        }
  
        if (currentJoke.votedBy[userId]) {
          throw new Error("You've already voted on this joke!");
        }
  
        const updatedJoke = {
          ...currentJoke,
          upvote:
            type === "up"
              ? (currentJoke.upvote || 0) + 1
              : currentJoke.upvote || 0,
          downvote:
            type === "down"
              ? (currentJoke.downvote || 0) + 1
              : currentJoke.downvote || 0,
          votedBy: {
            ...currentJoke.votedBy,
            [userId]: type,
          },
        };
  
        jokesData[jokeIndex] = updatedJoke;
  
        transaction.update(jokeRef, { jokes: jokesData });
      });
  
      setError(null);
    } catch (error) {
      console.error("Error updating vote:", error);
      setError(error.message || "Failed to update vote. Please try again.");
    }
  };
  
  
  return (
    <div className={styles.jokesContainer}>
      {error && (
        <Alert className="fixed top-4 right-4 w-auto max-w-[300px] z-50">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Oops!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <button 
            onClick={() => setError(null)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      <div className="absolute top-4 left-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/jokes" className="text-muted-foreground">Jokes</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className={styles.jokesList}>
        {jokes.map((joke, index) => {
          const user = users[joke.userId] || {}; 
          
          const username = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || "Anonymous";
          const profilePic = user.profileImage || user.photoURL || "";
          const initials = username
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase();

          return (
            <div key={`${joke.userId}-${index}`} className={styles.jokeCard}>
              <div className={styles.jokeHeader}>
                <span className={styles.username}>{username} says,</span>
                <Avatar className={styles.profilePic}>
                  {profilePic ? (
                    <AvatarImage src={profilePic} alt="Profile" />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
              </div>

              <p className={styles.jokeText}>"{joke.text}"</p>

              <div className={styles.voteButtons}>
                <Button onClick={() => handleVote(joke, "up")} className={styles.upvote}>
                  👍 {joke.upvote}
                </Button>
                <Button onClick={() => handleVote(joke, "down")} className={styles.downvote}>
                  👎 {joke.downvote}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
