import { redirect } from "next/navigation";

// /create — kept for the sidebar / BottomTabBar nav slot. Per
// docs/Clevroy_Chat_Surface.md §13, /home IS the create surface. Hitting
// /create routes the user to the same empty pre-thread state.

export default function CreatePage() {
  redirect("/home");
}
