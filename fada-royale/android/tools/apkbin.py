"""Écriture des fichiers binaires Android sans le SDK : AndroidManifest.xml (format AXML) et resources.arsc.

Le SDK officiel (aapt2) n'est pas téléchargeable depuis l'environnement de construction ; ces deux formats sont
documentés dans les sources d'Android (frameworks/base/libs/androidfw/include/androidfw/ResourceTypes.h).
Le résultat est vérifié par build_apk.py avec androguard (lecture indépendante des mêmes formats).
"""
import struct
import xml.etree.ElementTree as ET

RES_STRING_POOL, RES_TABLE, RES_XML = 0x0001, 0x0002, 0x0003
RES_XML_START_NS, RES_XML_END_NS, RES_XML_START_EL, RES_XML_END_EL, RES_XML_RESOURCE_MAP = 0x0100, 0x0101, 0x0102, 0x0103, 0x0180
RES_TABLE_PACKAGE, RES_TABLE_TYPE, RES_TABLE_TYPE_SPEC = 0x0200, 0x0201, 0x0202
TYPE_REFERENCE, TYPE_STRING, TYPE_INT_DEC, TYPE_INT_HEX, TYPE_INT_BOOLEAN = 0x01, 0x03, 0x10, 0x11, 0x12
NO_INDEX = 0xFFFFFFFF
ANDROID_NS = 'http://schemas.android.com/apk/res/android'

# Identifiants des attributs android:* (relevés dans android.R.attr de l'API 34) et façon d'écrire leur valeur
ATTRS = {
    'theme': (16842752, 'ref'), 'label': (16842753, 'string'), 'icon': (16842754, 'ref'), 'name': (16842755, 'string'),
    'exported': (16842768, 'bool'), 'launchMode': (16842781, {'standard': 0, 'singleTop': 1, 'singleTask': 2, 'singleInstance': 3}),
    'screenOrientation': (16842782, {'unspecified': -1, 'landscape': 0, 'portrait': 1, 'sensorLandscape': 6, 'sensorPortrait': 7, 'fullSensor': 10}),
    'configChanges': (16842783, ('flags', {'mcc': 0x1, 'mnc': 0x2, 'locale': 0x4, 'touchscreen': 0x8, 'keyboard': 0x10, 'keyboardHidden': 0x20,
                                           'navigation': 0x40, 'orientation': 0x80, 'screenLayout': 0x100, 'uiMode': 0x200, 'screenSize': 0x400,
                                           'smallestScreenSize': 0x800, 'density': 0x1000, 'layoutDirection': 0x2000, 'fontScale': 0x40000000})),
    'minSdkVersion': (16843276, 'int'), 'versionCode': (16843291, 'int'), 'versionName': (16843292, 'string'),
    'targetSdkVersion': (16843376, 'int'), 'allowBackup': (16843392, 'bool'), 'glEsVersion': (16843393, 'hex'),
    'required': (16843406, 'bool'), 'hardwareAccelerated': (16843475, 'bool'), 'largeHeap': (16843610, 'bool'),
    'usesCleartextTraffic': (16844012, 'bool'), 'resizeableActivity': (16844022, 'bool'),
}
ANDROID_REFS = {'@android:style/Theme.Black.NoTitleBar.Fullscreen': 16973834}


def _pad4(b):
    return b + b'\0' * ((-len(b)) % 4)


def _len8(n):
    return bytes([n]) if n < 0x80 else bytes([(n >> 8) | 0x80, n & 0xFF])


def _len16(n):
    return struct.pack('<H', n) if n < 0x8000 else struct.pack('<HH', (n >> 16) | 0x8000, n & 0xFFFF)


