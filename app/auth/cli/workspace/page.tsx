import React, { Suspense } from "react";
import WorkspaceSelectionClient from "./WorkspaceSelectionClient";

export default function WorkspaceSelectionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      {/* Client component uses useSearchParams and must be rendered inside Suspense */}
      <WorkspaceSelectionClient />
    </Suspense>
  );
}
