#!/usr/bin/env python3
"""Construit l'APK Android de Fada Royale, sans le SDK Android officiel.

    python3 android/build_apk.py            (depuis le dossier fada-royale)

Étapes : outils Java depuis Maven Central (android-all pour compiler, dalvik-dx pour le bytecode Android,
apksig pour signer) -> icônes -> compilation Java -> classes.dex -> manifeste et ressources binaires
(tools/apkbin.py) -> archive alignée avec le jeu dans assets/www -> signature v1+v2 -> vérifications.

Résultat : android/dist/FadaRoyale-<version>.apk
Clé de signature : android/keystore/ (créée au premier lancement, JAMAIS dans git : le dépôt est public).
Garde-la : sans elle, une nouvelle version ne peut pas s'installer par-dessus l'ancienne.
"""
import hashlib, os, re, secrets, shutil, struct, subprocess, sys, time, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'tools'))
import apkbin  # noqa: E402

TOOLS, BUILD, DIST, KEYS = (os.path.join(HERE, d) for d in ('.tools', 'build', 'dist', 'keystore'))
MAVEN = 'https://repo1.maven.org/maven2/'
JARS = {  # fichier : (chemin Maven Central, sha1)
    'android-all.jar': ('org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar', '94b1490a891e9be559aa35c87cd8a0c163f32d83'),
    'dalvik-dx.jar': ('com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar', '71ac16d1f34143d86440fca923422f9c2e2ac403'),
    'apksig.jar': ('com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar', '6ef7a58375aa68fb492b58edd97607bee8ee5c5c'),
}
GAME_FILES = ['index.html', 'src', 'assets', 'lib']  # ce qui part dans l'APK (pas les tests ni la documentation)
DENS = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def log(*a):
    print('•', *a, flush=True)


def sha1(path):
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def fetch_tools():
    os.makedirs(TOOLS, exist_ok=True)
    for name, (path, digest) in JARS.items():
        dest = os.path.join(TOOLS, name)
        if os.path.exists(dest) and sha1(dest) == digest:
            continue
        for attempt in range(6):
            log('téléchargement', name)
            try:
                urllib.request.urlretrieve(MAVEN + path, dest)
            except Exception as e:  # Maven Central limite parfois le débit (429) : on attend
                log('  échec :', e)
            if os.path.exists(dest) and sha1(dest) == digest:
                break
            time.sleep(30 * (attempt + 1))
        else:
            sys.exit('impossible de télécharger ' + name)
    return {k: os.path.join(TOOLS, k) for k in JARS}


def make_icon(size):
    """Icône : minaret d'Agadez devant un soleil couchant, liseré néon cyan (identité du lobby)."""
    from PIL import Image, ImageDraw, ImageFilter
    S = 512
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    bg = Image.new('RGBA', (S, S))
    bd = ImageDraw.Draw(bg)
    for y in range(S):
        t = y / (S - 1)
        stops = [(0, (243, 165, 92)), (0.55, (196, 87, 43)), (1, (42, 20, 10))]
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                k = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0])
                col = tuple(int(stops[i][1][c] + (stops[i + 1][1][c] - stops[i][1][c]) * k) for c in range(3))
        bd.line((0, y, S, y), fill=col + (255,))
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=112, fill=255)
    img.paste(bg, (0, 0), mask)
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((96, 70, 416, 390), fill=(255, 216, 138, 150))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(28)))
    d = ImageDraw.Draw(img)
    d.ellipse((150, 120, 362, 332), fill=(255, 222, 150, 255))
    d.ellipse((-80, 380, 330, 620), fill=(140, 72, 34, 255))
    d.ellipse((200, 395, 620, 640), fill=(110, 54, 24, 255))
    ink = (38, 18, 8, 255)
    d.polygon([(196, 470), (316, 470), (282, 126), (230, 126)], fill=ink)          # minaret
    for i, y in enumerate(range(150, 452, 30)):                                   # torons
        w = 30 + (y - 126) * 0.1
        d.rectangle((256 - w - 18, y, 256 - w + 6, y + 7), fill=ink)
        d.rectangle((256 + w - 6, y, 256 + w + 18, y + 7), fill=ink)
    d.rectangle((222, 104, 290, 128), fill=ink)
    d.ellipse((244, 72, 268, 106), fill=(244, 239, 230, 255))
    d.line((60, 470, 452, 470), fill=(63, 214, 232, 255), width=7)                  # néon cyan
    d.rounded_rectangle((4, 4, S - 5, S - 5), radius=110, outline=(242, 184, 75, 255), width=8)
    return img.resize((size, size), Image.LANCZOS)


def add_stored_aligned(zf, name, data, align=4):
    """Fichier non compressé dont les données commencent sur un multiple de 4 octets (exigé pour resources.arsc)."""
    zi = zipfile.ZipInfo(name, date_time=FIXED_TIME)
    zi.compress_type = zipfile.ZIP_STORED
    zi.extra = b'\0' * ((-(zf.fp.tell() + 30 + len(name.encode()))) % align)
    zf.writestr(zi, data)


def add_deflated(zf, name, data):
    zi = zipfile.ZipInfo(name, date_time=FIXED_TIME)
    zi.compress_type = zipfile.ZIP_DEFLATED
    zf.writestr(zi, data, compresslevel=9)


