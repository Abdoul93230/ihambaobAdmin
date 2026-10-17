import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Send, Paperclip, StickyNote, Zap, CheckCircle2, RotateCcw, ShieldAlert, AlertTriangle,
  Loader2, Store, User, Package, ShoppingBag, Clock, Wifi, WifiOff, X, Plus, Trash2, UserCheck, ChevronLeft, Bell, Mic,
} from "lucide-react";
import { VoicePlayer, useVoiceRecorder, RecordingBar } from "./Voice";
import { useAuth } from "@/contexts/AuthContext";
import { staffApi, useStaffSocket, errMsg, fcfa, timeShort, waitingFor, duration, notifyStaff } from "./staffApi";

const TABS = [
  { key: "open", label: "À répondre" },
  { key: "pending", label: "En attente client" },
  { key: "resolved", label: "Clôturées" },
  { key: "", label: "Toutes" },
];
const OVERDUE_MIN = 15;

// ─── Liste ─────────────────────────────────────────────────────────────────────
function ConversationItem({ c, active, onClick, typing }) {
  const overdue = c.status === "open" && c.awaitingSince && Date.now() - new Date(c.awaitingSince) > OVERDUE_MIN * 60000;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-gray-100 transition-colors ${active ? "bg-teal-50" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
            {(c.client?.name || "C")[0].toUpperCase()}
          </div>
          {c.store?.logo ? (
            <img src={c.store.logo} alt="" className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${c.unread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}>{c.client?.name}</p>
            <span className={`text-[11px] shrink-0 ${overdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {c.status === "open" && c.awaitingSince ? waitingFor(c.awaitingSince) : timeShort(c.lastMessage?.at)}
            </span>
          </div>
          <p className="text-[11px] text-teal-700 truncate">{c.store?.name}</p>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={`text-xs truncate ${typing ? "text-teal-600 italic" : c.unread ? "text-gray-800" : "text-gray-500"}`}>
              {typing ? typing : `${c.lastMessage?.from === "store" ? "Vous : " : ""}${c.lastMessage?.text || ""}`}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {c.flagged ? <ShieldAlert className="w-3.5 h-3.5 text-amber-500" title="Coordonnées masquées" /> : null}
              {c.escalatedAt ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" title="En retard" /> : null}
              {c.unread ? <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span> : null}
            </div>
          </div>
          {!c.assignedTo ? <p className="text-[10px] text-orange-600 mt-0.5">Sans responsable</p> : null}
        </div>
      </div>
    </button>
  );
}

// ─── Bulles ────────────────────────────────────────────────────────────────────
function Card({ card }) {
  if (!card) return null;
  const Icon = card.kind === "order" ? ShoppingBag : Package;
  return (
    <div className="flex items-center gap-2.5 p-2 mb-1.5 rounded-lg bg-white/90 border border-black/5 text-gray-800">
      {card.image ? <img src={card.image} alt="" className="w-11 h-11 rounded-md object-cover" /> : (
        <div className="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center"><Icon className="w-5 h-5 text-gray-500" /></div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">{card.title}</p>
        {card.subtitle ? <p className="text-[11px] text-gray-500 truncate">{card.subtitle}</p> : null}
        <p className="text-xs font-bold text-teal-700">{fcfa(card.price)}</p>
      </div>
    </div>
  );
}

function Bubble({ m }) {
  if (m.internal) {
    return (
      <div className="flex justify-end my-1.5">
        <div className="max-w-[75%] rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">Note interne · {m.author?.name || "Équipe"}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
          <p className="text-[10px] text-amber-500 text-right mt-0.5">{timeShort(m.createdAt)}</p>
        </div>
      </div>
    );
  }
  const mine = m.from === "store";
  return (
    <div className={`flex my-1 ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${mine ? "bg-[#30A08B] text-white rounded-br-md" : "bg-white border border-gray-100 text-gray-900 rounded-bl-md"} ${m.pending ? "opacity-60" : ""} ${m.failed ? "ring-2 ring-red-400" : ""}`}>
        <Card card={m.card} />
        {(m.attachments || []).map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="rounded-lg mb-1.5 max-h-60 object-cover" /></a>
        ))}
        {m.audio?.url || m.localUrl ? <VoicePlayer url={m.audio?.url || m.localUrl} durationMs={m.audio?.durationMs} mine={mine} /> : null}
        {m.text ? <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p> : null}
        {m.masked ? (
          <p className={`flex items-center gap-1 text-[10px] mt-1 ${mine ? "text-white/80" : "text-amber-600"}`} title={`Texte d'origine : ${m.originalText || ""}`}>
            <ShieldAlert className="w-3 h-3" /> Coordonnées masquées (survolez pour voir l'original)
          </p>
        ) : null}
        <p className={`text-[10px] mt-0.5 text-right ${mine ? "text-white/75" : "text-gray-400"}`}>
          {mine && m.author?.name ? `${m.author.name} · ` : ""}
          {m.failed ? "Échec — cliquez sur Envoyer pour réessayer" : m.pending ? "Envoi…" : timeShort(m.createdAt)}
          {mine && !m.pending && !m.failed ? (m.readAt ? " · Lu" : " · Envoyé") : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Réponses rapides ──────────────────────────────────────────────────────────
function QuickReplies({ onPick, onClose, isAdmin }) {
  const [rows, setRows] = useState(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [shared, setShared] = useState(isAdmin);
  useEffect(() => { staffApi.quickReplies().then(setRows).catch(() => setRows([])); }, []);
  const save = async () => {
    if (!title.trim() || !text.trim()) return;
    const r = await staffApi.addQuickReply({ title, text, shared });
    setRows((x) => [...(x || []), r]);
    setAdding(false); setTitle(""); setText("");
  };
  return (
    <div className="absolute bottom-full left-0 mb-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 z-20">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <p className="text-sm font-semibold">Réponses rapides</p>
        <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {rows === null ? <Loader2 className="w-4 h-4 animate-spin m-4 text-gray-400" /> : rows.length === 0 ? (
          <p className="text-xs text-gray-500 p-3">Aucune réponse enregistrée. Créez vos réponses fréquentes (délais, retours, paiement…).</p>
        ) : rows.map((r) => (
          <div key={r.id} className="group flex items-start gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => onPick(r.text)}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{r.title} {r.shared ? <span className="text-[10px] text-teal-600 font-normal">· équipe</span> : null}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{r.text}</p>
            </div>
            {(!r.shared || isAdmin) ? (
              <button className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); staffApi.deleteQuickReply(r.id); setRows((x) => x.filter((y) => y.id !== r.id)); }}>
                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-t p-2">
        {adding ? (
          <div className="space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. Délais Niamey)" className="w-full text-sm border rounded-lg px-2 py-1.5" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Texte de la réponse" className="w-full text-sm border rounded-lg px-2 py-1.5" />
            {isAdmin ? <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> Partagée avec toute l'équipe</label> : null}
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="flex-1 text-xs py-1.5 rounded-lg border">Annuler</button>
              <button onClick={save} className="flex-1 text-xs py-1.5 rounded-lg bg-teal-600 text-white font-semibold">Enregistrer</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 py-1.5 rounded-lg hover:bg-teal-50">
            <Plus className="w-3.5 h-3.5" /> Nouvelle réponse rapide
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ServiceClient() {
  const { isManager } = useAuth();
  const isAdmin = !isManager;
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("open");
  const [sellerId, setSellerId] = useState("");
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({});
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState({}); // conversationId → { client: bool, staff: name }
  const [managers, setManagers] = useState([]);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const activeRef = useRef(null);
  activeRef.current = activeId;

  useEffect(() => {
    staffApi.me().then(setMe).catch(() => {});
    if (isAdmin) staffApi.managers().then(setManagers).catch(() => {});
  }, [isAdmin]);

  const params = useMemo(() => ({
    status: tab || undefined, sellerId: sellerId || undefined, assigned: mine ? "me" : undefined, q: q.trim() || undefined, limit: 60,
  }), [tab, sellerId, mine, q]);

  const loadList = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([staffApi.conversations(params), staffApi.counts()]);
      setList(r.data);
      setCounts(c);
    } catch { /* garde l'affichage */ } finally { setLoadingList(false); }
  }, [params]);

  useEffect(() => {
    setLoadingList(true);
    const t = setTimeout(loadList, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadList, q]);

  const matchesFilters = useCallback((c) =>
    (!params.status || c.status === params.status) && (!params.sellerId || c.store?.id === params.sellerId), [params]);

  // ── Temps réel ──
  const { socket, connected } = useStaffSocket({
    "message:new": ({ conversationId, message }) => {
      if (conversationId === activeRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          // Remplace le message optimiste correspondant
          const i = message.clientTempId ? prev.findIndex((m) => m.clientTempId === message.clientTempId) : -1;
          if (i >= 0) { const n = [...prev]; n[i] = message; return n; }
          return [...prev, message];
        });
        if (message.from === "client") {
          staffApi.read(conversationId);
          if (document.visibilityState !== "visible") notifyStaff("Nouveau message", message.text || "Photo");
        }
      } else if (message.from === "client") {
        notifyStaff("Nouveau message client", message.text || "Photo");
      }
      if (message.from === "client") setTyping((t) => ({ ...t, [conversationId]: { ...t[conversationId], client: false } }));
    },
    "conversation:updated": (c) => {
      setList((prev) => {
        const rest = prev.filter((x) => x.id !== c.id);
        const keepUnread = c.id === activeRef.current ? { ...c, unread: 0 } : c;
        return matchesFilters(c) ? [keepUnread, ...rest] : rest;
      });
      if (c.id === activeRef.current) setDetail((d) => (d ? { ...d, conversation: { ...d.conversation, ...c, client: d.conversation.client } } : d));
      staffApi.counts().then(setCounts).catch(() => {});
    },
    "conversation:read": ({ conversationId }) => setList((prev) => prev.map((x) => (x.id === conversationId ? { ...x, unread: 0 } : x))),
    "message:read": ({ conversationId, at }) => {
      if (conversationId === activeRef.current) setMessages((prev) => prev.map((m) => (m.from === "store" && !m.readAt ? { ...m, readAt: at } : m)));
    },
    "conversation:escalated": (c) => {
      notifyStaff("Client en attente", `${c.client?.name || "Un client"} attend une réponse de ${c.store?.name || "la boutique"}`);
      setList((prev) => prev.map((x) => (x.id === c.id ? { ...x, escalatedAt: c.escalatedAt } : x)));
    },
    typing: ({ conversationId, typing: on, from, name, kind }) => {
      setTyping((t) => ({ ...t, [conversationId]: { ...t[conversationId], ...(from === "client" ? { client: on ? (kind === "audio" ? "enregistre un vocal…" : "écrit…") : false } : { staff: on ? name : null }) } }));
    },
  });

  // Réinscription après reconnexion : la liste peut avoir bougé
  useEffect(() => { if (connected) loadList(); }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ouverture d'une conversation ──
  const open = useCallback(async (id) => {
    setActiveId(id);
    setDetail(null);
    setMessages([]);
    setLoadingThread(true);
    setText("");
    setInternal(false);
    try {
      const [d, msgs] = await Promise.all([staffApi.conversation(id), staffApi.messages(id)]);
      setDetail(d);
      setMessages(msgs.reverse());
      setHasMore(msgs.length >= 40);
      staffApi.read(id);
      socket?.emit("conversation:view", { conversationId: id });
      setList((prev) => prev.map((x) => (x.id === id ? { ...x, unread: 0 } : x)));
    } catch (e) {
      setDetail({ error: errMsg(e, "Conversation indisponible.") });
    } finally {
      setLoadingThread(false);
    }
  }, [socket]);

  const loadOlder = async () => {
    if (!messages.length) return;
    const older = await staffApi.messages(activeId, messages[0].id);
    setMessages((prev) => [...older.reverse(), ...prev]);
    setHasMore(older.length >= 40);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, activeId]);

  // ── Envoi ──
  const send = async (body = {}) => {
    const value = (body.text ?? text).trim();
    if ((!value && !body.attachments?.length) || !activeId) return;
    const clientTempId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: clientTempId, clientTempId, from: "store", internal, text: value, attachments: body.attachments || [],
      createdAt: new Date().toISOString(), pending: true, author: { name: me?.staff?.name },
    };
    setMessages((prev) => [...prev, optimistic]);
    if (body.text === undefined) setText("");
    socket?.emit("typing:stop", { conversationId: activeId });
    const payload = { conversationId: activeId, text: value, internal, attachments: body.attachments, clientTempId };
    const done = (msg) => setMessages((prev) => prev.map((m) => (m.clientTempId === clientTempId ? msg : m)));
    const fail = () => setMessages((prev) => prev.map((m) => (m.clientTempId === clientTempId ? { ...m, pending: false, failed: true } : m)));
    if (socket?.connected) {
      socket.timeout(10000).emit("message:send", payload, (err, ack) => {
        if (!err && ack?.ok) return done(ack.message);
        // Repli HTTP
        staffApi.send(activeId, payload).then(done).catch(fail);
      });
    } else {
      staffApi.send(activeId, payload).then(done).catch(fail);
    }
  };

  // ── Vocal ──
  const [voiceSending, setVoiceSending] = useState(false);
  const recorder = useVoiceRecorder({
    onStart: () => socket?.emit("typing:start", { conversationId: activeRef.current, kind: "audio" }),
    onStop: () => socket?.emit("typing:stop", { conversationId: activeRef.current }),
  });
  const startVoice = async () => {
    try { await recorder.start(); } catch { alert("Micro indisponible : autorisez l'accès au micro dans le navigateur."); }
  };
  const sendVoice = async () => {
    const rec = await recorder.stop();
    if (!rec || !activeId) return;
    const convId = activeId;
    const clientTempId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const localUrl = URL.createObjectURL(rec.blob);
    setMessages((prev) => [...prev, {
      id: clientTempId, clientTempId, from: "store", text: "", localUrl, audio: { url: null, durationMs: rec.durationMs },
      createdAt: new Date().toISOString(), pending: true, author: { name: me?.staff?.name },
    }]);
    setVoiceSending(true);
    try {
      const up = await staffApi.uploadAudio(rec.blob);
      const audio = { url: up.url, durationMs: up.durationMs || rec.durationMs };
      const payload = { conversationId: convId, text: "", audio, clientTempId };
      const done = (msg) => setMessages((prev) => prev.map((m) => (m.clientTempId === clientTempId ? { ...msg, localUrl } : m)));
      if (socket?.connected) {
        socket.timeout(10000).emit("message:send", payload, (err, ack) => {
          if (!err && ack?.ok) return done(ack.message);
          staffApi.send(convId, payload).then(done).catch(() => {});
        });
      } else {
        done(await staffApi.send(convId, payload));
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.clientTempId === clientTempId ? { ...m, pending: false, failed: true } : m)));
      alert(errMsg(e, "Vocal non envoyé."));
    } finally {
      setVoiceSending(false);
    }
  };

  const onType = (v) => {
    setText(v);
    if (!socket || !activeId || internal) return;
    socket.emit("typing:start", { conversationId: activeId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("typing:stop", { conversationId: activeId }), 2500);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await staffApi.upload(file);
      await send({ text: text, attachments: [url] });
      setText("");
    } catch (err) {
      alert(errMsg(err, "Photo non envoyée."));
    } finally {
      setUploading(false);
    }
  };

  const setStatus = async (status) => {
    const c = await staffApi.update(activeId, { status });
    setDetail((d) => ({ ...d, conversation: { ...d.conversation, status: c.status } }));
    if (tab && tab !== status) setList((prev) => prev.filter((x) => x.id !== activeId));
  };
  const assign = async (assignedTo) => {
    try {
      const c = await staffApi.update(activeId, { assignedTo });
      setDetail((d) => ({ ...d, conversation: { ...d.conversation, assignedTo: c.assignedTo } }));
    } catch (e) { alert(errMsg(e)); }
  };

  const conv = detail?.conversation;
  const typingHere = activeId ? typing[activeId] : null;
  const storeManagers = conv ? managers.filter((m) => m.isActive && m.sellers.some((s) => s.id === conv.store?.id)) : [];

  return (
    <div className="h-[calc(100vh-7.5rem)] flex bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* ── Liste ── */}
      <aside className={`${activeId ? "hidden lg:flex" : "flex"} w-full lg:w-80 xl:w-96 shrink-0 flex-col border-r border-gray-200`}>
        <div className="p-3 border-b border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Conversations</h2>
            <span className={`flex items-center gap-1 text-[11px] ${connected ? "text-teal-600" : "text-gray-400"}`}>
              {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} {connected ? "Temps réel" : "Reconnexion…"}
            </span>
          </div>
          {notifPerm === "default" ? (
            <button onClick={() => Notification.requestPermission().then(setNotifPerm)} className="w-full flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <Bell className="w-3.5 h-3.5" /> Activer les alertes du navigateur pour les nouveaux messages
            </button>
          ) : null}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client ou message…" className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          </div>
          <div className="flex gap-2">
            <select value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
              <option value="">Toutes les boutiques</option>
              {(me?.sellers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {isManager ? (
              <button onClick={() => setMine((v) => !v)} className={`text-xs px-2.5 rounded-lg border ${mine ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600"}`}>Les miennes</button>
            ) : null}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${tab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {t.label}{t.key && counts[t.key] ? ` · ${counts[t.key]}` : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : list.length === 0 ? (
            <div className="text-center text-sm text-gray-500 px-6 py-12">
              {tab === "open" ? "🎉 Aucun client en attente de réponse." : "Aucune conversation."}
            </div>
          ) : list.map((c) => (
            <ConversationItem key={c.id} c={c} active={c.id === activeId} onClick={() => open(c.id)} typing={typing[c.id]?.client} />
          ))}
        </div>
      </aside>

      {/* ── Fil ── */}
      <section className={`${activeId ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-[#F6F7F5]`}>
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <Store className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">Sélectionnez une conversation</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">Vous répondez au nom de la boutique : le client voit le nom et le logo de la boutique. Restez factuel — vérifiez auprès du vendeur avant d'affirmer un stock ou un délai.</p>
          </div>
        ) : loadingThread ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : detail?.error ? (
          <div className="flex-1 flex items-center justify-center text-sm text-red-600">{detail.error}</div>
        ) : conv ? (
          <>
            <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200">
              <button className="lg:hidden" onClick={() => setActiveId(null)}><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{conv.client?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  écrit à <span className="text-teal-700 font-medium">{conv.store?.name}</span>
                  {typingHere?.client ? <span className="text-teal-600 italic"> · {typingHere.client}</span> : null}
                  {typingHere?.staff ? <span className="text-amber-600"> · {typingHere.staff} rédige une réponse</span> : null}
                </p>
              </div>
              {isManager && conv.assignedTo?.id !== me?.staff?.id ? (
                <button onClick={() => assign(me?.staff?.id)} className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <UserCheck className="w-3.5 h-3.5" /> Prendre en charge
                </button>
              ) : null}
              {conv.status !== "resolved" ? (
                <button onClick={() => setStatus("resolved")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Clôturer
                </button>
              ) : (
                <button onClick={() => setStatus("open")} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <RotateCcw className="w-3.5 h-3.5" /> Rouvrir
                </button>
              )}
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {hasMore ? (
                <div className="text-center mb-2"><button onClick={loadOlder} className="text-xs text-teal-700 font-semibold hover:underline">Messages plus anciens</button></div>
              ) : null}
              {messages.map((m) => <Bubble key={m.id} m={m} />)}
              {typingHere?.client ? (
                <div className="flex my-1"><div className="bg-white border border-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-500 italic">{conv.client?.name?.split(" ")[0]} {typingHere.client}</div></div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <footer className={`border-t ${internal ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"} p-3`}>
              <div className="flex items-center gap-2 mb-2 relative">
                <button onClick={() => setInternal(false)} className={`text-xs px-2.5 py-1 rounded-full font-medium ${!internal ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  Répondre au client
                </button>
                <button onClick={() => setInternal(true)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${internal ? "bg-amber-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <StickyNote className="w-3 h-3" /> Note interne
                </button>
                <button onClick={() => setShowQuick((v) => !v)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium text-gray-600 hover:bg-gray-100">
                  <Zap className="w-3 h-3" /> Réponses rapides
                </button>
                {showQuick ? <QuickReplies isAdmin={isAdmin} onClose={() => setShowQuick(false)} onPick={(t) => { setText((v) => (v ? `${v}\n${t}` : t)); setShowQuick(false); }} /> : null}
              </div>
              <div className="flex items-end gap-2">
                {!internal ? (
                  <label className={`p-2.5 rounded-xl hover:bg-gray-100 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`} title="Envoyer une photo">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : <Paperclip className="w-5 h-5 text-gray-500" />}
                    <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                  </label>
                ) : null}
                {recorder.recording ? (
                  <RecordingBar elapsed={recorder.elapsed} level={recorder.level} onCancel={recorder.cancel} onSend={sendVoice} sending={voiceSending} />
                ) : (
                <textarea
                  value={text}
                  onChange={(e) => onType(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={Math.min(5, Math.max(1, text.split("\n").length))}
                  placeholder={internal ? "Note visible uniquement par l'équipe…" : `Répondre au nom de ${conv.store?.name}… (Entrée pour envoyer)`}
                  className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
                />
                )}
                {recorder.recording ? null : !internal && !text.trim() ? (
                  <button onClick={startVoice} className="p-2.5 rounded-xl text-white bg-[#30A08B] hover:bg-[#1F7A69]" title="Enregistrer un message vocal">
                    <Mic className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => send()} disabled={!text.trim()} className={`p-2.5 rounded-xl text-white ${internal ? "bg-amber-500" : "bg-[#30A08B]"} disabled:opacity-40`}>
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
              {!internal ? <p className="text-[10px] text-gray-400 mt-1.5">Les numéros, e-mails et liens externes sont masqués automatiquement dans les deux sens.</p> : null}
            </footer>
          </>
        ) : null}
      </section>

      {/* ── Fiche ── */}
      {conv ? (
        <aside className="hidden xl:flex w-72 shrink-0 flex-col border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-gray-400" /><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p></div>
            <p className="font-semibold text-gray-900">{conv.client?.name}</p>
            {conv.client?.since ? <p className="text-xs text-gray-500">Client depuis {new Date(conv.client.since).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p> : null}
          </div>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2"><Store className="w-4 h-4 text-gray-400" /><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Boutique</p></div>
            <div className="flex items-center gap-2">
              {conv.store?.logo ? <img src={conv.store.logo} alt="" className="w-8 h-8 rounded-full object-cover" /> : null}
              <p className="font-semibold text-gray-900">{conv.store?.name}</p>
            </div>
          </div>
          {detail.product ? (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Produit consulté</p>
              <Card card={detail.product} />
            </div>
          ) : null}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2"><ShoppingBag className="w-4 h-4 text-gray-400" /><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Commandes chez la boutique</p></div>
            {detail.orders?.length ? detail.orders.map((o) => (
              <div key={o.id} className="text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex justify-between"><span className="font-semibold text-gray-800">{o.reference}</span><span className="font-semibold">{fcfa(o.total)}</span></div>
                <div className="flex justify-between text-gray-500"><span>{o.status}</span><span>{o.date ? new Date(o.date).toLocaleDateString("fr-FR") : ""}</span></div>
              </div>
            )) : <p className="text-xs text-gray-500">Aucune commande pour l'instant.</p>}
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Responsable</p>
              {isAdmin ? (
                <select value={conv.assignedTo?.id || ""} onChange={(e) => assign(e.target.value || null)} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                  <option value="">— Sans responsable —</option>
                  {storeManagers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              ) : <p className="text-sm text-gray-800">{conv.assignedTo?.name || "Sans responsable"}</p>}
              {isAdmin && !storeManagers.length ? <p className="text-[11px] text-orange-600 mt-1">Aucun manager n'est affecté à cette boutique.</p> : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600"><Clock className="w-3.5 h-3.5" /> 1re réponse : {duration(conv.firstResponseMs)}</div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
