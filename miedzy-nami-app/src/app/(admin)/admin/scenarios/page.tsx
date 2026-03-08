'use client';

import { useEffect, useState, useRef } from 'react';
import { getIdToken } from '@/lib/firebase/auth';

interface ScenarioEntry {
  id: string;
  title: string;
  difficulty: string;
  relationship_type: string;
  interactions_count: number;
  age_rating: string;
  session_count: number;
}

/**
 * Admin Scenarios Page — manage scenario content.
 */
export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchScenarios = async () => {
    try {
      const token = await getIdToken();
      const res = await fetch('/api/admin/scenarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd pobierania scenariuszy');
      const data = await res.json();
      setScenarios(data.scenarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const showAction = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Usunąć scenariusz "${title}"?`)) return;

    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/scenarios?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd usuwania');
      showAction(`✅ Usunięto: ${title}`);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch {
      showAction('❌ Błąd usuwania scenariusza');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const token = await getIdToken();

      const res = await fetch('/api/admin/scenarios/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd uploadu');

      showAction(`✅ Dodano: ${data.title}`);
      fetchScenarios();
    } catch (err) {
      showAction(`❌ ${err instanceof Error ? err.message : 'Błąd uploadu'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSeed = async () => {
    if (!confirm('Załadować scenariusze z plików do Firestore?')) return;
    setSeeding(true);

    try {
      const token = await getIdToken();
      const res = await fetch('/api/scenarios/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd seedowania');
      showAction(`✅ Załadowano ${data.count} scenariuszy z plików`);
      fetchScenarios();
    } catch (err) {
      showAction(`❌ ${err instanceof Error ? err.message : 'Błąd seedowania'}`);
    } finally {
      setSeeding(false);
    }
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'tag-beginner',
    intermediate: 'tag-intermediate',
    advanced: 'tag-advanced',
    expert: 'tag-expert',
  };

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page fade-in">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Scenariusze</h1>
          <p className="admin-page-subtitle">
            {scenarios.length} scenariuszy w bazie
          </p>
        </div>
        <div className="admin-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleUpload}
            style={{ display: 'none' }}
            id="upload-input"
          />
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '⏳ Wgrywanie...' : '📤 Upload JSON'}
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? '⏳ Seedowanie...' : '🌱 Seed z plików'}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="admin-toast">{actionMsg}</div>
      )}

      {error && <div className="admin-error">{error}</div>}

      {scenarios.length === 0 ? (
        <div className="admin-empty">
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📭</p>
          <p>Brak scenariuszy w bazie.</p>
          <p className="text-dim">Wgraj JSON lub uruchom seed z plików.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tytuł</th>
                <th>Trudność</th>
                <th>Relacja</th>
                <th>Interakcje</th>
                <th>Sesje</th>
                <th>Wiek</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id}>
                  <td className="admin-cell-title">{s.title}</td>
                  <td>
                    <span className={`tag ${difficultyColors[s.difficulty] || ''}`}>
                      {s.difficulty}
                    </span>
                  </td>
                  <td className="text-secondary">{s.relationship_type}</td>
                  <td className="text-mono" style={{ textAlign: 'center' }}>
                    {s.interactions_count}
                  </td>
                  <td className="text-mono" style={{ textAlign: 'center' }}>
                    {s.session_count}
                  </td>
                  <td className="text-dim">{s.age_rating}</td>
                  <td>
                    <button
                      className="admin-btn-icon admin-btn-danger"
                      onClick={() => handleDelete(s.id, s.title)}
                      title="Usuń scenariusz"
                    >
                      🗑️
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
}
