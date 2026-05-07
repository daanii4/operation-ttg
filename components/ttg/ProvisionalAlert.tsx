import * as React from "react";
import { AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";

export function ProvisionalAlert({ reason }: { reason: string }) {
  return (
    <Card variant="alert-yellow" padding="sm" className="rounded">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-band-yellow" />
        <span className="font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-band-yellow">
          Provisional
        </span>
        <span className="text-band-yellow">·</span>
        <span className="font-sans text-[12px] text-band-yellow">{reason}</span>
      </div>
    </Card>
  );
}

export default ProvisionalAlert;
