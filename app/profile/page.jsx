"use client";

import { useEffect, 
  useState } from "react";
import { auth, db } from "../../firebase";
import { doc, 
  getDoc, 
  onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Avatar, 
  AvatarFallback, 
  AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogFooter, 
  AlertDialogCancel } from "@/components/ui/alert-dialog";
import { onAuthStateChanged, 
  signOut, 
  deleteUser } from "firebase/auth";
import { Breadcrumb, 
  BreadcrumbItem,
   BreadcrumbLink, 
   BreadcrumbList,
  BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationPrevious, 
  PaginationNext, 
  PaginationEllipsis,
  PaginationLink } from "@/components/ui/pagination";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jokes, setJokes] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jokesPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());

            const jokeRef = doc(db, "jokes", currentUser.uid);
            const unsubscribeJokes = onSnapshot(jokeRef, (docSnap) => {
              if (docSnap.exists() && docSnap.data().jokes.length > 0) {
                setJokes(docSnap.data().jokes);
              } else {
                setJokes([]);
              }
              setLoading(false);
            });

            return () => unsubscribeJokes();
          } else {
            console.error("User document not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error.message);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 w-24 rounded-full mt-4" />
        <div className="flex gap-4 mt-8">
          <Skeleton className="h-10 w-32 bg-red-500/80" />
          <Skeleton className="h-10 w-32 bg-red-500/80" />
        </div>
      </div>
    );
  }

  if (!user) return <div className="flex justify-center items-center h-screen text-red-500">User not found.</div>;

  const initials = user.firstName[0] + (user.lastName ? user.lastName[0] : "");

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
        router.push("/login");
      } catch (error) {
        console.error("Error deleting account:", error.message);
      }
    }
  };
  const totalPages = jokes ? Math.ceil(jokes.length / jokesPerPage) : 1;
  const startIndex = (currentPage - 1) * jokesPerPage;
  const endIndex = startIndex + jokesPerPage;
  const displayedJokes = jokes ? jokes.slice(startIndex, endIndex) : [];

  return (
    <div className="flex flex-col justify-center items-center h-screen p-6">
      <div className="absolute top-4 left-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/profile" className="text-muted-foreground">Profile</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-between w-full max-w-lg bg-background p-6 shadow-md rounded-md">
        <h1 className="text-3xl font-semibold">Hello, {user.firstName} {user.lastName}</h1>
        <Avatar className="w-20 h-20">
          <AvatarImage src={user.profileImage || ""} alt="Profile" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>

      {jokes && jokes.length > 0 && (
        <div className="w-full max-w-lg mt-8">
          <h2 className="text-2xl font-semibold mb-4">Your Jokes</h2>
          <div className="space-y-4">
            {displayedJokes.map((joke, index) => (
              <div key={index} className="bg-white p-4 shadow rounded-md flex justify-between items-center">
                <p className="text-gray-800">{joke.text}</p>
                <div className="flex gap-4 text-gray-600">
                  <span>👍 {joke.upvote}</span>
                  <span>👎 {joke.downvote}</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => setCurrentPage(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                   
                  </PaginationLink>
                </PaginationItem>
              ))}
          <PaginationItem> 
                <PaginationEllipsis />  
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
              
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <div className="flex gap-4 mt-12 w-full max-w-lg justify-center">
        <Button className="bg-red-600 hover:bg-red-700 px-6 py-3" onClick={handleLogout}>
          Logout
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 px-6 py-3">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <p>This action cannot be undone. Your account will be permanently deleted.</p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <Button className="bg-red-600 hover:bg-red-700 px-6 py-3" onClick={handleDeleteAccount}>
                Confirm Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
