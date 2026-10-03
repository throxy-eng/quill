import type { ReactNode } from "react";

interface PhoneShellProps {
  children: ReactNode;
}

export function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div className="min-h-dvh bg-[#e6e6e6]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white">{children}</div>
    </div>
  );
}
