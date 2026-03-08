// ═══════════════════════════════════════════════════════════
//  DATABASE LAYER — Scenarios
//  Firestore + filesystem fallback for scenario data.
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase/admin';
import type { Scenario } from '@/lib/types';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const COLLECTION = 'scenarios';

/**
 * List all scenarios (metadata only for browsing).
 * Tries Firestore first, falls back to local JSON files.
 */
export async function listScenarios(filters?: {
  relationship_type?: string;
  difficulty?: string;
}): Promise<Scenario[]> {
  // Try Firestore first
  try {
    let query = adminDb.collection(COLLECTION).orderBy('metadata.title');

    const snapshot = await query.get();
    if (snapshot.size > 0) {
      let scenarios = snapshot.docs.map(doc => doc.data() as Scenario);

      // Apply filters
      if (filters?.relationship_type) {
        scenarios = scenarios.filter(s => s.tags.relationship_type === filters.relationship_type);
      }
      if (filters?.difficulty) {
        scenarios = scenarios.filter(s => s.tags.difficulty === filters.difficulty);
      }

      return scenarios;
    }
  } catch (error) {
    console.warn('Firestore scenarios query failed, using filesystem fallback:', error);
  }

  // Fallback: load from public/scenarios/*.json
  return loadScenariosFromDisk(filters);
}

/**
 * Get a single scenario by ID.
 */
export async function getScenario(scenarioId: string): Promise<Scenario | null> {
  // Try Firestore
  try {
    const doc = await adminDb.collection(COLLECTION).doc(scenarioId).get();
    if (doc.exists) return doc.data() as Scenario;
  } catch (error) {
    console.warn('Firestore scenario get failed:', error);
  }

  // Fallback: search local files
  const allLocal = loadScenariosFromDisk();
  return allLocal.find(s => s.scenario_id === scenarioId) || null;
}

/**
 * Upload a scenario to Firestore.
 */
export async function uploadScenario(scenario: Scenario): Promise<void> {
  await adminDb.collection(COLLECTION).doc(scenario.scenario_id).set(scenario);
}

/**
 * Seed Firestore from local JSON files.
 */
export async function seedScenariosFromDisk(): Promise<number> {
  const scenarios = loadScenariosFromDisk();
  const batch = adminDb.batch();

  for (const scenario of scenarios) {
    const ref = adminDb.collection(COLLECTION).doc(scenario.scenario_id);
    batch.set(ref, scenario);
  }

  await batch.commit();
  return scenarios.length;
}

// ── Internal helpers ──

function loadScenariosFromDisk(filters?: {
  relationship_type?: string;
  difficulty?: string;
}): Scenario[] {
  const scenariosDir = join(process.cwd(), 'public', 'scenarios');

  if (!existsSync(scenariosDir)) return [];

  try {
    const files = readdirSync(scenariosDir).filter(f => f.endsWith('.json'));
    let scenarios: Scenario[] = [];

    for (const file of files) {
      try {
        const raw = readFileSync(join(scenariosDir, file), 'utf-8');
        const data = JSON.parse(raw) as Scenario;
        scenarios.push(data);
      } catch (err) {
        console.warn(`Failed to parse scenario file ${file}:`, err);
      }
    }

    // Apply filters
    if (filters?.relationship_type) {
      scenarios = scenarios.filter(s => s.tags.relationship_type === filters.relationship_type);
    }
    if (filters?.difficulty) {
      scenarios = scenarios.filter(s => s.tags.difficulty === filters.difficulty);
    }

    return scenarios;
  } catch {
    return [];
  }
}
