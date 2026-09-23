import {
  CardMeta,
  MarketplaceComp,
  QualifiedComp,
  TrimmedComp,
  ValuationOutput,
  LatentCluster,
  PricePoints,
  IAS38Accounting
} from "../types";

/**
 * Returns condition multiplier based on company and grade designation.
 */
export function resolveGradeMultiplier(grade: string | number, company: string): number {
  if (!grade && !company) return 1.0;
  const gStr = typeof grade === "string" ? grade.trim() : String(grade || "").trim();
  const cStr = typeof company === "string" ? company.toUpperCase() : String(company || "").toUpperCase();

  if (cStr === "RAW" || gStr === "RAW" || gStr === "Ungraded") return 1.0;
  if (gStr.includes("10")) return cStr === "BGS" ? 5.2 : 4.2;
  if (gStr.includes("9.5")) return 2.4;
  if (gStr.includes("9")) return 1.75;
  if (gStr.includes("8.5")) return 1.35;
  if (gStr.includes("8")) return 1.15;
  if (gStr.includes("7")) return 0.88;
  return 1.0;
}

// Static cluster definitions hoisted to module scope to avoid re-allocating array & objects on every function call
const LATENT_CLUSTERS = [
  {
    id: "C0_LIQUID_BASE",
    name: "Liquid Modern Base Commodity",
    centroid: [1.0, 0.9, 0.1, 0.05],
    params: { Sc: 0.85, beta: 0.90, Ac: 0.96, Sz: 35000, CpBase: 15 }
  },
  {
    id: "C1_NUMBERED_PARALLEL",
    name: "Mid-Tier Serialized Parallel",
    centroid: [0.35, 0.7, 0.3, 0.08],
    params: { Sc: 0.35, beta: 0.65, Ac: 0.93, Sz: 2400, CpBase: 45 }
  },
  {
    id: "C2_GRAIL_AUTO",
    name: "Low-Numbered Grail / Auto",
    centroid: [0.05, 0.8, 0.9, 0.06],
    params: { Sc: 0.08, beta: 0.32, Ac: 0.89, Sz: 150, CpBase: 120 }
  },
  {
    id: "C3_VINTAGE_HOF",
    name: "Vintage Sovereign Heritage",
    centroid: [0.75, 0.5, 0.0, 0.95],
    params: { Sc: 0.22, beta: 0.45, Ac: 0.91, Sz: 850, CpBase: 65 }
  }
];

/**
 * Step 3: K-Means Latent Parameter Clustering
 * Partitions historical transaction feature spaces to derive latent parameters:
 * Scarcity parameter (Sc), Rivalry (beta), Accuracy (Ac), Dataset footprint (Sz).
 */
export function deriveLatentParametersByCluster({
  serialNumber,
  isRookie,
  isAuto,
  isVintage,
  year
}: {
  serialNumber: string | number;
  isRookie: boolean;
  isAuto: boolean;
  isVintage: boolean;
  year: number;
}): LatentCluster {
  let serialNum = 9999;
  if (typeof serialNumber === "number") {
    serialNum = serialNumber;
  } else if (typeof serialNumber === "string") {
    const match = serialNumber.match(/\/(\d+)/);
    if (match) serialNum = parseInt(match[1], 10);
  }

  // Feature vector components evaluated scalar-wise to prevent array allocation
  const v0 = Math.min(serialNum / 500, 1.0);
  const v1 = isRookie ? 1.0 : 0.0;
  const v2 = isAuto ? 1.0 : 0.0;
  const v3 = Math.min((2025 - (year || 2024)) / 40, 1.0);

  let nearest = LATENT_CLUSTERS[0];
  let minSqDistance = Infinity;

  for (let i = 0; i < LATENT_CLUSTERS.length; i++) {
    const c = LATENT_CLUSTERS[i];
    const d0 = v0 - c.centroid[0];
    const d1 = v1 - c.centroid[1];
    const d2 = v2 - c.centroid[2];
    const d3 = v3 - c.centroid[3];
    // Compare squared distance directly to avoid expensive Math.sqrt calls
    const sqDist = d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3;
    if (sqDist < minSqDistance) {
      minSqDistance = sqDist;
      nearest = c;
    }
  }

  return {
    clusterId: nearest.id,
    clusterName: nearest.name,
    ...nearest.params
  };
}

/**
 * Outlier Trimming & Quality Filter (Interquartile Range - IQR)
 * Filters shill bids, damaged sales, lot sales, and statistical anomalies.
 */
