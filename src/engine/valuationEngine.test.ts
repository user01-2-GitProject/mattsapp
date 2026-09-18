import { executeMasterValuationFramework } from "./valuationEngine";
import { CardMeta, MarketplaceComp } from "../types";

const cardMeta: CardMeta = {
  player: "Michael Jordan",
  year: 1986,
  set: "Fleer",
  cardNumber: "57",
  parallel: "Base",
  serialNumber: "123/500",
  attributes: "Rookie",
  grade: "10",
  gradeCondition: "Gem Mint",
  gradeCompany: "PSA"
};

const rawComps: MarketplaceComp[] = [
  { id: "1", price: 100, grade: "10", gradeCompany: "PSA" },
  { id: "2", price: 110, grade: "10", gradeCompany: "PSA" },
  { id: "3", price: 105, grade: "10", gradeCompany: "PSA" },
  { id: "4", price: 95, grade: "10", gradeCompany: "PSA" },
  { id: "5", price: 120, grade: "10", gradeCompany: "PSA" }
];

const result = executeMasterValuationFramework({ cardMeta, rawComps });

console.log("Valuation Result Price Points:", result.pricePoints);
console.log("IAS38 Accounting:", result.ias38Accounting);
console.log("Qualified Comps Count:", result.qualifiedComps.length);

if (result.pricePoints.fairValue > 0 && result.pricePoints.floor > 0 && result.pricePoints.ceiling > 0) {
  console.log("TEST PASSED: Correctness check succeeded!");
} else {
  console.error("TEST FAILED: Unexpected valuation output!");
  process.exit(1);
}
