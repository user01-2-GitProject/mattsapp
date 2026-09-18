import { test } from "node:test";
import assert from "node:assert/strict";
import { safeParseLLMJson } from "./geminiGateway";

test("safeParseLLMJson - extracts JSON inside markdown block", () => {
  const llmResponse = `Here is the analysis of the card:
  \`\`\`json
  {
    "player": "Shohei Ohtani",
    "year": 2018,
    "set": "Topps Chrome",
    "Hz": 0.8,
    "rawComps": [
      { "price": 450, "venue": "eBay" }
    ]
  }
  \`\`\`
  Hope this helps!`;

  const result = safeParseLLMJson(llmResponse);
  assert.notEqual(result, null);
  assert.equal(result?.player, "Shohei Ohtani");
  assert.equal(result?.year, 2018);
  assert.equal(result?.set, "Topps Chrome");
  assert.equal(result?.Hz, 0.8);
  assert.equal(result?.rawComps?.length, 1);
  assert.equal(result?.rawComps?.[0].price, 450);
});

test("safeParseLLMJson - extracts raw JSON without markdown codeblock", () => {
  const llmResponse = `Analysis summary before payload...
  {
    "player": "Victor Wembanyama",
    "year": 2023,
    "verifiedAttributes": ["Rookie", "Autograph"]
  }
  Summary after payload.`;

  const result = safeParseLLMJson(llmResponse);
  assert.notEqual(result, null);
  assert.equal(result?.player, "Victor Wembanyama");
  assert.equal(result?.year, 2023);
  assert.deepEqual(result?.verifiedAttributes, ["Rookie", "Autograph"]);
});

test("safeParseLLMJson - handles invalid or malformed JSON gracefully", () => {
  const llmResponse = `\`\`\`json
  {
    "player": "Caitlin Clark",
    "year": 2024,
  }
  \`\`\``;

  const result = safeParseLLMJson(llmResponse);
  assert.equal(result, null);
});

test("safeParseLLMJson - sanitizes prototype pollution / malformed objects", () => {
  const llmResponse = `\`\`\`json
  {
    "player": {"nested": "object"},
    "year": "invalid-year",
    "Hz": "NaN",
    "rawComps": "not-an-array",
    "verifiedAttributes": [123, null, "Valid Spec"]
  }
  \`\`\``;

  const result = safeParseLLMJson(llmResponse);
  assert.notEqual(result, null);
  assert.equal(result?.player, undefined);
  assert.equal(result?.year, undefined);
  assert.equal(result?.Hz, undefined);
  assert.equal(result?.rawComps, undefined);
  assert.deepEqual(result?.verifiedAttributes, ["123", "Valid Spec"]);
});

test("safeParseLLMJson - filters out invalid elements in rawComps", () => {
  const llmResponse = `\`\`\`json
  {
    "player": "Jayden Daniels",
    "rawComps": [
      { "price": "150", "venue": "eBay" },
      "invalid-comp-string",
      null,
      { "price": 200, "isShillWarning": true }
    ]
  }
  \`\`\``;

  const result = safeParseLLMJson(llmResponse);
  assert.notEqual(result, null);
  assert.equal(result?.rawComps?.length, 2);
  assert.equal(result?.rawComps?.[0].price, 150);
  assert.equal(result?.rawComps?.[0].venue, "eBay");
  assert.equal(result?.rawComps?.[1].price, 200);
  assert.equal(result?.rawComps?.[1].isShillWarning, true);
});
