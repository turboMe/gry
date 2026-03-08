import { NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/scenarios/bundled
 * Returns all scenario JSON files from the scenarios/ directory.
 * MVP-only endpoint — in production, scenarios come from Firestore.
 */
export async function GET() {
  try {
    const scenariosDir = join(process.cwd(), 'public', 'scenarios');
    const files = readdirSync(scenariosDir).filter(f => f.endsWith('.json'));

    const scenarios = files.map(file => {
      const raw = readFileSync(join(scenariosDir, file), 'utf-8');
      return JSON.parse(raw);
    });

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Failed to load bundled scenarios:', error);
    return NextResponse.json([], { status: 200 });
  }
}
