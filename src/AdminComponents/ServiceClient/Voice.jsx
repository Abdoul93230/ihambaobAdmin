import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Mic, Trash2, Send, Loader2 } from "lucide-react";

export const fmt = (ms = 0) => {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

// ─── Lecture : un seul vocal à la fois ─────────────────────────────────────────
let current = null; // HTMLAudioElement en cours
const RATES = [1, 1.5, 2];

export function VoicePlayer({ url, durationMs = 0, mine = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(durationMs);
  const [rate, setRate] = useState(1);

  useEffect(() => () => { if (current === audioRef.current) current = null; audioRef.current?.pause(); }, []);

  const ensure = () => {
    if (audioRef.current) return audioRef.current;
    const a = new Audio(url);
    a.preload = "metadata";
    a.onloadedmetadata = () => { if (isFinite(a.duration)) setDur(Math.round(a.duration * 1000)); };
    a.ontimeupdate = () => setPos(Math.round(a.currentTime * 1000));
    a.onplaying = () => { setLoading(false); setPlaying(true); };
    a.onwaiting = () => setLoading(true);
    a.onpause = () => setPlaying(false);
    a.onended = () => { setPlaying(false); setPos(0); };
    a.onerror = () => { setLoading(false); setPlaying(false); };
    audioRef.current = a;
    return a;
  };

  const toggle = () => {
    const a = ensure();
    if (!a.paused) { a.pause(); return; }
    if (current && current !== a) current.pause();
    current = a;
    a.playbackRate = rate;
    setLoading(true);
    a.play().catch(() => setLoading(false));
  };

  const seek = (e) => {
    const total = dur || durationMs;
    if (!total) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const a = ensure();
    a.currentTime = (ratio * total) / 1000;
    setPos(ratio * total);
  };

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const total = dur || durationMs;
  const progress = total ? Math.min(1, pos / total) : 0;
  const fg = mine ? "bg-white" : "bg-[#30A08B]";
  const bg = mine ? "bg-white/35" : "bg-gray-200";

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] py-0.5">
      <button onClick={toggle} className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${mine ? "bg-white/20 text-white" : "bg-[#E8F5F2] text-[#1F7A69]"}`} aria-label={playing ? "Pause" : "Écouter le message vocal"}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div onClick={seek} className={`relative h-1.5 rounded-full cursor-pointer ${bg}`}>
          <div className={`absolute inset-y-0 left-0 rounded-full ${fg}`} style={{ width: `${progress * 100}%` }} />
          <div className={`absolute -top-1 w-3.5 h-3.5 rounded-full ${fg} -ml-1.5`} style={{ left: `${progress * 100}%` }} />
        </div>
        <div className={`flex items-center gap-1 mt-1 text-[11px] tabular-nums ${mine ? "text-white/80" : "text-gray-500"}`}>
          <Mic className="w-3 h-3" /> {playing || pos > 0 ? fmt(pos) : fmt(total)}
        </div>
      </div>
      {playing ? (
        <button onClick={cycleRate} className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${mine ? "border-white/60 text-white" : "border-[#30A08B] text-[#1F7A69]"}`}>
          {String(rate).replace(".", ",")}×
        </button>
      ) : null}
    </div>
  );
}

// ─── Enregistrement (micro du navigateur) ──────────────────────────────────────
const pickMime = () => {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) || "";
};

export function useVoiceRecorder({ onStart, onStop } = {}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const rec = useRef(null);
  // Rappels gardés dans une ref : les fonctions ci-dessous restent stables (sinon le nettoyage
  // au démontage s'exécuterait à chaque rendu et couperait l'enregistrement)
  const cb = useRef({ onStart, onStop });
  cb.current = { onStart, onStop };

  const cleanup = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    clearInterval(r.timer);
    cancelAnimationFrame(r.raf);
    r.stream.getTracks().forEach((t) => t.stop());
    r.ctx?.close().catch(() => {});
    rec.current = null;
    setRecording(false);
    setElapsed(0);
    setLevel(0);
    cb.current.onStop?.();
  }, []);

  const start = useCallback(async () => {
    if (rec.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mimeType = pickMime();
    const mr = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined);
    const chunks = [];
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const startedAt = Date.now();
    const r = { mr, stream, chunks, startedAt, mimeType: mr.mimeType || mimeType };
    // Niveau du micro (petite animation)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const loop = () => { an.getByteFrequencyData(data); setLevel(data.reduce((s, v) => s + v, 0) / data.length / 128); r.raf = requestAnimationFrame(loop); };
      r.ctx = ctx;
      loop();
    } catch { /* animation facultative */ }
    r.timer = setInterval(() => setElapsed(Date.now() - startedAt), 200);
    mr.start(250);
    rec.current = r;
    setRecording(true);
    cb.current.onStart?.();
  }, []);

  /** Termine et renvoie { blob, durationMs } (null si trop court) */
  const stop = useCallback(() => new Promise((resolve) => {
    const r = rec.current;
    if (!r) return resolve(null);
    const durationMs = Date.now() - r.startedAt;
    r.mr.onstop = () => {
      const blob = new Blob(r.chunks, { type: r.mimeType || "audio/webm" });
      cleanup();
      resolve(durationMs < 800 ? null : { blob, durationMs });
    };
    r.mr.stop();
  }), [cleanup]);

  const cancel = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    r.mr.onstop = null;
    try { r.mr.stop(); } catch { /* déjà arrêté */ }
    cleanup();
  }, [cleanup]);

  useEffect(() => () => cancel(), [cancel]);

  return { recording, elapsed, level, start, stop, cancel };
}

/** Barre d'enregistrement : point rouge, chrono, annuler, envoyer */
export function RecordingBar({ elapsed, level, onCancel, onSend, sending }) {
  return (
    <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl border border-red-200 bg-red-50">
      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      <span className="text-sm font-semibold tabular-nums text-gray-800 w-12">{fmt(elapsed)}</span>
      <div className="flex-1 flex items-center gap-0.5 h-6 overflow-hidden">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="w-1 rounded-full bg-red-400" style={{ height: `${Math.max(12, Math.min(100, level * 100 * (0.5 + Math.abs(Math.sin(i * 1.7 + elapsed / 300)))))}%` }} />
        ))}
      </div>
      <button onClick={onCancel} className="p-2 rounded-lg hover:bg-red-100" title="Annuler"><Trash2 className="w-4 h-4 text-red-500" /></button>
      <button onClick={onSend} disabled={sending} className="p-2.5 rounded-xl bg-[#30A08B] text-white disabled:opacity-50" title="Envoyer le vocal">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  );
}
