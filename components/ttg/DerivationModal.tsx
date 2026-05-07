"use client";
import * as React from "react";
import Modal from "@/components/ui/Modal";
import Link from "@/components/ui/Link";

type DerivationModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  evidenceTier: "Deterministic" | "Provisional";
  sourceUrl: string;
  sourceLabel: string;
};

export function DerivationModal({
  open,
  onClose,
  title,
  body,
  evidenceTier,
  sourceUrl,
  sourceLabel,
}: DerivationModalProps) {
  const tierColor =
    evidenceTier === "Deterministic" ? "text-band-green" : "text-band-yellow";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-[11px] text-text-tertiary">
            Evidence tier: <span className={tierColor}>{evidenceTier}</span>
          </span>
          <Link href={sourceUrl} external className="text-[11px]">
            {sourceLabel}
          </Link>
        </div>
      }
    >
      <p className="font-mono text-[12px] leading-[1.7] text-text-primary">{body}</p>
    </Modal>
  );
}

export default DerivationModal;
