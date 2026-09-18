export type SportType = "NFL" | "NBA" | "MLB" | "Soccer";
export type GradeCompanyType = "PSA" | "BGS" | "SGC" | "CGC" | "RAW" | "Raw";

export interface MarketplaceComp {
  id?: string;
  price?: number;
  date?: string;
  venue?: string;
  grade?: string;
  gradeCompany?: string;
  isShillWarning?: boolean;
  isLotSale?: boolean;
  isDamaged?: boolean;
  rawPrice?: number;
  acceptedPrice?: number;
  bestOffer?: boolean;
  unpaid?: boolean;
  shillScore?: number;
  outlier?: boolean;
  note?: string;
}

export interface HedonicTraits {
  autograph: "None" | "Sticker" | "On-Card";
  patchQuality: string;
  workhorsePair: string;
  workhorsePrice: number;
  workhorse30dChange: number;
}

export interface CardAsset {
  id: string;
  player: string;
  year: number;
  set: string;
  variation: string;
  serialNumber: string;
  numberedTo: number;
  sport: SportType;
  gradeCompany: GradeCompanyType;
  grade: string;
  subgrades?: { centering: number; corners: number; edges: number; surface: number } | null;
  isBlackLabel: boolean;
  basePrice: number;
  cagr: number;
  tYears: number;
  hz: number;
  sz: number;
  popCount: number;
  macroM: number;
  acquisitionCost: number;
  comps: MarketplaceComp[];
  hedonicTraits: HedonicTraits;
}

export interface ValuationResult {
  Vs: number;
  lowerBound: number;
  upperBound: number;
  growthFactor: number;
  compIndex: number;
  psychFactor: number;
  scarcityFactor: number;
  macroM: number;
  validCompCount: number;
  rawCompCount: number;
}

export interface CardMeta {
  player: string;
  year: number;
  set: string;
  cardNumber: string;
  parallel: string;
  serialNumber: string;
  attributes: string;
  grade: string;
  gradeCondition: string;
  gradeCompany: string;
  certNumber?: string;
  verifiedAttributes?: string[];
  missingAttributes?: string[];
}

export interface PricePoints {
  floor: number;
  fairValue: number;
  ceiling: number;
  compsCount: number;
  totalCompsObserved?: number;
}

export interface IAS38Accounting {
  dVal: number;
  aVal: number;
  vsCalculated: number;
  isFloorActive: boolean;
  accountingStandard?: string;
}

export interface LatentClusterParams {
  Sc: number;
  beta: number;
  Ac: number;
  Sz: number;
  CpBase: number;
}

export interface LatentCluster extends LatentClusterParams {
  clusterId: string;
  clusterName: string;
}

export interface ShapValues {
  base: number;
  scarcity: number;
  grade: number;
  hype: number;
  sentiment: number;
  macro: number;
  floorLift: number;
  total: number;
}

export interface QualifiedComp extends MarketplaceComp {
  normalizedPrice: number;
  compMult: number;
  isSuspicious: boolean;
}

export interface TrimmedComp extends QualifiedComp {
  trimReason: string;
}

export interface ValuationOutput {
  pricePoints: PricePoints;
  ias38Accounting: IAS38Accounting;
  latentCluster: LatentCluster;
  shapValues: ShapValues;
  qualifiedComps: QualifiedComp[];
  trimmedComps: TrimmedComp[];
  parametersUsed: {
    Hz: number;
    Sz: number;
    M: number;
    t: string;
    scarcityFactor: string;
  };
}

export interface GroundingChunk {
  web?: {
    title?: string;
    uri?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ActiveSlabData extends CardMeta, ValuationOutput {
  analysisText: string;
  searchQueries: string[];
  sources: GroundingSource[];
  rawQuery: string;
  timestamp: string;
}

export interface VaultCard {
  id: string;
  player: string;
  year: number;
  set: string;
  cardNumber: string;
  parallel: string;
  serialNumber: string;
  attributes: string;
  gradeCompany: string;
  gradeCondition: string;
  grade: string;
  certNumber: string;
  pricePoints: PricePoints;
  ias38Accounting: IAS38Accounting;
  latentCluster?: LatentCluster | null;
  shapValues?: ShapValues | null;
  isWatchlist: boolean;
  notes?: string;
  sourceUrl?: string;
  createdAt?: any;
}
