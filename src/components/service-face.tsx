import { cn } from "@/lib/cn";
import type { Face } from "@/lib/studio.types";

export function ServiceFace({
  face,
  eyebrow,
  title,
  titleAs = "p",
  className,
}: {
  face: Face;
  eyebrow?: string;
  title?: string;
  titleAs?: "p" | "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-field text-bone", className)}>
      <FaceArt face={face} />
      {(eyebrow || title) && (
        <div className="relative flex h-full flex-col justify-end gap-2 p-5 sm:p-7">
          {eyebrow && (
            <p className="text-sm font-medium tracking-wide text-bone/75">{eyebrow}</p>
          )}
          {title && (
            <Title as={titleAs} className="max-w-xl font-display text-3xl leading-tight text-bone sm:text-5xl">
              {title}
            </Title>
          )}
        </div>
      )}
    </div>
  );
}

function Title({
  as,
  className,
  children,
}: {
  as: "p" | "h1" | "h2";
  className: string;
  children: string;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

function FaceArt({ face }: { face: Face }) {
  if (face === "grid") {
    return (
      <div className="face-grid absolute inset-0" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 w-3 bg-copper" />
        <span className="absolute right-8 top-8 h-24 w-32 border border-bone/40" />
      </div>
    );
  }
  if (face === "stripe") {
    return (
      <div className="face-stripe absolute inset-0" aria-hidden="true">
        <span className="absolute -left-8 bottom-6 size-36 rounded-full bg-copper" />
        <span className="absolute right-10 top-8 h-px w-24 bg-bone/70" />
      </div>
    );
  }
  if (face === "ring") {
    return (
      <div className="absolute inset-0" aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone/25" />
        <span className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone/40" />
        <span className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-copper" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <span className="absolute -left-10 -bottom-16 size-56 rounded-full bg-copper" />
      <span className="absolute -right-6 -top-10 size-40 rounded-full border border-bone/35" />
      <span className="absolute right-8 bottom-8 size-3 bg-bone" />
    </div>
  );
}
