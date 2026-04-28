"use client";

// Settings → Account. Explicit-save sub-route: profile section drives the
// page-level SaveBar; email + password each carry their own dialog/transaction;
// account deletion bypasses the save bar and uses ConfirmDialog directly.

import * as React from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { SaveBar } from "@/components/settings/SaveBar";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { confirmVerbPairs, settings, settingsAccount } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useLastSavedStore } from "@/stores/last-saved-store";

const ROUTE_KEY = "/settings/account";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateDisplayName(v: string): string | null {
  const t = v.trim();
  if (t.length < 2 || t.length > 48)
    return settingsAccount.validation.displayNameRange;
  return null;
}

function validateFirstName(v: string): string | null {
  const t = v.trim();
  if (t.length < 1 || t.length > 24)
    return settingsAccount.validation.firstNameRange;
  return null;
}

// ---------------------------------------------------------------------------
// Profile section — drives the page-level SaveBar.
// ---------------------------------------------------------------------------

function ProfileSection() {
  const { profile } = useProfile();
  const markSaved = useLastSavedStore((s) => s.markSaved);
  const setDirty = useLastSavedStore((s) => s.setDirty);

  const initialDisplay = profile?.display_name ?? "";
  const initialFirst = profile?.first_name ?? "";
  const initialAvatar = profile?.avatar_url ?? null;

  const [displayName, setDisplayName] = React.useState(initialDisplay);
  const [firstName, setFirstName] = React.useState(initialFirst);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initialAvatar);
  const [pending, setPending] = React.useState(false);

  // Sync local state when profile loads (was null on first paint).
  React.useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setFirstName(profile?.first_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? null);
  }, [profile?.display_name, profile?.first_name, profile?.avatar_url]);

  const dirty =
    displayName !== initialDisplay ||
    firstName !== initialFirst ||
    avatarUrl !== initialAvatar;

  const displayError = validateDisplayName(displayName);
  const firstError = validateFirstName(firstName);
  const valid = !displayError && !firstError;

  React.useEffect(() => {
    setDirty(ROUTE_KEY, dirty);
    return () => setDirty(ROUTE_KEY, false);
  }, [dirty, setDirty]);

  const handleAvatarPick = (file: File) => {
    // TODO(layer 5): upload to R2, swap avatarUrl with the signed URL.
    // eslint-disable-next-line no-console
    console.warn("Avatar upload pending Layer 5");
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
  };

  const handleDiscard = () => {
    setDisplayName(initialDisplay);
    setFirstName(initialFirst);
    setAvatarUrl(initialAvatar);
  };

  const handleSave = async () => {
    if (!valid) return;
    setPending(true);
    try {
      // TODO(layer 5): PATCH /api/me { display_name, first_name, avatar_url }
      // eslint-disable-next-line no-console
      console.warn("Profile save pending Layer 5", {
        display_name: displayName.trim(),
        first_name: firstName.trim(),
        avatar_url: avatarUrl,
      });
      await new Promise((r) => setTimeout(r, 350));
      markSaved();
      setDirty(ROUTE_KEY, false);
      toast.success(settings.savedToast("Profile"));
    } catch {
      toast.error("Couldn't save your profile. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <SettingsSection
        title={settingsAccount.profileSectionTitle}
        description={settingsAccount.profileSectionDescription}
        flush
      >
        <AvatarPicker url={avatarUrl} onPick={handleAvatarPick} />
        <SettingsField
          label={settingsAccount.displayNameLabel}
          helper={settingsAccount.displayNameHelper}
          error={displayName !== initialDisplay ? displayError : null}
          htmlFor="account-display-name"
          compact
        >
          <Input
            id="account-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            maxLength={48}
          />
        </SettingsField>
        <SettingsField
          label={settingsAccount.firstNameLabel}
          helper={settingsAccount.firstNameHelper}
          error={firstName !== initialFirst ? firstError : null}
          htmlFor="account-first-name"
          compact
        >
          <Input
            id="account-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            maxLength={24}
          />
        </SettingsField>
      </SettingsSection>

      <SaveBar
        dirty={dirty && valid}
        pending={pending}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </>
  );
}

function AvatarPicker({
  url,
  onPick,
}: {
  url: string | null;
  onPick: (file: File) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <SettingsField
      label={settingsAccount.avatarLabel}
      helper={settingsAccount.avatarHelper}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative inline-flex size-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted",
            "transition-colors hover:border-primary/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          aria-label="Upload profile photo"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Camera
              className="size-6 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-medium uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
            Change
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
      </div>
    </SettingsField>
  );
}

// ---------------------------------------------------------------------------
// Email section — read-only display + change-email dialog (own transaction).
// ---------------------------------------------------------------------------

function EmailSection() {
  // TODO(layer 5): pull email from Profile once the API includes it.
  const email = "javaris@example.com";
  const [open, setOpen] = React.useState(false);

  return (
    <SettingsSection
      title={settingsAccount.emailSectionTitle}
      description={settingsAccount.emailSectionDescription}
    >
      <SettingsField
        label={settingsAccount.emailLabel}
        helper={settingsAccount.emailHelper}
        htmlFor="account-email"
        compact
      >
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="account-email"
            type="email"
            value={email}
            readOnly
            className="max-w-md bg-muted/40"
            autoComplete="email"
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setOpen(true)}
          >
            {settingsAccount.changeEmail}
          </Button>
        </div>
      </SettingsField>
      <ChangeEmailDialog open={open} onOpenChange={setOpen} />
    </SettingsSection>
  );
}

function ChangeEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [newEmail, setNewEmail] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.warn("Email change pending Layer 5", { newEmail });
    toast.success("Confirmation link sent to your new email.");
    onOpenChange(false);
    setNewEmail("");
    setCurrentPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settingsAccount.changeEmailDialog.title}</DialogTitle>
          <DialogDescription>
            {settingsAccount.changeEmailDialog.body}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SettingsField
            label={settingsAccount.changeEmailDialog.newEmailLabel}
            htmlFor="change-email-new"
          >
            <Input
              id="change-email-new"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </SettingsField>
          <SettingsField
            label={settingsAccount.changeEmailDialog.currentPasswordLabel}
            htmlFor="change-email-pw"
          >
            <Input
              id="change-email-pw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </SettingsField>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              {settingsAccount.changeEmailDialog.cancel}
            </Button>
            <Button type="submit" className="rounded-full">
              {settingsAccount.changeEmailDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Password section — own dialog with strength indicator.
// ---------------------------------------------------------------------------

type Strength = "weak" | "fair" | "strong";

function passwordStrength(pw: string): Strength {
  if (pw.length < 8) return "weak";
  const classes =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/[0-9]/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length >= 12 && classes >= 3) return "strong";
  if (classes >= 2) return "fair";
  return "weak";
}

function StrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const s = passwordStrength(value);
  const filledCount = s === "weak" ? 1 : s === "fair" ? 2 : 3;
  const tone =
    s === "weak"
      ? "bg-destructive"
      : s === "fair"
        ? "bg-warning"
        : "bg-success";
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-8 rounded-full",
              i < filledCount ? tone : "bg-border",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium capitalize text-muted-foreground">
        {settingsAccount.passwordDialog.strengthLabels[s]}
      </span>
    </div>
  );
}

function PasswordSection() {
  const [open, setOpen] = React.useState(false);
  return (
    <SettingsSection
      title={settingsAccount.passwordSectionTitle}
      description={settingsAccount.passwordSectionDescription}
    >
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        {settingsAccount.changePassword}
      </Button>
      <PasswordDialog open={open} onOpenChange={setOpen} />
    </SettingsSection>
  );
}

function PasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && next !== confirm;
  const valid = current.length > 0 && next.length >= 8 && next === confirm;

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    try {
      // eslint-disable-next-line no-console
      console.warn("Password change pending Layer 5");
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Password updated.");
      onOpenChange(false);
      reset();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{settingsAccount.passwordDialog.title}</DialogTitle>
          <DialogDescription>
            {settingsAccount.passwordDialog.body}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SettingsField
            label={settingsAccount.passwordDialog.currentLabel}
            htmlFor="pw-current"
          >
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </SettingsField>
          <SettingsField
            label={settingsAccount.passwordDialog.newLabel}
            error={tooShort ? settingsAccount.passwordDialog.tooShort : null}
            htmlFor="pw-new"
          >
            <Input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <StrengthMeter value={next} />
          </SettingsField>
          <SettingsField
            label={settingsAccount.passwordDialog.confirmLabel}
            error={mismatch ? settingsAccount.passwordDialog.mismatch : null}
            htmlFor="pw-confirm"
          >
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </SettingsField>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              {settingsAccount.passwordDialog.cancel}
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={!valid || pending}
            >
              {pending ? settings.saving : settingsAccount.passwordDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Account deletion section — destructive surface.
// ---------------------------------------------------------------------------

function DeleteSection() {
  const { profile } = useProfile();
  const userEmail = "javaris@example.com"; // TODO(layer 5): from Profile

  const [confirmText, setConfirmText] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filmCount = 12; // TODO(layer 5): from /api/me/films/count
  const hasVoice = profile?.voice_twin_status === "ready";
  const hasFace = profile?.face_twin_status === "ready";

  const canConfirm = confirmText.trim().toLowerCase() === userEmail.toLowerCase();

  const handleDelete = () => {
    // eslint-disable-next-line no-console
    console.warn("Account deletion pending Layer 5");
    toast.success("Account scheduled for deletion in 30 days.");
    setOpen(false);
    setConfirmText("");
  };

  return (
    <SettingsSection
      title={settingsAccount.dangerZoneTitle}
      description={settingsAccount.dangerZoneBody}
      destructive
    >
      <p className="text-sm text-foreground">
        {settingsAccount.dangerZoneList(filmCount, hasVoice, hasFace)}
      </p>
      <SettingsField
        label={settingsAccount.dangerZoneTypeLabel}
        helper={`Type "${userEmail}" to enable the button.`}
        htmlFor="account-delete-confirm"
        compact
      >
        <Input
          id="account-delete-confirm"
          autoComplete="off"
          spellCheck={false}
          placeholder={userEmail}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
      </SettingsField>
      <Button
        type="button"
        variant="destructive"
        className="rounded-full"
        disabled={!canConfirm}
        onClick={() => setOpen(true)}
      >
        {settingsAccount.deleteCta}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{settingsAccount.deleteDialog.title}</DialogTitle>
            <DialogDescription>
              {settingsAccount.deleteDialog.body}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              {confirmVerbPairs.deleteAccount.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={handleDelete}
            >
              {confirmVerbPairs.deleteAccount.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsAccountPage() {
  return (
    <div>
      <ProfileSection />
      <EmailSection />
      <PasswordSection />
      <DeleteSection />
    </div>
  );
}
