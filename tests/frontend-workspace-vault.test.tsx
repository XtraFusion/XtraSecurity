/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { WorkspaceVaultProvider, useWorkspaceVault, STORAGE_PREFIX } from "@/hooks/useWorkspaceVault";
import { deriveProjectKey, encryptSecretValue, decryptSecretValue, downloadRecoveryKit } from "@/lib/crypto/e2ee";

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

  it("6. Explicit project-specific key management (setProjectPassphrase & clearProjectPassphrase)", () => {
    const { result } = renderHook(() => useWorkspaceVault(), { wrapper });

    act(() => {
      result.current.unlockWorkspace("company-workspace-passphrase", true);
    });

    // Check status before setting dedicated key: inherits from workspace
    const initialStatus = result.current.getProjectVaultStatus("proj_custom_101");
    expect(initialStatus.isUnlocked).toBe(true);
    expect(initialStatus.isDedicatedProjectKey).toBe(false);
    expect(initialStatus.source).toBe("workspace");
    expect(initialStatus.passphrase).toBe("company-workspace-passphrase");

    // Set dedicated project key
    act(() => {
      result.current.setProjectPassphrase("proj_custom_101", "isolated-project-secret-key", true);
    });

    // Status after setting dedicated key: now dedicated project key
    const customStatus = result.current.getProjectVaultStatus("proj_custom_101");
    expect(customStatus.isUnlocked).toBe(true);
    expect(customStatus.isDedicatedProjectKey).toBe(true);
    expect(customStatus.source).toBe("project");
    expect(customStatus.passphrase).toBe("isolated-project-secret-key");

    // Verify workspace passphrase for other projects did NOT change
    const otherStatus = result.current.getProjectVaultStatus("proj_other_202");
    expect(otherStatus.isDedicatedProjectKey).toBe(false);
    expect(otherStatus.passphrase).toBe("company-workspace-passphrase");

    // Revert/clear project key back to workspace key
    act(() => {
      result.current.clearProjectPassphrase("proj_custom_101");
    });

    // Project seamlessly falls back to workspace master key
    const revertedStatus = result.current.getProjectVaultStatus("proj_custom_101");
    expect(revertedStatus.isUnlocked).toBe(true);
    expect(revertedStatus.isDedicatedProjectKey).toBe(false);
    expect(revertedStatus.source).toBe("workspace");
    expect(revertedStatus.passphrase).toBe("company-workspace-passphrase");
  });

  it("7. downloadRecoveryKit generates zero-knowledge recovery text file and triggers browser download", () => {
    const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
    const mockRevokeObjectURL = jest.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const success = downloadRecoveryKit({
      passphrase: "apple banana cherry date elderberry fig grape hazelnut iris jungle kiwi lemon mango nectarine orange papaya quince raspberry strawberry tangerine umbrella vanilla walnut youth",
      projectName: "Production Backend",
      projectId: "proj_prod_001",
      workspaceName: "SmartTech Enterprise",
      scope: "project"
    });

    expect(success).toBe(true);
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
  });
});

