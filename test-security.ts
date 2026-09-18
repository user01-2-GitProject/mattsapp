import assert from "node:assert";
import { handleFirestoreError, OperationType } from "./src/services/firebaseService.ts";

let consoleOutput = "";
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  consoleOutput += args.join(" ");
};

try {
  const fakeUser = {
    uid: "test-user-123",
    emailVerified: true,
    isAnonymous: false,
    tenantId: "sensitive-tenant-id",
    providerData: [
      { providerId: "google.com", email: "user@example.com" }
    ]
  };

  const errInfo = handleFirestoreError(
    new Error("Permission denied"),
    OperationType.GET,
    "users/test-user-123/vault",
    { currentUser: fakeUser as any }
  );

  // Assert return value contains non-sensitive fields
  assert.strictEqual(errInfo.authInfo.userId, "test-user-123");
  assert.strictEqual(errInfo.authInfo.isAnonymous, false);

  // Assert return value does NOT contain sensitive fields
  assert.strictEqual((errInfo.authInfo as any).tenantId, undefined);
  assert.strictEqual((errInfo.authInfo as any).emailVerified, undefined);
  assert.strictEqual((errInfo.authInfo as any).providerInfo, undefined);

  // Assert console log output does NOT contain sensitive strings
  assert.strictEqual(consoleOutput.includes("sensitive-tenant-id"), false);
  assert.strictEqual(consoleOutput.includes("google.com"), false);
  assert.strictEqual(consoleOutput.includes("emailVerified"), false);

  originalConsoleError("✅ Security unit test passed!");
} catch (error) {
  originalConsoleError("❌ Test failed:", error);
  process.exit(1);
} finally {
  console.error = originalConsoleError;
}
