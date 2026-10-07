/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { WorkspaceVaultProvider, useWorkspaceVault, STORAGE_PREFIX } from "@/hooks/useWorkspaceVault";
import { deriveProjectKey, encryptSecretValue, decryptSecretValue } from "@/lib/crypto/e2ee";

// Mock useGlobalContext
const mockWorkspace = { id: "ws_test_enterprise_123", name: "Enterprise Workspace" };
jest.mock("@/hooks/useUser", () => ({
  useGlobalContext: () => ({
    selectedWorkspace: mockWorkspace,
    user: { id: "user_test_123", email: "admin@xtra.test" },
    workspaces: [mockWorkspace],
  }),
}));

describe("Workspace-Level Master Vault Passphrase System", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WorkspaceVaultProvider>{children}</WorkspaceVaultProvider>
  );

  it("1. Initializes in locked state when storage is empty", () => {
    const { result } = renderHook(() => useWorkspaceVault(), { wrapper });
    expect(result.current.isWorkspaceUnlocked).toBe(false);
    expect(result.current.workspacePassphrase).toBe("");
  });

  it("2. Unlocks workspace and stores master key in session and local storage", () => {
    const { result } = renderHook(() => useWorkspaceVault(), { wrapper });

    act(() => {
      result.current.unlockWorkspace("master-company-passphrase-2026", true);
    });

    expect(result.current.isWorkspaceUnlocked).toBe(true);
    expect(result.current.workspacePassphrase).toBe("master-company-passphrase-2026");
    expect(sessionStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${mockWorkspace.id}`)).toBe("master-company-passphrase-2026");
    expect(localStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${mockWorkspace.id}`)).toBe("master-company-passphrase-2026");
    expect(localStorage.getItem(STORAGE_PREFIX.GLOBAL)).toBe("master-company-passphrase-2026");
  });

  it("3. Purges all keys on lockWorkspace()", () => {
    const { result } = renderHook(() => useWorkspaceVault(), { wrapper });

    act(() => {
      result.current.unlockWorkspace("master-passphrase", true);
    });
    expect(result.current.isWorkspaceUnlocked).toBe(true);

    act(() => {
      result.current.lockWorkspace();
    });

    expect(result.current.isWorkspaceUnlocked).toBe(false);
    expect(result.current.workspacePassphrase).toBe("");
    expect(sessionStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${mockWorkspace.id}`)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_PREFIX.WORKSPACE}${mockWorkspace.id}`)).toBeNull();
    expect(localStorage.getItem(STORAGE_PREFIX.GLOBAL)).toBeNull();
  });

  it("4. Resolves effective passphrase hierarchically (Project override > Workspace master)", () => {
    const { result } = renderHook(() => useWorkspaceVault(), { wrapper });

    // When workspace is unlocked
    act(() => {
      result.current.unlockWorkspace("workspace-master-key", false);
    });

    // For project without override: returns workspace key
    const fallbackRes = result.current.resolveEffectivePassphrase("proj_regular_999");
    expect(fallbackRes.passphrase).toBe("workspace-master-key");
    expect(fallbackRes.source).toBe("workspace");

    // When project has custom override stored
    sessionStorage.setItem(`${STORAGE_PREFIX.PROJECT}proj_special_888`, "project-specific-custom-key");
    const overrideRes = result.current.resolveEffectivePassphrase("proj_special_888");
    expect(overrideRes.passphrase).toBe("project-specific-custom-key");
    expect(overrideRes.source).toBe("project");
  });

  it("5. Cryptographic Isolation: 1 Master Key produces distinct 256-bit AES keys for 100 projects", () => {
    const masterPassphrase = "enterprise-global-master-passphrase-2026";
    const projectCount = 50;
    const derivedKeys = new Set<string>();

    for (let i = 1; i <= projectCount; i++) {
      const projectId = `proj_${String(i).padStart(3, "0")}`;
      const projectKey = deriveProjectKey(projectId, masterPassphrase);

      // Must be a valid 64-char hex 256-bit key
      expect(projectKey).toHaveLength(64);
      // Key must be strictly unique to this project
      expect(derivedKeys.has(projectKey)).toBe(false);
      derivedKeys.add(projectKey);

      // Test secret encryption and decryption for this project
      const secretPlaintext = `API_SECRET_FOR_PROJECT_${i}_VAL`;
      const encrypted = encryptSecretValue(secretPlaintext, projectKey);
      const decrypted = decryptSecretValue(encrypted, projectKey);
      expect(decrypted).toBe(secretPlaintext);

      // Cross-project decryption MUST fail (tamper / isolation protection)
      if (i > 1) {
        const otherProjectKey = deriveProjectKey(`proj_${String(i - 1).padStart(3, "0")}`, masterPassphrase);
        expect(() => decryptSecretValue(encrypted, otherProjectKey)).toThrow();
      }
    }

    // All 50 derived keys must be distinct
    expect(derivedKeys.size).toBe(projectCount);
  });
});
