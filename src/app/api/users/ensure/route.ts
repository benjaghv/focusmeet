import { NextResponse } from 'next/server';
import { getDb, verifyRequestAndGetUid } from '@/lib/firebaseAdmin';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const uid = await verifyRequestAndGetUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getDb();

    const body = await request.json().catch(() => ({}));
    const { email, displayName } = body || {};

    const now = new Date().toISOString();
    if (db) {
      // Firestore path
      const ref = db.collection('users').doc(uid);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          uid,
          email: email || null,
          displayName: displayName || null,
          createdAt: now,
          lastLoginAt: now,
        });
        console.log('[users/ensure] created user in Firestore', { uid, email, displayName });
      } else {
        await ref.update({
          email: email ?? snap.get('email') ?? null,
          displayName: displayName ?? snap.get('displayName') ?? null,
          lastLoginAt: now,
        });
        console.log('[users/ensure] updated user in Firestore', { uid });
      }
      return NextResponse.json({ ok: true, source: 'firestore', uid });
    }

    // Fallback: filesystem local (dev)
    const usersDir = path.join(process.cwd(), 'users');
    await fs.mkdir(usersDir, { recursive: true });
    const filePath = path.join(usersDir, `${uid}.json`);
    const payload = { uid, email: email || null, displayName: displayName || null, createdAt: now, lastLoginAt: now };
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log('[users/ensure] saved user in FS', { filePath });
    return NextResponse.json({ ok: true, source: 'fs', uid });
  } catch (error) {
    console.error('ensure user error:', error);
    return NextResponse.json({ error: 'Error al asegurar usuario' }, { status: 500 });
  }
}
