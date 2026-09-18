import React from "react";
import {
  Download,
  Plus,
  X,
  RefreshCw,
  Bookmark,
  Trash2,
  Database
} from "lucide-react";
import { VaultCard, ActiveSlabData } from "../types";

interface VaultTabProps {
  vaultCards: VaultCard[];
  vaultLoading: boolean;
  vaultFilter: string;
  setVaultFilter: (filter: string) => void;
  vaultSearchQuery: string;
  setVaultSearchQuery: (query: string) => void;
  totalVaultValue: number;
  onExportVault: (type: "csv" | "json") => void;
  onOpenRapidEntry: () => void;
  onSelectSlabData: (data: ActiveSlabData) => void;
  onSelectTab: (tab: string) => void;
  onToggleWatchlist: (cardId: string, currentVal: boolean, e: React.MouseEvent) => void;
  onDeleteCard: (cardId: string, e: React.MouseEvent) => void;
  filteredVault: VaultCard[];
}

export const VaultTab: React.FC<VaultTabProps> = ({
  vaultCards,
  vaultLoading,
  vaultFilter,
  setVaultFilter,
  vaultSearchQuery,
  setVaultSearchQuery,
  totalVaultValue,
  onExportVault,
  onOpenRapidEntry,
  onSelectSlabData,
  onSelectTab,
  onToggleWatchlist,
  onDeleteCard,
  filteredVault
}) => {
  const counts = React.useMemo(() => {
    let watchlist = 0;
    let highValue = 0;
    let raw = 0;

    for (let i = 0; i < vaultCards.length; i++) {
      const c = vaultCards[i];
      if (c.isWatchlist) watchlist++;
      if ((c.pricePoints?.fairValue || 0) >= 1000) highValue++;
      if (c.gradeCompany === "RAW" || c.grade === "Ungraded") raw++;
    }

    return { watchlist, highValue, raw };
  }, [vaultCards]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      <div className="bg-[#121622] border border-[#252d3d] rounded-xl p-3.5 space-y-2 shadow-xl">
        <div className="flex justify-between items-center text-[10px] font-mono text-[#64748b]">
          <span>PRIVATE ENCRYPTED VAULT</span>
          <span className="text-[#10b981] font-bold">{vaultCards.length} ASSETS REGISTERED</span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[9px] text-[#94a3b8] font-mono uppercase">ESTIMATED PORTFOLIO VALUE</div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              ${totalVaultValue.toLocaleString()}
            </div>
          </div>

          <div className="flex space-x-1.5">
            <button
              onClick={() => onExportVault("csv")}
              className="p-2 bg-[#171c2b] hover:bg-[#20273c] text-white border border-[#252d3d] rounded-lg text-[10px] font-mono flex items-center gap-1"
              title="Export Vault as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#06b6d4]" /> CSV
            </button>
            <button
              onClick={() => onExportVault("json")}
              className="p-2 bg-[#171c2b] hover:bg-[#20273c] text-white border border-[#252d3d] rounded-lg text-[10px] font-mono flex items-center gap-1"
              title="Export Vault as JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#f59e0b]" /> JSON
            </button>
            <button
              onClick={onOpenRapidEntry}
              className="p-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold rounded-lg text-[10px] font-mono flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> ADD
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={vaultSearchQuery}
            onChange={(e) => setVaultSearchQuery(e.target.value)}
            placeholder="Filter vault by player, set, serial #..."
            className="w-full bg-[#121622] border border-[#252d3d] focus:border-[#f59e0b] rounded-lg px-3 py-2 text-xs text-white placeholder-[#475569] font-mono outline-none"
          />
          {vaultSearchQuery && (
            <button
              onClick={() => setVaultSearchQuery("")}
              className="absolute right-3 top-2.5 text-[#64748b] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 text-[10px] font-mono no-scrollbar">
          {[
            { id: "ALL", label: `ALL (${vaultCards.length})` },
            { id: "WATCHLIST", label: `WATCHLIST (${counts.watchlist})` },
            { id: "HIGH_VALUE", label: `HIGH VALUE $1K+ (${counts.highValue})` },
            { id: "RAW", label: `RAW (${counts.raw})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setVaultFilter(f.id)}
              className={`px-2.5 py-1 rounded border whitespace-nowrap transition-colors ${
                vaultFilter === f.id
                  ? "bg-[#f59e0b] text-black border-[#f59e0b] font-bold"
                  : "bg-[#121622] text-[#94a3b8] border-[#252d3d] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {vaultLoading ? (
        <div className="p-8 text-center font-mono text-xs text-[#64748b] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#f59e0b]" />
          <span>SYNCHRONIZING SECURE VAULT...</span>
        </div>
      ) : filteredVault.length > 0 ? (
        <div className="space-y-2">
          {filteredVault.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                onSelectSlabData({
                  player: card.player,
                  year: card.year,
                  set: card.set,
                  cardNumber: card.cardNumber,
                  parallel: card.parallel,
                  serialNumber: card.serialNumber,
                  attributes: card.attributes,
                  gradeCompany: card.gradeCompany,
                  gradeCondition: card.gradeCondition,
                  grade: card.grade,
                  certNumber: card.certNumber,
                  pricePoints: card.pricePoints || {
                    floor: 100,
                    fairValue: 200,
                    ceiling: 350,
                    compsCount: 1
                  },
                  ias38Accounting: card.ias38Accounting || {
                    dVal: 50,
                    aVal: 200,
                    vsCalculated: 200,
                    isFloorActive: false
                  },
                  latentCluster: card.latentCluster as any,
                  shapValues: card.shapValues as any,
                  qualifiedComps: [],
                  trimmedComps: [],
                  parametersUsed: {
                    Hz: 0.5,
                    Sz: 0.1,
                    M: 1.0,
                    t: "1.0",
                    scarcityFactor: "1.000"
                  },
                  analysisText: "Vault card loaded from secure repository.",
                  searchQueries: [],
                  verifiedAttributes: [`Card: ${card.player}`, `Set: ${card.set}`, `Grade: ${card.gradeCompany} ${card.grade}`],
                  missingAttributes: [],
                  sources: [],
                  rawQuery: `${card.year} ${card.set} ${card.player}`,
                  timestamp: new Date().toISOString()
                });
                onSelectTab("intel");
              }}
              className="p-3 bg-[#121622] hover:bg-[#171c2b] border border-[#252d3d] hover:border-[#f59e0b]/50 rounded-xl cursor-pointer transition-all shadow group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white truncate group-hover:text-[#f59e0b] transition-colors">
                      {card.player}
                    </span>
                    {card.isWatchlist && (
                      <span className="px-1.5 py-0.2 bg-[#f59e0b]/20 text-[#f59e0b] rounded text-[8px] font-mono font-bold">
                        WATCH
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#94a3b8] font-mono truncate mt-0.5">
                    {card.year} {card.set} {card.cardNumber}
                  </div>

                  <div className="text-[10px] text-[#64748b] font-mono mt-0.5 truncate">
                    {card.parallel} {card.serialNumber !== "Unnumbered" ? `// ${card.serialNumber}` : ""}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-[#10b981] font-mono">
                    ${(card.pricePoints?.fairValue || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#64748b] font-mono">
                    {card.gradeCompany} {card.grade}
                  </div>

                  <div className="flex items-center justify-end space-x-1 mt-2">
                    <button
                      onClick={(e) => onToggleWatchlist(card.id, card.isWatchlist, e)}
                      className={`p-1 rounded text-xs transition-colors ${
                        card.isWatchlist ? "text-[#f59e0b]" : "text-[#64748b] hover:text-white"
                      }`}
                      title="Toggle Watchlist"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => onDeleteCard(card.id, e)}
                      className="p-1 text-[#64748b] hover:text-rose-400 rounded transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#121622] border border-[#252d3d] rounded-xl p-8 text-center space-y-3 font-mono">
          <div className="w-12 h-12 rounded-full bg-[#171c2b] text-[#64748b] border border-[#252d3d] flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">NO VAULT ASSETS DETECTED</div>
            <p className="text-xs text-[#64748b] mt-1 max-w-xs mx-auto">
              {vaultSearchQuery
                ? "No records matched your search query."
                : "Scan your cards in [SEARCH / SCAN] and commit them directly to your vault."}
            </p>
          </div>
          <button
            onClick={() => onSelectTab("scan")}
            className="px-4 py-2 bg-[#f59e0b] text-black font-bold text-xs rounded-lg uppercase"
          >
            START CARD SCAN
          </button>
        </div>
      )}
    </div>
  );
};
