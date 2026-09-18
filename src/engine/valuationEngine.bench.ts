import { executeMasterValuationFramework } from "./valuationEngine";
import { CardMeta, MarketplaceComp } from "../types";

function generateComps(count: number): MarketplaceComp[] {
  const comps: MarketplaceComp[] = [];
  for (let i = 0; i < count; i++) {
    comps.push({
      id: `comp_${i}`,
      price: Math.floor(Math.random() * 500) + 10,
      grade: i % 2 === 0 ? "10" : "9",
      gradeCompany: i % 3 === 0 ? "PSA" : "BGS",
      isShillWarning: i % 20 === 0,
      isLotSale: false,
      isDamaged: false
    });
  }
  return comps;
}

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

const smallComps = generateComps(10);
const mediumComps = generateComps(50);
const largeComps = generateComps(200);

const ITERATIONS = 100000;

function runBenchmark(label: string, comps: MarketplaceComp[], iterations: number) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    executeMasterValuationFramework({ cardMeta, rawComps: comps });
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    executeMasterValuationFramework({ cardMeta, rawComps: comps });
  }
  const elapsedMs = performance.now() - start;
  const opsPerSec = Math.round((iterations / elapsedMs) * 1000);
  console.log(`[${label}] Iterations: ${iterations} | Elapsed: ${elapsedMs.toFixed(2)} ms | Ops/sec: ${opsPerSec.toLocaleString()}`);
  return { elapsedMs, opsPerSec };
}

console.log("--- Starting Benchmark ---");
runBenchmark("10 Comps", smallComps, ITERATIONS);
runBenchmark("50 Comps", mediumComps, ITERATIONS);
runBenchmark("200 Comps", largeComps, ITERATIONS);