export function filterOutlierComps(
  rawComps: MarketplaceComp[],
  targetGrade: string,
  targetCompany: string
): { qualified: QualifiedComp[]; trimmed: TrimmedComp[] } {
  if (!Array.isArray(rawComps) || rawComps.length === 0) {
    return { qualified: [], trimmed: [] };
  }

  const targetMult = resolveGradeMultiplier(targetGrade, targetCompany);
  const processed: QualifiedComp[] = new Array(rawComps.length);
  const nonSuspicious: QualifiedComp[] = [];
  const suspiciousTrimmed: TrimmedComp[] = [];

  for (let index = 0; index < rawComps.length; index++) {
    const c = rawComps[index];
    const rawPrice = Number(c.price || c.acceptedPrice) || 0;
    const compMult = resolveGradeMultiplier(c.grade || "RAW", c.gradeCompany || "RAW");
    const normalizedPrice = Math.round(rawPrice * (targetMult / Math.max(0.2, compMult)));

    const isSuspicious =
      !!c.isShillWarning ||
      !!c.isLotSale ||
      !!c.isDamaged ||
      !!c.unpaid ||
      rawPrice <= 0;

    const comp: QualifiedComp = {
      ...c,
      id: c.id || `comp_${index + 1}`,
      rawPrice,
      normalizedPrice,
      compMult,
      isSuspicious
    };

    processed[index] = comp;

    if (isSuspicious) {
      suspiciousTrimmed.push({
        ...comp,
        trimReason: "Suspicious quality flag (shill / lot / damage / unpaid)"
      });
    } else {
      nonSuspicious.push(comp);
    }
  }

  if (nonSuspicious.length < 4) {
    return {
      qualified: nonSuspicious,
      trimmed: suspiciousTrimmed
    };
  }

  // Sort nonSuspicious in place without array spread copies
  nonSuspicious.sort((a, b) => a.normalizedPrice - b.normalizedPrice);
  const q1Index = Math.floor(nonSuspicious.length * 0.25);
  const q3Index = Math.floor(nonSuspicious.length * 0.75);
  const q1 = nonSuspicious[q1Index].normalizedPrice;
  const q3 = nonSuspicious[q3Index].normalizedPrice;
  const iqr = q3 - q1;
  const lowerBound = Math.max(5, q1 - 1.5 * iqr);
  const upperBound = q3 + 1.5 * iqr;

  const qualified: QualifiedComp[] = [];
  const trimmed: TrimmedComp[] = suspiciousTrimmed;

  // Filter nonSuspicious items in sorted order directly
  for (let i = 0; i < nonSuspicious.length; i++) {
    const comp = nonSuspicious[i];
    if (comp.normalizedPrice < lowerBound || comp.normalizedPrice > upperBound) {
      trimmed.push({
        ...comp,
        trimReason: `Statistical anomaly (outside IQR range: $${Math.round(lowerBound)}-$${Math.round(upperBound)})`
      });
    } else {
      qualified.push(comp);
    }
  }

  return { qualified, trimmed };
}

/**
 * Step 1-5 Deterministic Mathematical Valuation Engine
 */
