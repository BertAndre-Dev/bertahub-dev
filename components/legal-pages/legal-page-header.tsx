import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface LegalPageHeaderProps {
  backHref?: string;
}

export function LegalPageHeader({ backHref = "/auth/login" }: LegalPageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.svg"
            alt="BertAndre"
            width={120}
            height={40}
            className="h-8 w-auto sm:h-10"
            priority
          />
        </Link>
        <Link
          href={backHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Back</span>
        </Link>
      </div>
    </header>
  );
}
