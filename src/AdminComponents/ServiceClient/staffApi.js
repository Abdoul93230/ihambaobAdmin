import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const BackendUrl = process.env.REACT_APP_Backend_Url;

export function getToken() {
  try {
    const admin = JSON.parse(localStorage.getItem("AdminEcomme") || "{}");
    return admin?.token || localStorage.getItem("AdminAuthToken") || "";
  } catch {
    return "";
  }
}

const auth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

export const staffApi = {
  me: () => axios.get(`${BackendUrl}/api/staff/me`, auth()).then((r) => r.data),
  conversations: (params) => axios.get(`${BackendUrl}/api/staff/conversations`, { ...auth(), params }).then((r) => r.data),
  counts: () => axios.get(`${BackendUrl}/api/staff/conversations/counts`, auth()).then((r) => r.data),
  conversation: (id) => axios.get(`${BackendUrl}/api/staff/conversations/${id}`, auth()).then((r) => r.data),
  messages: (id, before) => axios.get(`${BackendUrl}/api/staff/conversations/${id}/messages`, { ...auth(), params: { before, limit: 40 } }).then((r) => r.data.data),
  send: (id, body) => axios.post(`${BackendUrl}/api/staff/conversations/${id}/messages`, body, auth()).then((r) => r.data.message),
  read: (id) => axios.put(`${BackendUrl}/api/staff/conversations/${id}/read`, {}, auth()).catch(() => {}),
  update: (id, body) => axios.patch(`${BackendUrl}/api/staff/conversations/${id}`, body, auth()).then((r) => r.data.conversation),
  quickReplies: () => axios.get(`${BackendUrl}/api/staff/quick-replies`, auth()).then((r) => r.data.data),
  addQuickReply: (body) => axios.post(`${BackendUrl}/api/staff/quick-replies`, body, auth()).then((r) => r.data.data),
  deleteQuickReply: (id) => axios.delete(`${BackendUrl}/api/staff/quick-replies/${id}`, auth()),
  sellers: () => axios.get(`${BackendUrl}/api/staff/sellers`, auth()).then((r) => r.data.data),
  products: (params) => axios.get(`${BackendUrl}/api/staff/products`, { ...auth(), params }).then((r) => r.data),
  moderate: (id, body) => axios.put(`${BackendUrl}/api/staff/products/${id}/moderation`, body, auth()).then((r) => r.data.data),
  orders: (params) => axios.get(`${BackendUrl}/api/staff/orders`, { ...auth(), params }).then((r) => r.data),
  stats: (days) => axios.get(`${BackendUrl}/api/staff/stats`, { ...auth(), params: { days } }).then((r) => r.data.data),
  managers: () => axios.get(`${BackendUrl}/api/staff/managers`, auth()).then((r) => r.data.data),
  createManager: (body) => axios.post(`${BackendUrl}/api/staff/managers`, body, auth()).then((r) => r.data.data),
  updateManager: (id, body) => axios.put(`${BackendUrl}/api/staff/managers/${id}`, body, auth()).then((r) => r.data.data),
  deleteManager: (id) => axios.delete(`${BackendUrl}/api/staff/managers/${id}`, auth()),
  upload: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return axios.post(`${BackendUrl}/api/messaging/upload`, fd, auth()).then((r) => r.data.url);
  },
};

export const errMsg = (e, fallback = "Une erreur est survenue.") => e?.response?.data?.message || fallback;

/** Connexion temps réel de l'équipe (namespace /messaging), partagée par la page */
export function useStaffSocket(handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(`${BackendUrl}/messaging`, {
      auth: { token: getToken() },
      transports: ["websocket", "polling"],
      reconnectionDelayMax: 10000,
    });
    s.on("connect", () => setConnected(true));
    s.on("disconnect", (reason) => {
      setConnected(false);
      // Déconnexion par le serveur (droits modifiés) : on se reconnecte avec le nouveau périmètre
      if (reason === "io server disconnect") setTimeout(() => s.connect(), 1500);
    });
    const events = ["message:new", "message:read", "conversation:updated", "conversation:read", "conversation:escalated", "typing"];
    events.forEach((ev) => s.on(ev, (data) => ref.current?.[ev]?.(data)));
    setSocket(s);
    return () => s.close();
  }, []);

  return { socket, connected };
}

// ─── Formats ───────────────────────────────────────────────────────────────────
export const fcfa = (n) => `${Number(n || 0).toLocaleString("fr-FR")} F`;
export const timeShort = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
export const waitingFor = (d) => {
  if (!d) return "";
  const min = Math.floor((Date.now() - new Date(d)) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${Math.floor(h / 24)} j`;
};
export const duration = (ms) => {
  if (ms == null) return "—";
  const min = Math.round(ms / 60000);
  if (min < 1) return "< 1 min";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
};

/** Petit son + notification du navigateur quand un client écrit et que l'onglet n'est pas au premier plan */
let audioCtx = null;
export function notifyStaff(title, body) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    o.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.09);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.32);
  } catch { /* son indisponible */ }
  if (document.visibilityState === "visible") return;
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/favicon.ico", tag: "ihambaobab-messagerie" }); } catch { /* ignore */ }
  }
}
