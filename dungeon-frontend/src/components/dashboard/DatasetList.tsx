"use client";
import React, { useState } from "react";
import { Dataset } from "@/types/dashboard";
import { createDataset, deleteDataset } from "@/services/dungeonService";

interface Props {
  datasets: Dataset[];
  onRefresh: () => void;
}

const DatasetList: React.FC<Props> = ({ datasets, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [schemaVersion, setSchemaVersion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createDataset({ name, description, owner, schemaVersion });
      setName(""); setDescription(""); setOwner(""); setSchemaVersion("");
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dataset");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Smazat dataset?")) return;
    try {
      await deleteDataset(id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dataset");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#ffd100]">Datasety</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 text-sm font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 transition-colors"
        >
          {showForm ? "✕ Zrušit" : "+ Nový dataset"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111111] border border-[#332211] p-5 rounded-md flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Název *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Owner *</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} required
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Popis</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider">Schema Version</label>
              <input value={schemaVersion} onChange={e => setSchemaVersion(e.target.value)}
                className="w-full mt-1 bg-black border border-[#554433] text-[#f0e0d0] px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffd100]" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="self-start px-5 py-2 text-sm font-bold uppercase border border-[#ffd100] text-[#ffd100] bg-[#ffd100]/10 hover:bg-[#ffd100]/20 disabled:opacity-40 transition-colors">
            {saving ? "Ukládám…" : "Vytvořit"}
          </button>
        </form>
      )}

      {datasets.length === 0 ? (
        <p className="text-[#888888] italic">Žádné datasety.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#332211] text-[#888888] uppercase text-xs tracking-wider">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Název</th>
                <th className="pb-2 pr-4">Owner</th>
                <th className="pb-2 pr-4">Schema</th>
                <th className="pb-2 pr-4">Popis</th>
                <th className="pb-2 pr-4">Vytvořeno</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {datasets.map(ds => (
                <tr key={ds.id} className="border-b border-[#1e1e1e] hover:bg-[#1a1a1a]">
                  <td className="py-2 pr-4 text-[#888888]">#{ds.id}</td>
                  <td className="py-2 pr-4 text-[#ffd100] font-bold">{ds.name}</td>
                  <td className="py-2 pr-4 text-[#cccccc]">{ds.owner}</td>
                  <td className="py-2 pr-4 text-[#cccccc]">{ds.schemaVersion ?? "—"}</td>
                  <td className="py-2 pr-4 text-[#888888] max-w-xs truncate">{ds.description ?? "—"}</td>
                  <td className="py-2 pr-4 text-[#888888]">{new Date(ds.createdAt).toLocaleDateString("cs-CZ")}</td>
                  <td className="py-2">
                    <button onClick={() => handleDelete(ds.id)}
                      className="text-xs text-red-500 hover:text-red-300 uppercase tracking-wider">
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatasetList;
