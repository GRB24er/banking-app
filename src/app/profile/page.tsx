import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div>
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  await dbConnect();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    return (
      <div>
        <p>User not found.</p>
      </div>
    );
  }

  return <ProfileClient user={JSON.parse(JSON.stringify(user))} />;
}