def keystore():
    os.makedirs(KEYS, exist_ok=True)
    ks, props = os.path.join(KEYS, 'fada-royale.p12'), os.path.join(KEYS, 'keystore.properties')
    if not os.path.exists(ks):
        pw = secrets.token_urlsafe(18)
        subprocess.run(['keytool', '-genkeypair', '-keystore', ks, '-storetype', 'PKCS12', '-alias', 'fada', '-keyalg', 'RSA',
                        '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Fada Royale, O=Fada Royale', '-storepass', pw, '-keypass', pw],
                       check=True, capture_output=True)
        with open(props, 'w') as f:
            f.write('storeFile=fada-royale.p12\nalias=fada\npassword=' + pw + '\n')
        log('nouvelle clé de signature créée :', ks, '(à garder précieusement, hors de git)')
    pw = re.search(r'password=(.*)', open(props).read()).group(1).strip()
    return ks, pw


def main():
    manifest = open(os.path.join(HERE, 'AndroidManifest.xml'), encoding='utf-8').read()
    version = re.search(r'android:versionName="([^"]+)"', manifest).group(1)
    min_sdk = re.search(r'android:minSdkVersion="(\d+)"', manifest).group(1)
    jars = fetch_tools()
    shutil.rmtree(BUILD, ignore_errors=True)
    os.makedirs(os.path.join(BUILD, 'classes'))
    os.makedirs(DIST, exist_ok=True)

    log('compilation Java')
    srcs = [os.path.join(r, f) for r, _, fs in os.walk(os.path.join(HERE, 'src')) for f in fs if f.endswith('.java')]
    subprocess.run(['javac', '-nowarn', '--release', '8', '-encoding', 'UTF-8', '-cp', jars['android-all.jar'], '-d', os.path.join(BUILD, 'classes')] + srcs, check=True)
    log('bytecode Android (dx)')
    dex = os.path.join(BUILD, 'classes.dex')
    subprocess.run(['java', '-cp', jars['dalvik-dx.jar'], 'com.android.dx.command.Main', '--dex', '--min-sdk-version=' + min_sdk,
                    '--output=' + dex, os.path.join(BUILD, 'classes')], check=True)

    log('icônes, ressources et manifeste binaires')
    icons = {q: 'res/mipmap-%s-v4/ic_launcher.png' % q for q in DENS}
    arsc, ids = apkbin.build_arsc('com.fadaroyale.game', {'mipmap/ic_launcher': icons})
    axml = apkbin.build_axml(manifest, ids)
    make_icon(512).save(os.path.join(DIST, 'icone-512.png'))

    unsigned = os.path.join(BUILD, 'unsigned.apk')
    count = 0
    with zipfile.ZipFile(unsigned, 'w') as zf:
        add_deflated(zf, 'AndroidManifest.xml', axml)
        add_deflated(zf, 'classes.dex', open(dex, 'rb').read())
        add_stored_aligned(zf, 'resources.arsc', arsc)
        for q, path in icons.items():
            from io import BytesIO
            b = BytesIO(); make_icon(DENS[q]).save(b, 'PNG')
            add_stored_aligned(zf, path, b.getvalue())
        for item in GAME_FILES:
            base = os.path.join(GAME, item)
            files = [base] if os.path.isfile(base) else sorted(os.path.join(r, f) for r, _, fs in os.walk(base) for f in fs)
            for f in files:
                rel = os.path.relpath(f, GAME).replace(os.sep, '/')
                add_deflated(zf, 'assets/www/' + rel, open(f, 'rb').read())
                count += 1
    log(count, 'fichiers du jeu ajoutés')

    log('signature')
    ks, pw = keystore()
    tool_cls = os.path.join(BUILD, 'signer')
    subprocess.run(['javac', '-nowarn', '-cp', jars['apksig.jar'], '-d', tool_cls, os.path.join(HERE, 'tools', 'Signer.java')], check=True)
    out = os.path.join(DIST, 'FadaRoyale-%s.apk' % version)
    # apksig 2.3.0 utilise des classes internes de Java : il faut les lui ouvrir sur Java 9+
    opens = [x for m in ('sun.security.x509', 'sun.security.pkcs', 'sun.security.util') for x in ('--add-exports', 'java.base/%s=ALL-UNNAMED' % m)]
    env = dict(os.environ, FADA_KEY_PASS=pw)  # mot de passe par variable d'environnement (jamais dans la ligne de commande)
    subprocess.run(['java'] + opens + ['-cp', jars['apksig.jar'] + os.pathsep + tool_cls, 'Signer', unsigned, out, ks, 'fada', min_sdk], check=True, env=env)

    # alignement des fichiers non compressés après signature
    with open(out, 'rb') as f:
        data = f.read()
    with zipfile.ZipFile(out) as zf:
        for zi in zf.infolist():
            if zi.compress_type == zipfile.ZIP_STORED:
                o = zi.header_offset
                n, e = struct.unpack('<HH', data[o + 26:o + 30])
                if (o + 30 + n + e) % 4:
                    sys.exit('fichier mal aligné : ' + zi.filename)
    log('APK prêt :', out, '(%.1f Mo)' % (os.path.getsize(out) / 1e6))
    return out


if __name__ == '__main__':
    main()
