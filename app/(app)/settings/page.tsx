import { redirect } from "next/navigation";

// Bare /settings lands on Account — first subsection in Design_System §7.7.
// Each subsection is its own URL so users can deep-link directly.
export default function SettingsIndex() {
  redirect("/settings/account");
}
