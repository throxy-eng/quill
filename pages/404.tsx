import Link from "next/link";
import { PhoneShell } from "@/components/phone-shell";

export default function NotFoundPage() {
  return (
    <PhoneShell>
      <div className="px-6 pt-16">
        <p className="text-[20px] text-neutral-950">That page is not in Quill.</p>
        <Link href="/" className="mt-4 inline-block text-[16px] underline">
          Back to puzzles
        </Link>
      </div>
    </PhoneShell>
  );
}
