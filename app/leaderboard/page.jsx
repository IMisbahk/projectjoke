"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import styles from "./leaderboard.module.css"; 
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage, BreadcrumbList } from "@/components/ui/breadcrumb";


export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // First, fetch all users to get their names
        const usersSnap = await getDocs(collection(db, "users"));
        const userData = {};
        usersSnap.forEach((doc) => {
          userData[doc.id] = {
            firstName: doc.data().firstName,
            lastName: doc.data().lastName
          };
        });

        // Then fetch jokes and calculate points
        const jokesSnap = await getDocs(collection(db, "jokes"));
        const userPoints = {};

        jokesSnap.forEach((doc) => {
          const data = doc.data();
          const userId = doc.id;
          const user = userData[userId] || {};
          const username = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || "Anonymous";
          const jokes = data.jokes || [];

          let totalPoints = 0;
          jokes.forEach((joke) => {
            totalPoints += (joke.upvote || 0) * 5 - (joke.downvote || 0) * 3;
          });

          userPoints[userId] = { username, points: totalPoints };
        });

        const sortedUsers = Object.entries(userPoints)
          .map(([id, user]) => ({ id, ...user }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 10); // Top 10 users

        setLeaderboard(sortedUsers);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <> <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/leaderboard">Leaderboard</BreadcrumbLink>
      </BreadcrumbItem>
      </BreadcrumbList>
  </Breadcrumb>
  

    <div className={styles.container}>
         {/* Breadcrumb using ShadCN */}
     
      <h1 className={styles.title}>🏆 Leaderboard</h1>
      <div className={styles.table}>
        <div className={styles.header}>
          <span>#</span>
          <span>User</span>
          <span>Dadpoints</span>
        </div>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          leaderboard.map((user, index) => (
            <div key={user.id} className={styles.row}>
              <span>#{index + 1}</span>
              <span>{user.username}</span>
              <span className={styles.points}>{user.points}</span>
            </div>
          ))
        )}
      </div>
    </div></>
  );
}
