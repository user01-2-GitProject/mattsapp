import { sanitizeCsvField } from "./csv";

function assertEqual(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}\n   Expected: ${expected}\n   Actual:   ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("Running CSV sanitization tests...\n");

// 1. Formula injection characters test
assertEqual(
  sanitizeCsvField("=SUM(A1:A10)"),
  '"\'=SUM(A1:A10)"',
  "Prepends apostrophe to field starting with '='"
);

assertEqual(
  sanitizeCsvField("+1+2"),
  '"\'+1+2"',
  "Prepends apostrophe to field starting with '+'"
);

assertEqual(
  sanitizeCsvField("-cmd|' /C calc'!A0"),
  '"\'-cmd|\' /C calc\'!A0"',
  "Prepends apostrophe to field starting with '-'"
);

assertEqual(
  sanitizeCsvField("@SUM(1,2)"),
  '"\'@SUM(1,2)"',
  "Prepends apostrophe to field starting with '@'"
);

assertEqual(
  sanitizeCsvField("\tTabPrefix"),
  '"\'\tTabPrefix"',
  "Prepends apostrophe to field starting with tab character"
);

assertEqual(
  sanitizeCsvField("\rCarriageReturnPrefix"),
  '"\'\rCarriageReturnPrefix"',
  "Prepends apostrophe to field starting with carriage return"
);

// 2. Safe string fields
assertEqual(
  sanitizeCsvField("Michael Jordan"),
  '"Michael Jordan"',
  "Normal text remains unchanged within double quotes"
);

// 3. Double quote escaping test
assertEqual(
  sanitizeCsvField('Refractor "1/1" Special'),
  '"Refractor ""1/1"" Special"',
  "Double quotes inside string are doubled"
);

// 4. Formula injection with double quotes
assertEqual(
  sanitizeCsvField('="1+1"'),
  '"\'=""1+1"""',
  "Formula injection starting with '=' and containing double quotes"
);

// 5. Numeric and boolean values
assertEqual(
  sanitizeCsvField(2024),
  '"2024"',
  "Numbers are formatted safely without prepending apostrophe"
);

assertEqual(
  sanitizeCsvField(-100),
  '"-100"',
  "Negative numbers are converted to string safely"
);

assertEqual(
  sanitizeCsvField(true),
  '"true"',
  "Booleans are formatted safely"
);

assertEqual(
  sanitizeCsvField(null),
  '""',
  "Null values return empty double quotes"
);

assertEqual(
  sanitizeCsvField(undefined),
  '""',
  "Undefined values return empty double quotes"
);

console.log("\nAll CSV sanitization tests passed successfully!");
