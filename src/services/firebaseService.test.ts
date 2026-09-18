import { initFirebaseService } from "./firebaseService";
import firebaseConfig from "../../firebase-applet-config.json";

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}\n   Expected: ${expected}\n   Actual:   ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("Running Firebase service configuration tests...\n");

// Test 1: Verify hardcoded apiKey in firebase-applet-config.json is empty
assertEqual(
  firebaseConfig.apiKey,
  "",
  "firebase-applet-config.json apiKey is empty and not hardcoded"
);

// Test 2: When no custom key or env var is provided, initFirebaseService returns null instances
const unconfigured = initFirebaseService();
assertEqual(
  unconfigured.db,
  null,
  "initFirebaseService returns null db when unconfigured"
);
assertEqual(
  unconfigured.auth,
  null,
  "initFirebaseService returns null auth when unconfigured"
);

// Test 3: Custom API key and project ID parameters take precedence and initialize service
const configured = initFirebaseService("test-api-key-12345", "test-project-999");
assertEqual(
  configured.db !== null,
  true,
  "initFirebaseService initializes db when valid credentials are passed"
);
assertEqual(
  configured.auth !== null,
  true,
  "initFirebaseService initializes auth when valid credentials are passed"
);

console.log("\nAll Firebase service configuration tests passed successfully!");
process.exit(0);
