// ═══════════════════════════════════════════════════════════
//  POST /api/scenarios/seed
//  Seed Firestore with local scenario JSON files (admin).
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { seedScenariosFromDisk } from '@/lib/db/scenarios';

export async function POST() {
  try {
    const count = await seedScenariosFromDisk();
    return NextResponse.json({
      success: true,
      message: `Seeded ${count} scenarios to Firestore`,
      count,
    });
  } catch (error) {
    console.error('POST /api/scenarios/seed error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
