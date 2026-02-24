import { NextResponse } from 'next/server';
import { GisDataContext } from '@/lib/types/dashboard';

// ─── MOCK MODE ─ Remove when DB is available ───────────────────────────────
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
// ───────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
    if (USE_MOCKS) {
        return NextResponse.json({ success: true, id: "mock-snapshot-id" });
    }
    try {
        const data = await request.json();
        const context: GisDataContext = data;
        const { repository } = await import('@/lib/db');
        const id = await repository.saveSnapshot(context);
        return NextResponse.json({ success: true, id });
    } catch (err) {
        console.error("Error saving snapshot:", err);
        return NextResponse.json(
            { success: false, error: 'Failed to save snapshot' },
            { status: 500 }
        );
    }
}

export async function GET() {
    if (USE_MOCKS) {
        return NextResponse.json({ success: false, error: 'No snapshot found' }, { status: 404 });
    }
    try {
        const { repository } = await import('@/lib/db');
        const snapshot = await repository.getLatestSnapshot();

        if (!snapshot) {
            return NextResponse.json(
                { success: false, error: 'No snapshot found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: snapshot });
    } catch (err) {
        console.error("Error retrieving snapshot:", err);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve snapshot' },
            { status: 500 }
        );
    }
}