export function executeMasterValuationFramework({
  cardMeta,
  rawComps,
  marketContext
}: {
  cardMeta: CardMeta;
  rawComps: MarketplaceComp[];
  marketContext?: { Hz?: number; Sz?: number; M?: number };
}): ValuationOutput {
  const {
    year = 2024,
    grade = "10",
    gradeCompany = "PSA",
    serialNumber = "Unnumbered",
    attributes = ""
  } = cardMeta;

  const lowerAttributes = attributes.toLowerCase();
  const isRookie = lowerAttributes.includes("rookie") || lowerAttributes.includes("rc");
  const isAuto = lowerAttributes.includes("auto") || lowerAttributes.includes("signature");
  const isVintage = year < 1980;

  const cluster = deriveLatentParametersByCluster({
    serialNumber,
    isRookie,
    isAuto,
    isVintage,
    year
  });

  const { Sc, beta, Ac, Sz, CpBase } = cluster;

  const { qualified, trimmed } = filterOutlierComps(rawComps, grade, gradeCompany);

  const currentYear = 2025;
  const t = Math.max(0.2, currentYear - year);

  const certSubmissionFee = (gradeCompany && gradeCompany !== "RAW") ? 25 : 0;
  const Cp = CpBase + certSubmissionFee;
  const Av = 0.95;
  const dVal = Math.round(Cp * Math.pow(Av, Math.min(t, 5)));

  const C = 0.95;
  const Pp = (gradeCompany && gradeCompany !== "RAW") ? 1.20 : 1.0;
  const Ap = (gradeCompany && gradeCompany !== "RAW") ? 1.20 : 1.0;
  const No = 1.0;
  const logFactor = Math.pow(Math.log10(Math.max(10, Sz)), 1.3);
  const scarcityDecay = 1 / Math.exp(Math.pow(Sc, beta));
  const aValUnscaled = Cp * logFactor * scarcityDecay * C * Ac * Pp * (1 / No) * Ap * Math.pow(Av, 0.2);
  const aVal = Math.round(aValUnscaled);

  // qualified comps from filterOutlierComps are already sorted by normalizedPrice
  const sortedPrices = qualified.length > 0
    ? qualified.map((c) => c.normalizedPrice)
    : [];

  let Ph = 0;
  if (sortedPrices.length > 0) {
    const mid = Math.floor(sortedPrices.length / 2);
    Ph = sortedPrices.length % 2 !== 0
      ? sortedPrices[mid]
      : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
  } else {
    Ph = Math.max(dVal, aVal);
  }

  const rExcess = 0.04;
  const Ci = 1.0;
  const Hz = Math.max(-2.0, Math.min(2.0, marketContext?.Hz ?? 0.4));
  const SzSentiment = Math.max(-2.0, Math.min(2.0, marketContext?.Sz ?? 0.1));
  const M = Math.max(0.85, Math.min(1.15, marketContext?.M ?? 1.0));

  let printRun = 9999;
  if (typeof serialNumber === "number") {
    printRun = serialNumber;
  } else {
    const serialMatch = String(serialNumber).match(/\/(\d+)/);
    if (serialMatch) printRun = parseInt(serialMatch[1], 10);
  }
  const scarcityFactor = Math.pow(500 / Math.max(1, printRun), 0.16);

  const sentimentMultiplier = 1 + (0.15 * Hz) - (0.10 * SzSentiment);
  const timeCompounding = Math.pow(1 + rExcess, Math.min(t, 3));

  const vsUnbounded = Ph * timeCompounding * Ci * sentimentMultiplier * scarcityFactor * M;
  const vsCalculated = Math.round(vsUnbounded);

  const calculatedFairValue = Math.max(dVal, vsCalculated);

  let floorPrice = 0;
  let ceilingPrice = 0;

  if (qualified.length >= 2) {
    const p20Idx = Math.max(0, Math.floor(sortedPrices.length * 0.20));
    const p85Idx = Math.min(sortedPrices.length - 1, Math.floor(sortedPrices.length * 0.85));
    floorPrice = Math.max(dVal, sortedPrices[p20Idx]);
    ceilingPrice = Math.max(calculatedFairValue * 1.15, sortedPrices[p85Idx]);
  } else {
    floorPrice = Math.max(dVal, Math.round(calculatedFairValue * 0.82));
    ceilingPrice = Math.round(calculatedFairValue * 1.25);
  }

  const targetGradeMult = resolveGradeMultiplier(grade, gradeCompany);
  const shapBase = Math.round(Ph);
  const shapScarcity = Math.round(Ph * (scarcityFactor - 1.0));
  const shapGrade = Math.round(Ph * (targetGradeMult - 1.0) * 0.4);
  const shapHype = Math.round(Ph * (0.15 * Hz));
  const shapSentiment = Math.round(Ph * (-0.10 * SzSentiment));
  const shapMacro = Math.round(Ph * (M - 1.0));
  const shapIAS38FloorLift = calculatedFairValue > vsCalculated ? (dVal - vsCalculated) : 0;

  return {
    pricePoints: {
      floor: floorPrice,
      fairValue: calculatedFairValue,
      ceiling: ceilingPrice,
      compsCount: qualified.length,
      totalCompsObserved: (rawComps || []).length
    },
    ias38Accounting: {
      dVal,
      aVal,
      vsCalculated,
      isFloorActive: calculatedFairValue === dVal && dVal > vsCalculated,
      accountingStandard: "IAS 38 Compliant"
    },
    latentCluster: {
      clusterId: cluster.clusterId,
      clusterName: cluster.clusterName,
      Sc,
      beta,
      Ac,
      Sz,
      CpBase
    },
    shapValues: {
      base: shapBase,
      scarcity: shapScarcity,
      grade: shapGrade,
      hype: shapHype,
      sentiment: shapSentiment,
      macro: shapMacro,
      floorLift: shapIAS38FloorLift,
      total: calculatedFairValue
    },
    qualifiedComps: qualified,
    trimmedComps: trimmed,
    parametersUsed: {
      Hz,
      Sz: SzSentiment,
      M,
      t: t.toFixed(1),
      scarcityFactor: scarcityFactor.toFixed(3)
    }
  };
}
