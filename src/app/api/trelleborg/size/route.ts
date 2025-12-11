import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_ROOT = path.join(process.cwd(), 'data', 'trelleborg', 'sizes');

function translateAndNormalize(html: string): string {
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    {
      pattern: /\(\*\)\s*=\s*10\s*LT\s*at\s*0\.4\s*bar\s*only\s*dual\/triple\s*use/gi,
      replacement: '(*) = 10 LT при 0,4 bar лише для здвоєних/строєних коліс',
    },
    {
      pattern: /\(\*\)\s*=\s*10\s*LT\s*at\s*0,4\s*bar\s*only\s*dual\/triple\s*use/gi,
      replacement: '(*) = 10 LT при 0,4 bar лише для здвоєних/строєних коліс',
    },
    {
      pattern: /\(\*\*\)\s*=\s*10\s*HT\s*at\s*0\.6\s*bar\s*only\s*dual\/triple\s*use/gi,
      replacement: '(**) = 10 HT при 0,6 bar лише для здвоєних/строєних коліс',
    },
    {
      pattern: /\(\*\*\)\s*=\s*10\s*HT\s*at\s*0,6\s*bar\s*only\s*dual\/triple\s*use/gi,
      replacement: '(**) = 10 HT при 0,6 bar лише для здвоєних/строєних коліс',
    },
    {
      pattern: /SW\s*[-–]\s*on\s*the\s*nominal\s*rim\.?\s*\(not\s*riferred\s*to\s*the\s*PERMITTED\s*RIMS\)/gi,
      replacement: 'SW — на номінальному диску (не стосується дозволених дисків)',
    },
    {
      pattern: /SW\s*[-–]\s*on\s*the\s*nominal\s*rim\.?\s*\(not\s*referred\s*to\s*the\s*PERMITTED\s*RIMS\)/gi,
      replacement: 'SW — на номінальному диску (не стосується дозволених дисків)',
    },
    {
      pattern: /SW\s*=\s*On\s*the\s*nominal\s*RIM\.?\s*\(Not\s*referred?\s*to\s*the\s*PERMITTED\s*RIMS\)/gi,
      replacement: 'SW = на номінальному диску (не стосується дозволених дисків)',
    },
    {
      pattern: /\bS\s*=\s*Single\s*fitment\.?/gi,
      replacement: 'S = одиночне встановлення.',
    },
    {
      pattern: /SRI\s*[-–]\s*Speed\s*Radius\s*Index\s*[-–]\s*value\s*to\s*be\s*used\s*for\s*the\s*calculation\s*of\s*the\s*theoretical\s*tractor\s*speed\s*during\s*European\s*Union\s*homologation\s*and\s*for\s*the\s*interchangebility\s*of\s*different\s*tyre\s*sizes\.?/gi,
      replacement:
        'SRI — індекс радіуса швидкості; значення для розрахунку теоретичної швидкості трактора під час сертифікації в ЄС та для взаємозамінності різних типорозмірів шин.',
    },
    {
      pattern: /SRI\s*[-–]\s*Speed\s*Radius\s*Index\s*[-–]\s*value\s*to\s*be\s*used\s*for\s*the\s*calculation\s*of\s*the\s*theoretical\s*tractor\s*speed\s*during\s*European\s*Union\s*homologation\s*and\s*for\s*the\s*interchangeability\s*of\s*different\s*tyre\s*sizes\.?/gi,
      replacement:
        'SRI — індекс радіуса швидкості; значення для розрахунку теоретичної швидкості трактора під час сертифікації в ЄС та для взаємозамінності різних типорозмірів шин.',
    },
    {
      pattern: /SRI\s*=\s*Speed\s*Radius\s*Index\s*-\s*value\s*to\s*be\s*used\s*for\s*calculation\s*of\s*the\s*theoretical\s*tractor\s*speed\s*during\s*European\s*Union\s*homologation\s*and\s*for\s*the\s*interchangeability\s*of\s*different\s*tyre\s*sizes\.?/gi,
      replacement:
        'SRI — індекс радіуса швидкості; значення для розрахунку теоретичної швидкості трактора під час сертифікації в ЄС та для взаємозамінності різних типорозмірів шин.',
    },
    {
      pattern: /For\s*intensive\s*road\s*transport\s*above\s*40\s*km\/h\s*the\s*pressure\s*could\s*be\s*increased\s*by\s*0\.4\s*bar\.?/gi,
      replacement: 'Для інтенсивних дорожніх перевезень понад 40 км/год тиск можна підвищити на 0,4 bar.',
    },
    {
      pattern: /70\/65\/50\/40\/30\s*=\s*On\s*road\s*transport\s*at\s*70\/65\/50\/40\/30\s*Km\/h\.\s*For\s*intensive\s*road\s*transport\s*at\s*40,\s*50,\s*65\s*and\s*70\s*Km\/h\s*the\s*pressure\s*should\s*be\s*increased\s*by\s*0,4\s*bar\.?/gi,
      replacement:
        '70/65/50/40/30 = для руху дорогами зі швидкістю 70/65/50/40/30 км/год. Для інтенсивних перевезень на 40, 50, 65 та 70 км/год тиск слід збільшити на 0,4 bar.',
    },
    {
      pattern: /All\s*load\s*value\s*for\s*ground\s*slopes\s*up\s*to\s*20%\s*\(above\s*20%\s*consult\s*TWS\)/gi,
      replacement:
        'Усі значення навантаження наведені для ухилів до 20%; при ухилах понад 20% проконсультуйтеся з TWS.',
    },
    {
      pattern: /All\s*load\s*values?\s*for\s*ground\s*slopes\s*up\s*to\s*20%\s*\(above\s*20%\s*consult\s*TWS\)/gi,
      replacement:
        'Усі значення навантаження наведені для ухилів до 20%; при ухилах понад 20% проконсультуйтеся з TWS.',
    },
    {
      pattern: /10\s*LT\s*=\s*Maximum\s*Speed\s*10\s*Km\/h\.\s*Surface\s*treatment\s*with\s*low\s*torque\s*value\.?/gi,
      replacement: '10 LT = максимальна швидкість 10 км/год. Поверхнева обробка з низьким крутним моментом.',
    },
    {
      pattern: /10\s*HT\s*=\s*Maximum\s*Speed\s*10\s*Km\/h\.\s*Field\s*application\s*with\s*high\s*torque\s*value\.?/gi,
      replacement: '10 HT = максимальна швидкість 10 км/год. Польові роботи з високим крутним моментом.',
    },
    {
      pattern: /H\s*\(\*\)\s*=\s*Maximum\s*speed\s*10\s*Km\/h\.\s*Harvesting\s*machines\s*in\s*cyclic\s*loading\s*service\s*and\s*farm\s*to\s*field\s*transit\.?/gi,
      replacement:
        'H (*) = максимальна швидкість 10 км/год. Зернозбиральні машини при циклічних навантаженнях та переїздах “господарство–поле”.',
    },
    {
      pattern: /For\s*dual\s*mounting\s*use\s*the\s*pressure\s*correspondent\s*to\s*the\s*load\s*per\s*each\s*wheel\s*divided\s*by\s*0\.88\.?/gi,
      replacement:
        'Для здвоєних коліс використовуйте тиск, що відповідає навантаженню на одне колесо, поділеному на 0,88.',
    },
    {
      pattern: /IMPORTANT\s*[-–]\s*The\s*inflation\s*pressure\s*is\s*estabilished\s*considering\s*the\s*max\s*load\s*for\s*each\s*tyre\.?/gi,
      replacement: 'ВАЖЛИВО: тиск накачування встановлюється з урахуванням максимального навантаження для кожної шини.',
    },
    {
      pattern: /IMPORTANT:\s*The\s*inflation\s*pressure\s*is\s*established\s*considering\s*the\s*application\s*and\s*the\s*load\s*for\s*each\s*tyre\.?/gi,
      replacement: 'ВАЖЛИВО: тиск накачування встановлюється з урахуванням застосування та навантаження для кожної шини.',
    },
    {
      pattern: /IMPORTANT\s*[-–]\s*The\s*inflation\s*pressure\s*is\s*established\s*considering\s*the\s*application\s*and\s*the\s*load\s*for\s*each\s*tyre\.?/gi,
      replacement: 'ВАЖЛИВО: тиск накачування встановлюється з урахуванням застосування та навантаження для кожної шини.',
    },
  ];

  const applyTranslations = (text: string) => {
    let out = text;
    for (const { pattern, replacement } of replacements) {
      out = out.replace(pattern, replacement);
    }
    return out;
  };

  const normalizeTail = (text: string) => {
    let out = text;
    out = out.replace(/\r\n/g, '\n');
    out = out.replace(/<br\s*\/?>/gi, '\n');
    out = out.replace(/&nbsp;/gi, ' ');
    out = out.replace(/\u00a0/g, ' ');
    out = out.replace(/\n{2,}/g, '\n');
    out = out.trim();
    out = out.replace(/\n/g, '<br>');
    out = out.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
    return out;
  };

  // Спочатку перекладаємо весь HTML (таблиця + хвіст).
  const translatedHtml = applyTranslations(html);

  // Не чіпаємо структуру таблиці під час нормалізації відступів; чистимо лише хвіст.
  const closingTag = '</table>';
  const idx = translatedHtml.toLowerCase().indexOf(closingTag);

  if (idx === -1) {
    // Немає таблиці — обробляємо весь контент як текст.
    return normalizeTail(translatedHtml);
  }

  const tablePart = translatedHtml.slice(0, idx + closingTag.length);
  const tail = translatedHtml.slice(idx + closingTag.length);
  const normalizedTail = tail ? normalizeTail(tail) : '';

  const normalizedTable = tablePart
    .replace(/TREAD\s+PATTERN/gi, 'TREAD<br>PATTERN')
    .replace(/PERMITTED\s+RIMS/gi, 'PERMITTED<br>RIMS');

  if (!normalizedTail) return normalizedTable;
  return `${normalizedTable}<br>${normalizedTail}`;
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
    const json = JSON.parse(raw) as { size?: { html?: string } | null };
    const html = json?.size?.html;

    if (!html) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const translated = translateAndNormalize(html);
    return NextResponse.json({ html: translated });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.error('[trelleborg] Failed to load size file', { sku, error });
    return NextResponse.json({ error: 'Failed to load table' }, { status: 500 });
  }
}

