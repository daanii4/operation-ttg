"use client";

import * as React from "react";

/** Visual-only header actions matching Scholars OS header button styling (demo). */
export function TtgHeaderActions() {
  return (
    <>
      <button type="button" className="btn-ghost">
        Export summary
      </button>
      <button type="button" className="btn-gold">
        Refresh view
      </button>
    </>
  );
}

export default TtgHeaderActions;
