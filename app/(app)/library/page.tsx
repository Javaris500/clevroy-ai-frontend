import { redirect } from "next/navigation";

export const metadata = { title: "Library · Clevroy" };

export default function LibraryIndexPage() {
  redirect("/library/templates");
}