def string_pool(strings, utf8):
    data, offsets = bytearray(), []
    for s in strings:
        offsets.append(len(data))
        u16 = s.encode('utf-16-le')
        if utf8:
            enc = s.encode('utf-8')
            data += _len8(len(u16) // 2) + _len8(len(enc)) + enc + b'\0'
        else:
            data += _len16(len(u16) // 2) + u16 + b'\0\0'
    data = _pad4(bytes(data))
    start = 28 + 4 * len(strings)
    hdr = struct.pack('<HHIIIIII', RES_STRING_POOL, 28, start + len(data), len(strings), 0, 0x100 if utf8 else 0, start if strings else 0, 0)
    return hdr + b''.join(struct.pack('<I', o) for o in offsets) + data


# ----------------------------------------------------------------- resources.arsc
DENSITIES = {'mdpi': 160, 'hdpi': 240, 'xhdpi': 320, 'xxhdpi': 480, 'xxxhdpi': 640}


def _config(density):
    c = bytearray(64)
    struct.pack_into('<I', c, 0, 64)
    if density:
        struct.pack_into('<H', c, 14, density)   # ResTable_config.density
        struct.pack_into('<H', c, 24, 4)         # sdkVersion 4 (comme aapt pour les qualificatifs de densité)
    return bytes(c)


def build_arsc(package, files):
    """files : {'mipmap/ic_launcher': {'mdpi': 'res/mipmap-mdpi-v4/ic_launcher.png', ...}} -> (octets, {'@mipmap/ic_launcher': id})"""
    types = []
    for key in files:
        t = key.split('/')[0]
        if t not in types:
            types.append(t)
    values = []
    for key, by_dens in files.items():
        for path in by_dens.values():
            if path not in values:
                values.append(path)
    ids, chunks, key_names = {}, b'', []
    for ti, t in enumerate(types, start=1):
        names = [k.split('/')[1] for k in files if k.split('/')[0] == t]
        key_base = len(key_names)
        key_names += names
        flags = []
        dens_set = []
        for n in names:
            d = files[t + '/' + n]
            flags.append(0x0100 if len(d) > 1 else 0)  # varie selon la densité
            for q in d:
                if q not in dens_set:
                    dens_set.append(q)
        chunks += struct.pack('<HHIBBHI', RES_TABLE_TYPE_SPEC, 16, 16 + 4 * len(names), ti, 0, 0, len(names)) + b''.join(struct.pack('<I', f) for f in flags)
        for q in dens_set:
            cfg = _config(DENSITIES.get(q, 0))
            offs, entries = [], b''
            for ei, n in enumerate(names):
                path = files[t + '/' + n].get(q)
                if path is None:
                    offs.append(NO_INDEX)
                    continue
                offs.append(len(entries))
                entries += struct.pack('<HHI', 8, 0, key_base + ei) + struct.pack('<HBBI', 8, 0, TYPE_STRING, values.index(path))
            hsize = 20 + len(cfg)
            start = hsize + 4 * len(names)
            chunks += struct.pack('<HHIBBHII', RES_TABLE_TYPE, hsize, start + len(entries), ti, 0, 0, len(names), start) + cfg \
                + b''.join(struct.pack('<I', o) for o in offs) + entries
        for ei, n in enumerate(names):
            ids['@' + t + '/' + n] = (0x7f << 24) | (ti << 16) | ei
    type_pool, key_pool = string_pool(types, False), string_pool(key_names, True)
    name16 = package.encode('utf-16-le')[:254].ljust(256, b'\0')
    body = type_pool + key_pool + chunks
    pkg = struct.pack('<HHI', RES_TABLE_PACKAGE, 288, 288 + len(body)) + struct.pack('<I', 0x7f) + name16 \
        + struct.pack('<IIIII', 288, len(types), 288 + len(type_pool), len(key_names), 0) + body
    gpool = string_pool(values, True)
    table = struct.pack('<HHII', RES_TABLE, 12, 12 + len(gpool) + len(pkg), 1) + gpool + pkg
    return table, ids


# ----------------------------------------------------------------- AndroidManifest.xml
def _value(local, text, refs):
    rid, kind = ATTRS[local] if local in ATTRS else (None, 'string')
    if kind == 'string':
        return ('s', text)
    if kind == 'ref':
        if text in refs:
            return (TYPE_REFERENCE, refs[text])
        if text in ANDROID_REFS:
            return (TYPE_REFERENCE, ANDROID_REFS[text])
        raise ValueError('référence inconnue : ' + text)
    if kind == 'bool':
        return (TYPE_INT_BOOLEAN, NO_INDEX if text == 'true' else 0)
    if kind == 'int':
        return (TYPE_INT_DEC, int(text))
    if kind == 'hex':
        return (TYPE_INT_HEX, int(text, 0))
    if isinstance(kind, dict):
        return (TYPE_INT_DEC, kind[text] & 0xFFFFFFFF)
    if isinstance(kind, tuple):
        v = 0
        for part in text.split('|'):
            v |= kind[1][part]
        return (TYPE_INT_HEX, v)
    raise ValueError(local)


def build_axml(xml_text, refs):
    root = ET.fromstring(xml_text)
    # 1) recenser les attributs à identifiant (ils doivent être en tête du pool, dans l'ordre de la table)
    id_names = {}
    for el in root.iter():
        for k in el.attrib:
            if k.startswith('{' + ANDROID_NS + '}'):
                local = k.split('}')[1]
                if local not in ATTRS:
                    raise ValueError('attribut android inconnu : ' + local)
                id_names[local] = ATTRS[local][0]
    ordered = sorted(id_names, key=lambda n: id_names[n])
    pool = list(ordered)
    index = {}

    def sid(s):
        if s not in index:
            index[s] = len(pool)
            pool.append(s)
        return index[s]

    id_index = {n: i for i, n in enumerate(ordered)}
    p_android, u_android = sid('android'), sid(ANDROID_NS)
    body = bytearray()
    line = [1]

    def walk(el):
        attrs = []
        for k, v in el.attrib.items():
            if k.startswith('{'):
                local = k.split('}')[1]
                ns, name, rid = u_android, id_index[local], ATTRS[local][0]
            else:
                local, ns, rid = k, NO_INDEX, None
                name = sid(k)
            typ, data = _value(local, v, refs) if rid is not None else ('s', v)
            if typ == 's':
                raw = sid(v)
                typ, data = TYPE_STRING, raw
            else:
                raw = NO_INDEX
            attrs.append((rid, ns, local, struct.pack('<IIIHBBI', ns, name, raw, 8, 0, typ, data)))
        # attributs triés par identifiant (puis les autres par nom) : Android les lit dans cet ordre
        attrs.sort(key=lambda a: (0, a[0]) if a[0] is not None else (1, a[2]))
        name = sid(el.tag)
        ab = b''.join(a[3] for a in attrs)
        body.extend(struct.pack('<HHIII', RES_XML_START_EL, 16, 36 + len(ab), line[0], NO_INDEX)
                    + struct.pack('<IIHHHHHH', NO_INDEX, name, 20, 20, len(attrs), 0, 0, 0) + ab)
        line[0] += 1
        for ch in el:
            walk(ch)
        body.extend(struct.pack('<HHIIIII', RES_XML_END_EL, 16, 24, line[0], NO_INDEX, NO_INDEX, name))
        line[0] += 1

    walk(root)
    start_ns = struct.pack('<HHIIIII', RES_XML_START_NS, 16, 24, 1, NO_INDEX, p_android, u_android)
    end_ns = struct.pack('<HHIIIII', RES_XML_END_NS, 16, 24, line[0], NO_INDEX, p_android, u_android)
    spool = string_pool(pool, False)
    rmap = struct.pack('<HHI', RES_XML_RESOURCE_MAP, 8, 8 + 4 * len(ordered)) + b''.join(struct.pack('<I', id_names[n]) for n in ordered)
    content = spool + rmap + start_ns + bytes(body) + end_ns
    return struct.pack('<HHI', RES_XML, 8, 8 + len(content)) + content
