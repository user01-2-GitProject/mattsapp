import { handleFirestoreError, OperationType } from "./src/services/firebaseService";

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Assertion failed: expected ${expected}, got ${actual}`);
  }
}

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
  assertEqual(errInfo.authInfo.userId, "test-user-123", "userId matches");
  assertEqual(errInfo.authInfo.isAnonymous, false, "isAnonymous matches");

  // Assert return value does NOT contain sensitive fields
  assertEqual((errInfo.authInfo as any).tenantId, undefined, "tenantId omitted");
  assertEqual((errInfo.authInfo as any).emailVerified, undefined, "emailVerified omitted");
  assertEqual((errInfo.authInfo as any).providerInfo, undefined, "providerInfo omitted");

  // Assert console log output does NOT contain sensitive strings
  assertEqual(consoleOutput.includes("sensitive-tenant-id"), false, "tenantId not in console log");
  assertEqual(consoleOutput.includes("google.com"), false, "provider not in console log");
  assertEqual(consoleOutput.includes("emailVerified"), false, "emailVerified not in console log");

  originalConsoleError("✅ Security unit test passed!");
} catch (error) {
  originalConsoleError("❌ Test failed:", error);
  process.exit(1);
} finally {
  console.error = originalConsoleError;
}
