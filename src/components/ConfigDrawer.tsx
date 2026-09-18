import React from "react";
import { Sliders, X, Shield } from "lucide-react";
import { getFirebaseConfig } from "../services/firebaseService";

interface ConfigDrawerProps {
  customGatewayUrl: string;
  setCustomGatewayUrl: (url: string) => void;
  customApiKey: string;
  setCustomApiKey: (key: string) => void;
  customFirebaseKey: string;
  setCustomFirebaseKey: (key: string) => void;
  customProjectId: string;
  setCustomProjectId: (id: string) => void;
  firebaseConnected: boolean;
  onClose: () => void;
  onApply: () => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  customGatewayUrl,
  setCustomGatewayUrl,
  customApiKey,
  setCustomApiKey,
  customFirebaseKey,
  setCustomFirebaseKey,
  customProjectId,
  setCustomProjectId,
  firebaseConnected,
  onClose,
  onApply
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-sm bg-[#0c0e17] border-l border-[#252d3d] h-full p-4 overflow-y-auto space-y-4 font-mono text-xs flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#252d3d] pb-2 text-[#f59e0b]">
            <span className="font-extrabold flex items-center gap-1.5 text-sm">
              <Sliders className="w-4 h-4" /> SYSTEM CONFIGURATION
            </span>
            <button
              onClick={onClose}
              className="p-1 text-[#64748b] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 bg-[#121622] rounded-lg border border-[#252d3d] space-y-1 text-[10px]">
            <div className="text-[#06b6d4] font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" /> ZERO-TRUST MEDIATION
            </div>
            <p className="text-[#94a3b8] leading-relaxed">
              In production, queries route through a secured backend proxy. For prototyping, the developer adapter communicates directly with Gemini 3.8 Flash + Google Search Grounding.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[#94a3b8] text-[10px] uppercase font-bold">
              API GATEWAY PROXY URL (OPTIONAL):
            </label>
            <input
              type="text"
              value={customGatewayUrl}
              onChange={(e) => setCustomGatewayUrl(e.target.value)}
              placeholder="https://api.yourdomain.com"
              className="w-full bg-[#090a0f] border border-[#252d3d] rounded p-2 text-white outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#94a3b8] text-[10px] uppercase font-bold">
              GEMINI API KEY (PROTOTYPE ADAPTER):
            </label>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#090a0f] border border-[#252d3d] rounded p-2 text-white outline-none focus:border-[#f59e0b]"
            />
            <p className="text-[9px] text-[#10b981]">
              {customApiKey ? "✓ Gemini Live Search Recon Armed" : "⚡ Autonomous Econometric Engine Active (No key required)"}
            </p>
          </div>

          <div className="space-y-2 border-t border-[#1e2535] pt-3">
            <div className="flex items-center justify-between">
              <div className="text-[#10b981] font-bold text-[11px]">FIREBASE CLOUD VAULT:</div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${firebaseConnected ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#f59e0b]/20 text-[#f59e0b]"}`}>
                {firebaseConnected ? "ONLINE / SECURED" : "INITIALIZING..."}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[#94a3b8] text-[9px]">API KEY:</label>
              <input
                type="password"
                value={customFirebaseKey}
                onChange={(e) => setCustomFirebaseKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#090a0f] border border-[#252d3d] rounded p-1.5 text-[10px] text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#94a3b8] text-[9px]">PROJECT ID:</label>
              <input
                type="text"
                value={customProjectId}
                onChange={(e) => setCustomProjectId(e.target.value)}
                placeholder="gen-lang-client-0199815442"
                className="w-full bg-[#090a0f] border border-[#252d3d] rounded p-1.5 text-[10px] text-white outline-none"
              />
              <p className="text-[9px] text-[#64748b]">
                Cloud Database: {getFirebaseConfig().firestoreDatabaseId || "(default)"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-[#252d3d]">
          <button
            onClick={onApply}
            className="w-full py-2 bg-[#f59e0b] hover:bg-[#d97706] text-black font-extrabold text-xs uppercase tracking-wider rounded font-mono"
          >
            APPLY CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};
