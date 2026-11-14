#!/usr/bin/env python3
"""Assemble le site Wigaly : out/ (site réel) et preview/ (variante pour l'aperçu)."""
import base64, datetime, hashlib, json, math, os, re, shutil

S = os.path.dirname(os.path.abspath(__file__))
SRC, OUT, PRE = os.path.join(S, 'src'), os.path.join(S, 'out'), os.path.join(S, 'preview')
ENDPOINT = ''  # URL de réception du formulaire, vide tant que rien n'est raccordé

def rd(p):
    with open(os.path.join(SRC, p), encoding='utf-8') as f:
        return f.read()

def wr(base, p, s):
    os.makedirs(base, exist_ok=True)
    with open(os.path.join(base, p), 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)

# --- géométrie de la machine (mêmes formules que le script de la page) ---
def gear(R, N):
    m = 2 * R / N; ra = R + m * .9; rr = R - m * 1.1; p = 2 * math.pi / N; d = ''
    for i in range(N):
        a = i * p
        for j, (r, an) in enumerate([(rr, a - p * .42), (rr, a - p * .28), (ra, a - p * .14), (ra, a + p * .14), (rr, a + p * .28), (rr, a + p * .42)]):
            d += ('M' if i == 0 and j == 0 else 'L') + '%.1f %.1f' % (r * math.cos(an), r * math.sin(an))
    return d + 'Z'

def cam_r(a, RB=28, RH=22, W=.6):
    a = ((a + math.pi) % (2 * math.pi) + 2 * math.pi) % (2 * math.pi) - math.pi
    return RB + (RH * .5 * (1 + math.cos(math.pi * a / W)) if abs(a) < W else 0)

def cam():
    d = ''
    for i in range(73):
        a = i / 72 * 2 * math.pi; r = cam_r(a)
        d += ('L' if i else 'M') + '%.1f %.1f' % (r * math.cos(a), r * math.sin(a))
    return d + 'Z'

def phase(a, N1=20, N2=12):
    p1, p2 = 2 * math.pi / N1, 2 * math.pi / N2
    return math.degrees(a + math.pi - p2 * (.5 - a / p1)) % 360

qr = json.loads(rd('qr.json'))
GEO = {
    '{{G1}}': gear(44, 20), '{{G2}}': gear(26, 12), '{{CAM}}': cam(),
    '{{G2R}}': '%.2f' % phase(math.pi * .86), '{{G3R}}': '%.2f' % phase(math.pi * .14),
    '{{QR_D}}': qr['d'], '{{QR_N2}}': str(qr['n'] + 2),
}

BOOT = "(function(d){var c='js';try{if(sessionStorage.getItem('w01'))c+=' seen';else sessionStorage.setItem('w01','1');}catch(e){}d.className=c;})(document.documentElement);"
PRELOAD = ('<link rel="preload" href="%sfonts/unbounded.woff2" as="font" type="font/woff2" crossorigin>\n'
           '<link rel="preload" href="%sfonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>\n')

def sha(s):
    return "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'"

def csp(html):
    scripts = [m.group(1) for m in re.finditer(r'<script>(.*?)</script>', html, re.S)]
    styles = [m.group(1) for m in re.finditer(r'<style>(.*?)</style>', html, re.S)]
    pol = ["default-src 'none'", "script-src " + (' '.join(sha(x) for x in scripts) or "'none'"),
           "style-src " + ' '.join(sha(x) for x in styles), "img-src 'self' data:", "font-src 'self'",
           "connect-src 'self'" + ((' ' + re.match(r'https?://[^/]+', ENDPOINT).group(0)) if ENDPOINT else ''),
           "base-uri 'none'", "form-action 'self'"]
    return '<meta http-equiv="Content-Security-Policy" content="%s">\n' % '; '.join(pol)

def lite(js):
    """Allège le script sans le rendre illisible : commentaires de bloc, indentation et lignes vides en moins.
    Le script n'a ni gabarit ni chaîne sur plusieurs lignes, les retours à la ligne sont conservés."""
    js = re.sub(r'^[ \t]*/\*.*?\*/[ \t]*\n', '', js, flags=re.S | re.M)
    return '\n'.join(l.strip() for l in js.split('\n') if l.strip())

def fill(t, d):
    for k, v in d.items():
        t = t.replace(k, v)
    left = re.findall(r'\{\{[A-Z0-9_]+\}\}', t)
    assert not left, left
    return t

def data_fonts(css):
    for name in ('unbounded', 'instrument-sans'):
        with open(os.path.join(OUT, 'fonts', name + '.woff2'), 'rb') as f:
            b = base64.b64encode(f.read()).decode()
        css = css.replace('url("fonts/%s.woff2")' % name, 'url("data:font/woff2;base64,%s")' % b)
    return css

