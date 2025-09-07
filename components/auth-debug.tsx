"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function AuthDebug() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<string>("");

  const testAuth = async () => {
    try {
      const response = await fetch("/api/project", {
        credentials: "include",
      });
      const data = await response.json();
      setTestResult(`Status: ${response.status}, Data: ${JSON.stringify(data)}`);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Status: {status}</div>
      <div>Session: {session ? "✅" : "❌"}</div>
      {session && (
        <div>
          <div>Email: {session.user?.email}</div>
          <div>ID: {session.user?.id}</div>
        </div>
      )}
      <button
        onClick={testAuth}
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
      >
        Test API
      </button>
      {testResult && <div className="mt-2 text-xs">{testResult}</div>}
    </div>
  );
}
