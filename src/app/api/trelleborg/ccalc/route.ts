import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_ROOT = path.join(process.cwd(), 'data', 'trelleborg', 'ccalculator_size');
const CORE_PATH = path.join(process.cwd(), 'data', 'trelleborg', 'core.json');

type SizeListItem = {
  ID_code?: string;
  OD?: string;
  RC?: string;
  SRI?: string;
  RIM_Width?: string;
};

async function loadSizeMeta(sku: string) {
  try {
    const raw = await fs.readFile(CORE_PATH, 'utf-8');
    const json = JSON.parse(raw) as { size_list?: SizeListItem[] };
    const match = (json.size_list || []).find((item) => item.ID_code === sku);
    if (!match) return null;
    return {
      OD: match.OD,
      RC: match.RC,
      SRI: match.SRI,
      RimWidth: match.RIM_Width,
    };
  } catch (error) {
    console.warn('[trelleborg-ccalc] failed to load size meta', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');

  if (!sku) {
    return NextResponse.json({ error: 'Missing sku' }, { status: 400 });
  }

  const filePath = path.join(DATA_ROOT, `${sku}.json`);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(raw) as { ccalculator_size?: unknown };

    const ccalc = json?.ccalculator_size as
      | (Record<string, unknown> & {
          cclist?: unknown;
        })
      | undefined;

    if (!ccalc) {
      return NextResponse.json({ error: 'Calculator not found' }, { status: 404 });
    }

    const { cclist, ...rest } = ccalc;
    // Нормалізуємо ключі, якщо вони існують
    const meta: Record<string, unknown> = {};
    if (rest.OD) meta.OD = rest.OD;
    if (rest.RC) meta.RC = rest.RC;
    if (rest.SRI) meta.SRI = rest.SRI;
    if (rest.RimWidth) meta.RimWidth = rest.RimWidth;
    if (rest['Rim Width']) meta.RimWidth = rest['Rim Width'];
    if (rest['PERMITTED RIMS']) meta.PermittedRims = rest['PERMITTED RIMS'];
    if (rest.PermittedRims) meta.PermittedRims = rest.PermittedRims;

    const sizeMeta = await loadSizeMeta(sku);
    const mergedMeta = { ...meta, ...sizeMeta };

    return NextResponse.json({ cclist, meta: mergedMeta });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.error('[trelleborg-ccalc] Failed to load file', { sku, error });
    return NextResponse.json({ error: 'Failed to load calculator' }, { status: 500 });
  }
}