ICONS = '<link rel="icon" href="%sfavicon.ico" sizes="32x32">\n<link rel="icon" href="%sfavicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="%sapple-touch-icon.png">\n'

def build_index(preview=False):
    css, js = rd('site.css'), rd('site.js')
    t = rd('index.html')
    d = dict(GEO)
    d.update({'{{CSS}}': data_fonts(css) if preview else css, '{{JS}}': lite(js), '{{BOOT}}': BOOT, '{{ENDPOINT}}': ENDPOINT,
              '{{TITLE}}': 'Wigaly – Dev, IA et Power Platform' if preview else 'Wigaly | Dev, IA et Power Platform',
              '{{HEAD_FIRST}}': '<meta name="claude:viewport-fit-sides" content="cover">\n' if preview else '',
              '{{ICONS}}': '' if preview else ICONS % ('', '', ''),
              '{{PRELOAD}}': '' if preview else PRELOAD % ('', '')})
    kb = 0
    for _ in range(4):
        dd = dict(d); dd['{{KB}}'] = str(kb); dd['{{CSP}}'] = ''
        html = fill(t, dd)
        if not preview:
            dd['{{CSP}}'] = csp(html); html = fill(t, dd)
        n = round(len(html.encode('utf-8')) / 1000)
        if n == kb:
            break
        kb = n
    return html, kb

def build_page(tpl, home, prefix, preview=False, head_first=''):
    css = rd('page.css')
    if prefix:
        css = css.replace('url("fonts/', 'url("%sfonts/' % prefix)
    if preview:
        css = data_fonts(css)
    d = {'{{CSS}}': css, '{{HOME}}': home, '{{HEAD_FIRST}}': head_first,
         '{{ICONS}}': '' if preview else ICONS % (prefix, prefix, prefix), '{{PRELOAD}}': '' if preview else PRELOAD % (prefix, prefix), '{{CSP}}': ''}
    t = rd(tpl)
    html = fill(t, d)
    if not preview:
        d['{{CSP}}'] = csp(html); html = fill(t, d)
    return html

def ico(pngs):
    """Assemble un .ico à partir de PNG (16, 32, 48 px), sans dépendance."""
    import struct
    blobs = []
    for size, path in pngs:
        with open(path, 'rb') as f:
            blobs.append((size, f.read()))
    out = struct.pack('<HHH', 0, 1, len(blobs)); off = 6 + 16 * len(blobs)
    for size, b in blobs:
        out += struct.pack('<BBBBHHII', size % 256, size % 256, 0, 0, 1, 32, len(b), off); off += len(b)
    return out + b''.join(b for _, b in blobs)

def assets():
    """Images produites par assets.js : image de partage, icône Apple, favicon de secours."""
    A = os.path.join(S, 'assets')
    if not os.path.isdir(A):
        print('assets/ absent : lancer node assets.js puis relancer'); return
    for n in ('og.png', 'apple-touch-icon.png'):
        if os.path.exists(os.path.join(A, n)):
            shutil.copy(os.path.join(A, n), os.path.join(OUT, n))
    pngs = [(n, os.path.join(A, 'favicon-%d.png' % n)) for n in (16, 32, 48)]
    if all(os.path.exists(p) for _, p in pngs):
        with open(os.path.join(OUT, 'favicon.ico'), 'wb') as f:
            f.write(ico(pngs))

def main():
    os.makedirs(os.path.join(OUT, 'fonts'), exist_ok=True)
    for n in os.listdir(os.path.join(SRC, 'fonts')):
        shutil.copy(os.path.join(SRC, 'fonts', n), os.path.join(OUT, 'fonts', n))
    html, kb = build_index()
    wr(OUT, 'index.html', html)
    wr(OUT, 'mentions-legales.html', build_page('mentions.html', './', ''))
    wr(OUT, '404.html', build_page('404.html', '/', '/'))
    shutil.copy(os.path.join(SRC, 'favicon.svg'), os.path.join(OUT, 'favicon.svg'))
    wr(OUT, 'CNAME', 'wigaly.fr\n')
    wr(OUT, 'robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://wigaly.fr/sitemap.xml\n')
    # les mentions légales sont en noindex : elles n'ont pas leur place dans le plan du site
    wr(OUT, 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
       '  <url><loc>https://wigaly.fr/</loc><lastmod>%s</lastmod></url>\n</urlset>\n' % datetime.date.today().isoformat())
    wr(OUT, '.nojekyll', '')
    assets()
    phtml, _ = build_index(preview=True)
    wr(PRE, 'wigaly.html', phtml)
    wr(PRE, 'mentions-legales.html', build_page('mentions.html', './', '', preview=True, head_first='<meta name="claude:viewport-fit-sides" content="cover">\n'))
    print('index.html', len(html.encode()), 'octets, affiché', kb, 'ko ; aperçu', len(phtml.encode()))

if __name__ == '__main__':
    main()
