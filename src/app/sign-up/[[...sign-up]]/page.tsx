import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh bg-ink flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-shell h-14 border-b border-paper/[0.06] shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="display text-[1.3rem] leading-none text-paper group-hover:text-acid transition-colors">
            reasoning
          </span>
          <span className="size-1.5 rounded-full bg-acid shadow-[0_0_8px_var(--acid)]" />
        </Link>
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-2 hover:text-paper transition-colors"
        >
          ← back
        </Link>
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[24rem]">
          {/* Custom header */}
          <div className="mb-8">
            <h1 className="display text-[2.2rem] leading-[0.95] text-paper mb-2">
              Create account.
            </h1>
            <p className="text-[14px] leading-relaxed text-bone">
              Your first room is one step away.
            </p>
          </div>

          {/* Clerk form — inherits global appearance from ClerkProvider */}
          <SignUp
            appearance={{
              elements: {
                card: { style: { background: "transparent", boxShadow: "none", padding: 0 } },
                rootBox: { style: { width: "100%" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
