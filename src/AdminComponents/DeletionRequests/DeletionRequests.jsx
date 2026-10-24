import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Trash2, Clock, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight, User, Mail, Calendar, MessageSquare } from "lucide-react";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function getToken() {
  try {
    const admin = JSON.parse(localStorage.getItem("AdminEcomme") || "{}");
    return admin?.token || localStorage.getItem("AdminAuthToken") || "";
  } catch { return ""; }
}

const STATUS_CONFIG = {
  pending:   { label: "En attente",  bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200",  icon: Clock },
  processed: { label: "Traité",      bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200",  icon: CheckCircle },
  rejected:  { label: "Rejeté",      bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmer", danger = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${danger ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeletionRequests() {
  const [requests, setRequests]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState("all");
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [modal, setModal]         = useState(null); // { id, action: 'processed'|'rejected' }
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(filter !== "all" && { status: filter }) };
      const res = await axios.get(`${BackendUrl}/api/admin/deletion-requests`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params,
      });
      setRequests(res.data.requests || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      showToast("Erreur lors du chargement des demandes.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await axios.patch(`${BackendUrl}/api/admin/deletion-requests/${modal.id}`,
        { status: modal.action, adminNote },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      showToast(modal.action === "processed" ? "Demande marquée comme traitée." : "Demande rejetée.");
      setModal(null);
      setAdminNote("");
      setSelected(null);
      fetchRequests();
    } catch {
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Demandes de suppression</h1>
            <p className="text-sm text-gray-500">{total} demande{total !== 1 ? "s" : ""} au total</p>
          </div>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "all",       label: "Toutes" },
          { key: "pending",   label: "En attente" },
          { key: "processed", label: "Traitées" },
          { key: "rejected",  label: "Rejetées" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filter === f.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Trash2 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Aucune demande</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(r => (
                    <tr
                      key={r._id}
                      onClick={() => setSelected(r)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${selected?._id === r._id ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{r.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{r.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 capitalize">{r.accountType}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(r.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-gray-300 text-xs">›</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                  <span className="text-xs text-gray-400">Page {page} / {pages}</span>
                  <div className="flex gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panneau détail */}
        {selected && (
          <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit sticky top-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Détails</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Nom</p>
                  <p className="text-sm font-medium text-gray-900">{selected.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-900 break-all">{selected.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Date de la demande</p>
                  <p className="text-sm text-gray-900">{fmt(selected.createdAt)}</p>
                </div>
              </div>
              {selected.processedAt && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Traité le</p>
                    <p className="text-sm text-gray-900">{fmt(selected.processedAt)}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Statut actuel</p>
                <StatusBadge status={selected.status} />
              </div>
              {selected.reason && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Raison</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selected.reason}</p>
                  </div>
                </div>
              )}
              {selected.adminNote && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">Note admin</p>
                  <p className="text-sm text-gray-700">{selected.adminNote}</p>
                </div>
              )}
            </div>

            {selected.status === "pending" && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Note interne (facultatif)…"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 resize-none outline-none"
                />
                <button
                  onClick={() => setModal({ id: selected._id, action: "processed" })}
                  className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                >
                  ✓ Marquer comme traité
                </button>
                <button
                  onClick={() => setModal({ id: selected._id, action: "rejected" })}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
                >
                  ✕ Rejeter la demande
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmation */}
      <ConfirmModal
        open={!!modal}
        title={modal?.action === "processed" ? "Confirmer le traitement" : "Rejeter la demande"}
        message={modal?.action === "processed"
          ? "Confirmez-vous avoir traité cette demande de suppression ? Le compte sera marqué comme supprimé."
          : "Êtes-vous sûr de vouloir rejeter cette demande ?"
        }
        confirmLabel={saving ? "En cours…" : (modal?.action === "processed" ? "Confirmer" : "Rejeter")}
        danger={modal?.action === "rejected"}
        onConfirm={handleAction}
        onCancel={() => { setModal(null); }}
      />
    </div>
  );
}
