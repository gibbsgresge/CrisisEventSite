import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// protected route
export default async function Dashboard() {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      getServerSession Result
      {session?.user?.name ? (
        <div>{session?.user?.name}</div>
      ) : (
        <div>Not logged in</div>
      )}
    </>
  );
}
