"use client";
import { ErrorState } from "@/components/ui/states";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="container-page py-24"><ErrorState onRetry={reset} /></main>;
}
