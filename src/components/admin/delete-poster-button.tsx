"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePoster } from "@/app/actions/admin";

export function DeletePosterButton({
  posterId,
  title,
}: {
  posterId: string;
  title: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      await deletePoster(posterId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Delete ${title}`}
      title={confirming ? "Click again to confirm delete" : "Delete"}
      className={
        confirming
          ? "p-2 rounded-sm bg-error/15 text-error transition-colors"
          : "p-2 hover:bg-sand-light rounded-sm transition-colors text-ink"
      }
    >
      <Trash2 className="size-4" />
    </button>
  );
}
