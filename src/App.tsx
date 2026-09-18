import { useState, useEffect, useMemo, useRef, MouseEvent, FormEvent } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Firestore
} from "firebase/firestore";
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
  Auth
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";
import {
  ActiveSlabData,
  VaultCard,
  CardMeta
} from "./types";
import { sanitizeCsvField } from "./utils/csv";
import {
  initFirebaseService,
  handleFirestoreError,
  OperationType
} from "./services/firebaseService";
import { cardIntelligenceGateway } from "./services/geminiGateway";

import { Header } from "./components/Header";
import { SearchTab } from "./components/SearchTab";
import { SlabMirror } from "./components/SlabMirror";
import { VaultTab } from "./components/VaultTab";
import { ConfigDrawer } from "./components/ConfigDrawer";
import { RapidEntryModal } from "./components/RapidEntryModal";
import {
  Search,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  X,
  Info
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("scan");
  const [slabStyle, setSlabStyle] = useState<string>("psa-red");

  const [showShapDrawer, setShowShapDrawer] = useState<boolean>(false);
  const [showCompAuditDrawer, setShowCompAuditDrawer] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [showRapidEntryModal, setShowRapidEntryModal] = useState<boolean>(false);
  const [showScannerHelper, setShowScannerHelper] = useState<boolean>(false);

  const [systemTime, setSystemTime] = useState<string>("");
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "TACTICAL VALUATION TERMINAL INITIALIZED [OK]",
    "MATTSAPP MASTER VALUATION ENGINE MOUNTED",
    "IAS 38 DUAL-LAYER COST FLOOR ARMED",
    "SEARCH GROUNDING MOTOR READY"
  ]);

  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [vaultCards, setVaultCards] = useState<VaultCard[]>([]);
  const [vaultLoading, setVaultLoading] = useState<boolean>(true);
  const [vaultFilter, setVaultFilter] = useState<string>("ALL");
  const [vaultSearchQuery, setVaultSearchQuery] = useState<string>("");

  const [inputQuery, setInputQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSlabData, setActiveSlabData] = useState<ActiveSlabData | null>(null);

  const [customApiKey, setCustomApiKey] = useState<string>(import.meta.env.VITE_GEMINI_API_KEY || "");
  const [customGatewayUrl, setCustomGatewayUrl] = useState<string>(import.meta.env.VITE_API_GATEWAY_URL || "");
  const [customFirebaseKey, setCustomFirebaseKey] = useState<string>(import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || "");
  const [customProjectId, setCustomProjectId] = useState<string>(import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || "");

  const [manualForm, setManualForm] = useState({
    player: "",
    year: 2024,
    set: "",
    cardNumber: "",
    parallel: "Base",
    serialNumber: "Unnumbered",
    attributes: "Rookie Card",
    gradeCompany: "PSA",
    gradeCondition: "GEM MT",
    grade: "10",
    estimatedLow: 100,
    estimatedMedian: 200,
    estimatedHigh: 350,
    isWatchlist: false
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
      setSystemTime(`UTC ${now.toISOString().slice(11, 19)} | LOC ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (entry: string) => {
    setSystemLogs((prev) => [
      `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] ${entry}`,
      ...prev.slice(0, 24)
    ]);
  };

  useEffect(() => {
    const { db: firestore, auth: firebaseAuth } = initFirebaseService(customFirebaseKey, customProjectId);

    if (!firestore || !firebaseAuth) {
      setFirebaseConnected(false);
      setVaultLoading(false);
      addLog("STANDBY: Firebase keys unconfigured. Running in local session buffer.");
      return;
    }

    setDb(firestore);
    setAuth(firebaseAuth);

    signInAnonymously(firebaseAuth)
      .then((cred) => {
        setCurrentUser(cred.user);
        addLog(`SEC-AUTH: Firebase session established [UID: ${cred.user.uid.slice(0, 8)}...]`);
      })
      .catch((err) => {
        console.warn("Auth Notice:", err);
        addLog(`AUTH NOTICE: ${err.message}`);
      });

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      if (user) {
        addLog(`SEC-GATE: Subscribing to cloud vault: users/${user.uid.slice(0, 6)}.../vault`);
        const vaultRef = collection(firestore, "users", user.uid, "vault");
        const unsubscribeVault = onSnapshot(
          vaultRef,
          (snapshot) => {
            const loaded: VaultCard[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              loaded.push({
                id: d.id,
                player: data.player || "Unknown Subject",
                year: Number(data.year) || 2024,
                set: data.set || "Unknown Set",
                cardNumber: data.cardNumber || "#--",
                parallel: data.parallel || "Base",
                serialNumber: data.serialNumber || "Unnumbered",
                attributes: data.attributes || "Standard",
                gradeCompany: data.gradeCompany || "PSA",
                gradeCondition: data.gradeCondition || "GEM MT",
                grade: data.grade || "10",
                certNumber: data.certNumber || "00000000",
                pricePoints: data.pricePoints || {
                  floor: Number(data.estimatedLow) || 0,
                  fairValue: Number(data.estimatedMedian) || 0,
                  ceiling: Number(data.estimatedHigh) || 0,
                  compsCount: 1
                },
                ias38Accounting: data.ias38Accounting || {
                  dVal: 50,
                  aVal: Number(data.estimatedMedian) || 0,
                  vsCalculated: Number(data.estimatedMedian) || 0,
                  isFloorActive: false
                },
                latentCluster: data.latentCluster || null,
                shapValues: data.shapValues || null,
                isWatchlist: Boolean(data.isWatchlist),
                notes: data.notes || "",
                sourceUrl: data.sourceUrl || "",
                createdAt: data.createdAt
              });
            });

            loaded.sort((a, b) => (b.pricePoints?.fairValue || 0) - (a.pricePoints?.fairValue || 0));
            setVaultCards(loaded);
            setFirebaseConnected(true);
            setVaultLoading(false);
            addLog(`VAULT SYNC: ${loaded.length} private assets verified in cloud storage`);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/vault`, firebaseAuth);
            setFirebaseConnected(false);
            setVaultLoading(false);
            addLog(`ERR VAULT SYNC: ${err.message}`);
          }
        );
        return () => unsubscribeVault();
      } else {
        setVaultLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [customFirebaseKey, customProjectId]);

  const handleRunRecon = async (queryToRun?: string) => {
    const target = queryToRun || inputQuery;
    if (!target.trim()) {
      setErrorMessage("COMMAND REJECTED: Input search fragment cannot be blank.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(null);
    addLog(`RECON DISPATCH: "${target.slice(0, 34)}"`);

    try {
      const token = currentUser ? await currentUser.getIdToken().catch(() => null) : null;
      const data = await cardIntelligenceGateway({
        query: target,
        action: "ACTION_IDENTIFY",
        authToken: token,
        developerKey: customApiKey
      });

      setActiveSlabData(data);
      setActiveTab("intel");
      addLog(`VALUATION RESOLVED: [${data.player}] Fair Value: $${data.pricePoints.fairValue.toLocaleString()} (n=${data.pricePoints.compsCount})`);
    } catch (err: any) {
      console.error("Recon error:", err);
      setErrorMessage(err.message || "Failed to complete card valuation.");
      addLog(`ERR RECON: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToVault = async (isWatchlistOnly = false) => {
    if (!activeSlabData) return;

    const newDoc = {
      player: activeSlabData.player,
      year: activeSlabData.year,
      set: activeSlabData.set,
      cardNumber: activeSlabData.cardNumber,
      parallel: activeSlabData.parallel,
      serialNumber: activeSlabData.serialNumber,
      attributes: activeSlabData.attributes,
      gradeCompany: activeSlabData.gradeCompany,
      gradeCondition: activeSlabData.gradeCondition,
      grade: activeSlabData.grade,
      certNumber: activeSlabData.certNumber,
      pricePoints: activeSlabData.pricePoints,
      ias38Accounting: activeSlabData.ias38Accounting,
      latentCluster: activeSlabData.latentCluster,
      shapValues: activeSlabData.shapValues,
      isWatchlist: isWatchlistOnly,
      sourceUrl: activeSlabData.sources[0]?.uri || "",
      notes: `Recon Query: "${activeSlabData.rawQuery}". Verified comps: ${activeSlabData.pricePoints.compsCount}`,
      createdAt: serverTimestamp()
    };

    if (db && currentUser && firebaseConnected) {
      try {
        const ref = await addDoc(collection(db, "users", currentUser.uid, "vault"), newDoc);
        addLog(`VAULT COMMIT: Asset saved to users/${currentUser.uid.slice(0, 6)}/vault [ID: ${ref.id.slice(0, 8)}]`);
        setStatusMessage(`Committed ${activeSlabData.player} to Cloud Vault.`);
        setTimeout(() => setStatusMessage(null), 3500);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/vault`, { currentUser });
        console.error("Vault commit error:", err);
        setErrorMessage(`Vault commit error: ${err.message}`);
        addLog(`ERR COMMIT: ${err.message}`);
      }
    } else {
      const tempId = "local_" + Date.now();
      const localRecord: VaultCard = {
        ...newDoc,
        id: tempId,
        createdAt: new Date().toISOString()
      };
      setVaultCards((prev) => [localRecord, ...prev]);
      addLog(`BUFFER COMMIT: Stored ${activeSlabData.player} in local memory [ID: ${tempId}]`);
      setStatusMessage(`Stored in session buffer (Configure Firebase for cloud sync).`);
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDeleteCard = async (cardId: string, e?: MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Confirm purging this asset from your private vault?")) return;

    if (db && currentUser && firebaseConnected && !cardId.startsWith("local_")) {
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "vault", cardId));
        addLog(`VAULT PURGE: Removed card ${cardId.slice(0, 8)}`);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/vault/${cardId}`, { currentUser });
        console.error("Delete error:", err);
        addLog(`ERR PURGE: ${err.message}`);
      }
    } else {
      setVaultCards((prev) => prev.filter((c) => c.id !== cardId));
      addLog(`BUFFER PURGE: Removed card ${cardId}`);
    }
  };

  const handleToggleWatchlist = async (cardId: string, currentVal: boolean, e?: any) => {
    e?.stopPropagation();
    if (db && currentUser && firebaseConnected && !cardId.startsWith("local_")) {
      try {
        await updateDoc(doc(db, "users", currentUser.uid, "vault", cardId), {
          isWatchlist: !currentVal
        });
        addLog(`VAULT UPDATE: Asset ${cardId.slice(0, 8)} watchlist set to ${!currentVal}`);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/vault/${cardId}`, { currentUser });
        console.error("Watchlist update error:", err);
        addLog(`ERR UPDATE: ${err.message}`);
      }
    } else {
      setVaultCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, isWatchlist: !currentVal } : c))
      );
    }
  };

  const handleManualAddSubmit = async (e: any) => {
    e.preventDefault();
    if (!manualForm.player || !manualForm.set) return;

    const payload = {
      player: manualForm.player,
      year: Number(manualForm.year),
      set: manualForm.set,
      cardNumber: manualForm.cardNumber || "#--",
      parallel: manualForm.parallel || "Base",
      serialNumber: manualForm.serialNumber || "Unnumbered",
      attributes: manualForm.attributes || "Standard Issue",
      gradeCompany: manualForm.gradeCompany,
      gradeCondition: manualForm.gradeCondition,
      grade: manualForm.grade,
      certNumber: String(Math.floor(10000000 + Math.random() * 90000000)),
      pricePoints: {
        floor: Number(manualForm.estimatedLow),
        fairValue: Number(manualForm.estimatedMedian),
        ceiling: Number(manualForm.estimatedHigh),
        compsCount: 1
      },
      ias38Accounting: {
        dVal: 45,
        aVal: Number(manualForm.estimatedMedian),
        vsCalculated: Number(manualForm.estimatedMedian),
        isFloorActive: false
      },
      isWatchlist: manualForm.isWatchlist,
      notes: "Manual inventory entry",
      createdAt: serverTimestamp()
    };

    if (db && currentUser && firebaseConnected) {
      try {
        await addDoc(collection(db, "users", currentUser.uid, "vault"), payload);
        addLog(`MANUAL COMMIT: "${manualForm.player}" written to Firestore`);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/vault`, { currentUser });
        console.error("Manual add error:", err);
        addLog(`ERR MANUAL COMMIT: ${err.message}`);
      }
    } else {
      setVaultCards((prev) => [{ ...payload, id: "local_" + Date.now(), createdAt: new Date().toISOString() }, ...prev]);
      addLog(`MANUAL COMMIT: "${manualForm.player}" stored in local buffer`);
    }

    setShowRapidEntryModal(false);
    setManualForm({
      player: "",
      year: 2024,
      set: "",
      cardNumber: "",
      parallel: "Base",
      serialNumber: "Unnumbered",
      attributes: "Rookie Card",
      gradeCompany: "PSA",
      gradeCondition: "GEM MT",
      grade: "10",
      estimatedLow: 100,
      estimatedMedian: 200,
      estimatedHigh: 350,
      isWatchlist: false
    });
  };

  const handleExportVault = (type = "csv") => {
    if (vaultCards.length === 0) {
      alert("No cards in vault to export.");
      return;
    }

    if (type === "json") {
      const blob = new Blob([JSON.stringify(vaultCards, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mattsapp-vault-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addLog("EXPORT: Vault catalog exported to JSON");
    } else {
      const headers = ["ID", "Player", "Year", "Set", "CardNumber", "Parallel", "Serial", "Grade", "FairValue_USD", "Floor_USD", "Ceiling_USD", "Watchlist"];
      const rows = vaultCards.map((c) => [
        sanitizeCsvField(c.id),
        sanitizeCsvField(c.player),
        sanitizeCsvField(c.year),
        sanitizeCsvField(c.set),
        sanitizeCsvField(c.cardNumber),
        sanitizeCsvField(c.parallel),
        sanitizeCsvField(c.serialNumber),
        sanitizeCsvField(`${c.gradeCompany} ${c.grade}`),
        sanitizeCsvField(c.pricePoints?.fairValue || 0),
        sanitizeCsvField(c.pricePoints?.floor || 0),
        sanitizeCsvField(c.pricePoints?.ceiling || 0),
        sanitizeCsvField(c.isWatchlist ? "YES" : "NO")
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mattsapp-vault-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addLog("EXPORT: Vault catalog exported to CSV");
    }
  };

  const filteredVault = useMemo(() => {
    let result = vaultCards;
    if (vaultFilter === "WATCHLIST") result = result.filter((c) => c.isWatchlist);
    if (vaultFilter === "HIGH_VALUE") result = result.filter((c) => (c.pricePoints?.fairValue || 0) >= 1000);
    if (vaultFilter === "RAW") result = result.filter((c) => c.gradeCompany === "RAW" || c.grade === "Ungraded");

    if (vaultSearchQuery.trim()) {
      const q = vaultSearchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.player.toLowerCase().includes(q) ||
          c.set.toLowerCase().includes(q) ||
          c.parallel.toLowerCase().includes(q) ||
          c.cardNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vaultCards, vaultFilter, vaultSearchQuery]);

  const totalVaultValue = useMemo(() => {
    return vaultCards.reduce((sum, c) => sum + (c.pricePoints?.fairValue || 0), 0);
  }, [vaultCards]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#e2e8f0] font-sans antialiased flex flex-col justify-between selection:bg-[#f59e0b] selection:text-black">
      <Header
        systemTime={systemTime}
        firebaseConnected={firebaseConnected}
        currentUser={currentUser}
        onOpenConfig={() => setShowConfigDrawer(true)}
      />

      <main className="flex-1 max-w-md w-full mx-auto px-3 pt-3 pb-24 flex flex-col space-y-3 overflow-x-hidden">
        {errorMessage && (
          <div className="p-3 bg-rose-950/70 border border-rose-600/80 rounded-lg text-rose-200 text-xs flex items-start gap-2 shadow-md animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-bold font-mono tracking-wide uppercase block text-[10px] text-rose-300">
                SYSTEM INTERRUPT
              </span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-lg text-[#10b981] text-xs flex items-center gap-2 shadow-md font-mono animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {!firebaseConnected && (
          <div className="p-2 bg-[#121622] border border-[#f59e0b]/40 rounded-lg text-xs flex items-center justify-between text-[#f59e0b] font-mono">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Operating in authenticated local buffer</span>
            </div>
            <button
              onClick={() => setShowConfigDrawer(true)}
              className="text-[10px] font-bold underline hover:text-white"
            >
              CONFIG FIREBASE →
            </button>
          </div>
        )}

        {activeTab === "scan" && (
          <SearchTab
            inputQuery={inputQuery}
            setInputQuery={setInputQuery}
            isProcessing={isProcessing}
            onRunRecon={handleRunRecon}
            onOpenRapidEntry={() => setShowRapidEntryModal(true)}
            showScannerHelper={showScannerHelper}
            setShowScannerHelper={setShowScannerHelper}
            activeSlabData={activeSlabData}
            onSelectTab={setActiveTab}
            onSaveToVault={handleSaveToVault}
            systemLogs={systemLogs}
            searchInputRef={searchInputRef}
          />
        )}

        {activeTab === "intel" && (
          <SlabMirror
            activeSlabData={activeSlabData}
            slabStyle={slabStyle}
            setSlabStyle={setSlabStyle}
            showShapDrawer={showShapDrawer}
            setShowShapDrawer={setShowShapDrawer}
            showCompAuditDrawer={showCompAuditDrawer}
            setShowCompAuditDrawer={setShowCompAuditDrawer}
            onSaveToVault={handleSaveToVault}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === "vault" && (
          <VaultTab
            vaultCards={vaultCards}
            vaultLoading={vaultLoading}
            vaultFilter={vaultFilter}
            setVaultFilter={setVaultFilter}
            vaultSearchQuery={vaultSearchQuery}
            setVaultSearchQuery={setVaultSearchQuery}
            totalVaultValue={totalVaultValue}
            onExportVault={handleExportVault}
            onOpenRapidEntry={() => setShowRapidEntryModal(true)}
            onSelectSlabData={setActiveSlabData}
            onSelectTab={setActiveTab}
            onToggleWatchlist={handleToggleWatchlist}
            onDeleteCard={handleDeleteCard}
            filteredVault={filteredVault}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e17]/95 backdrop-blur-md border-t border-[#252d3d] max-w-md mx-auto">
        <div className="grid grid-cols-3 h-14">
          <button
            onClick={() => setActiveTab("scan")}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              activeTab === "scan"
                ? "text-[#f59e0b] border-t-2 border-[#f59e0b]"
                : "text-[#64748b] hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">[SEARCH / SCAN]</span>
          </button>

          <button
            onClick={() => setActiveTab("intel")}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              activeTab === "intel"
                ? "text-[#f59e0b] border-t-2 border-[#f59e0b]"
                : "text-[#64748b] hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">[SLAB INTEL]</span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              activeTab === "vault"
                ? "text-[#f59e0b] border-t-2 border-[#f59e0b]"
                : "text-[#64748b] hover:text-white"
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">[MY VAULT]</span>
          </button>
        </div>
      </nav>

      {showConfigDrawer && (
        <ConfigDrawer
          customGatewayUrl={customGatewayUrl}
          setCustomGatewayUrl={setCustomGatewayUrl}
          customApiKey={customApiKey}
          setCustomApiKey={setCustomApiKey}
          customFirebaseKey={customFirebaseKey}
          setCustomFirebaseKey={setCustomFirebaseKey}
          customProjectId={customProjectId}
          setCustomProjectId={setCustomProjectId}
          firebaseConnected={firebaseConnected}
          onClose={() => setShowConfigDrawer(false)}
          onApply={() => {
            setShowConfigDrawer(false);
            addLog("CONFIG: Custom configuration saved to local memory");
          }}
        />
      )}

      {showRapidEntryModal && (
        <RapidEntryModal
          manualForm={manualForm}
          setManualForm={setManualForm}
          onSubmit={handleManualAddSubmit}
          onClose={() => setShowRapidEntryModal(false)}
        />
      )}
    </div>
  );
}
