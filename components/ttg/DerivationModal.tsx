"use client";

import * as React from "react";
import { ExternalLink, X } from "lucide-react";
import { EvidenceTierChip, type EvidenceTier } from "@/components/ui/qn";
import { Button } from "@/components/ui/qn";

export type DerivationModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  evidenceTier: EvidenceTier;
  sourceUrl: string;
  sourceLabel: string;
  sourceAuthority: string;
};

export function DerivationModal({
  open,
  onClose,
  title,
  body,
  evidenceTier,
  sourceUrl,
  sourceLabel,
  sourceAuthority,
}: DerivationModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  React.useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (mounted) {
      setVisible(false);
      const t = window.setTimeout(() => {
        setMounted(false);
        triggerRef.current?.focus();
      }, reducedMotion ? 0 : 220);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted, reducedMotion]);

  React.useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const titleId = "derivation-modal-title";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{
        background: "rgba(30, 37, 23, 0.40)",
        opacity: visible ? 1 : 0,
        transition: reducedMotion ? "none" : "opacity 220ms var(--ease-out)",
      }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] rounded-2xl border border-[color:var(--border-default)] bg-surface-card p-6 shadow-lg"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible || reducedMotion ? "scale(1)" : "scale(0.98)",
          transition: reducedMotion
            ? "none"
            : "opacity 220ms var(--ease-out), transform 220ms var(--ease-out)",
        }}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="font-serif text-[18px] leading-snug text-text-primary outline-none"
          >
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <EvidenceTierChip tier={evidenceTier} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close derivation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-tertiary hover:bg-surface-inner hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </header>

        <p className="font-sans text-[14px] leading-[1.6] text-text-secondary">{body}</p>

        <div className="mt-5 rounded-lg border border-[color:var(--border-default)] bg-surface-inner p-4">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-gold-600 underline decoration-gold-600/40 underline-offset-[3px] hover:text-gold-500 hover:decoration-gold-500"
          >
            Source: {sourceLabel}
            <ExternalLink size={14} aria-hidden />
          </a>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-text-tertiary">
            {sourceAuthority}
          </p>
        </div>

        <footer className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default DerivationModal;
