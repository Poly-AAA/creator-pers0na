#!/usr/bin/env python3
"""
APERÇU — 'Panoplie de l'Aube Pourpre' (féminine, 4 pièces), même pipeline que build-kintsugi-panoply.py :
masques des sheets du pack (NakedBody + Head7/Chest3/Chest9/Legs1/Hands3/Shoes1 pour segmenter le corps)
-> recoloration cel-shading 3 tons + outline #1c154d, alignée au pixel sur NakedBody (1920x1024, 15x8 de 128).
  HeadFeminine  (coiffe : cheveux longs, queue haute + mèches, physique secondaire)
  ChestFeminine (torse : bustier/corset couvrant, manches longues)
  LegsFeminine  (jambes : leggings + tassettes, hanches/fessiers arrondis)
  HandsFeminine (gants : gants fins + ongles longs vernis)
Usage: build-feminine-panoply.py [--variant pulpeuse] [Anim ...]   (défaut: toutes les anims)
  --variant pulpeuse -> *FemininePulpeuse/ : buste +1 px (profil 3 px), taille plus fine,
  hanches/fessiers/cuisses plus pleins, rebond 1 px (retard d'1 frame) sur buste et hanches.
"""
import sys, math
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from PIL import Image

BASE = Path("/workspace/creator-pers0na/assets/packs/fantasy-cc/spritesheets")
FW = FH = 128; COLS, ROWS = 15, 8
ANIMS = ["Idle","Idle2","Idle3","Idle4","Walk","Run","RunBackwards","StrafeLeft","StrafeRight",
         "CrouchIdle","CrouchRun","Attack1","Attack2","Attack3","Attack4","Attack5","Attack6",
         "AttackRun","AttackRun2","Kick","Special1","TakeDamage","Die","Taunt","Slide","Rolling",
         "RideIdle","RideRun","RideIdleAttack1","RideRunAttack1"]
LOOP = {"Idle","Idle2","Idle3","Idle4","Walk","Run","RunBackwards","StrafeLeft","StrafeRight",
        "CrouchIdle","CrouchRun","RideIdle","RideRun","RideIdleAttack1","RideRunAttack1","AttackRun","AttackRun2"}
TRAIL = {"Walk":0.55,"Run":1.0,"RunBackwards":-0.6,"CrouchRun":0.7,"AttackRun":0.9,"AttackRun2":0.9,
         "Slide":0.9,"RideRun":0.9,"RideRunAttack1":0.9,"StrafeLeft":0.3,"StrafeRight":0.3}

OUT = (0x1c, 0x15, 0x4d, 255)
VARIANTS = {
  "base": dict(suffix="Feminine",
     bust_side=[1,2,2,1], bust_34=[1,1,1], bust_34back=[1,1], bust_front=None, bust_back_side=None, bust_rows=3,
     hip_side_back=[1,2,2,2,1], hip_side_front=[0,1,1,0], hip_34_back=[1,1,2,1,1], hip_34_front=[0,1,1,0],
     hip_front=[1,1,1,1], thigh=0, waist_cinch=False, bounce=False),
  "pulpeuse": dict(suffix="FemininePulpeuse",
     bust_side=[1,2,3,3,2,1], bust_34=[1,2,2,2,1], bust_34back=[1,1,1], bust_front=None, bust_back_side=None, bust_rows=4,
     hip_side_back=[1,2,3,3,3,3,2,1], hip_side_front=[0,1,1,1,0], hip_34_back=[1,2,2,3,2,1], hip_34_front=[0,1,1,1,0],
     hip_front=[1,2,2,3,2,1], thigh=1, waist_cinch=True, bounce=True),
}
def H(h): h=h.lstrip('#'); return (int(h[0:2],16),int(h[2:4],16),int(h[4:6],16),255)
PAL = {
  "hair":  [H("F4A96A"), H("C8613F"), H("85323A")],   # cuivre châtain
  "cloth": [H("C26BB0"), H("8A3E95"), H("4E2468")],   # prune
  "gold":  [H("FFE0B0"), H("E7A465"), H("A9623F")],   # or rose
  "teal":  [H("8CF0D8"), H("34B3A0"), H("1F6B78")],   # sarcelle (gants, ruban)
  "nail":  [H("FFC2D6"), H("FF4F86"), H("B0245A")],   # vernis framboise
}
# facing (screen) per row : 0 E,1 SE,2 S,3 SW,4 W,5 NW,6 N,7 NE
FACE = [(1,0),(0.75,0.6),(0,1),(-0.75,0.6),(-1,0),(-0.75,-0.6),(0,-1),(0.75,-0.6)]

def load(folder, anim):
    p = BASE/folder/f"{anim}.png"
    return np.array(Image.open(p).convert("RGBA")) if p.exists() else None

def cell(arr, r, c):
    if arr is None: return np.zeros((FH,FW),bool)
    return arr[r*FH:(r+1)*FH, c*FW:(c+1)*FW, 3] > 24

def bbox(m):
    ys, xs = np.nonzero(m)
    if len(xs)==0: return None
    return xs.min(), ys.min(), xs.max(), ys.max()

def shift(m, dx, dy):
    o = np.zeros_like(m)
    H_, W_ = m.shape
    ys = slice(max(0,dy), H_+min(0,dy)); yd = slice(max(0,-dy), H_+min(0,-dy))
    xs = slice(max(0,dx), W_+min(0,dx)); xd = slice(max(0,-dx), W_+min(0,-dx))
    o[ys, xs] = m[yd, xd]
    return o

def dilate(m, n=1):
    for _ in range(n):
        m = m | shift(m,1,0) | shift(m,-1,0) | shift(m,0,1) | shift(m,0,-1)
    return m

def components(m):
    lab = np.zeros(m.shape, int); n = 0
    for y, x in zip(*np.nonzero(m)):
        if lab[y,x]: continue
        n += 1; st=[(y,x)]; lab[y,x]=n
        while st:
            cy,cx = st.pop()
            for ny,nx in ((cy+1,cx),(cy-1,cx),(cy,cx+1),(cy,cx-1)):
                if 0<=ny<FH and 0<=nx<FW and m[ny,nx] and not lab[ny,nx]:
                    lab[ny,nx]=n; st.append((ny,nx))
    return lab, n

def cel(mask, tones, body_lum=None, dark_extra=None):
    """3 tons : lumière haut-gauche, ombre bas-droite + plis du corps."""
    L, M, D = tones
    img = np.zeros((FH,FW,4), np.uint8)
    img[mask] = M
    edge_dark = mask & (~shift(mask,-1,0) | ~shift(mask,0,-1))   # neighbor right / below outside
    edge_light = mask & (~shift(mask,1,0) | ~shift(mask,0,1)) & ~edge_dark
    img[edge_light] = L
    img[edge_dark] = D
    if body_lum is not None:
        img[mask & (body_lum < 120)] = D
    if dark_extra is not None:
        img[mask & dark_extra] = D
    return img

def outline(img, only_on=None):
    a = img[...,3] > 0
    ring = dilate(a) & ~a
    if only_on is not None: ring &= only_on
    img[ring] = OUT
    return img

# ---------------- segmentation ----------------
def segment(S, r, c):
    body = cell(S["NakedBody"], r, c)
    lum = S["NakedBody"][r*FH:(r+1)*FH, c*FW:(c+1)*FW, 0].astype(int)
    head = cell(S["Head7"], r, c) & body
    ch9 = cell(S["Chest9"], r, c) & body
    ch3 = cell(S["Chest3"], r, c) & body
    legs = cell(S["Legs1"], r, c) & body
    feet = cell(S["Shoes1"], r, c) & body
    h3 = cell(S["Hands3"], r, c) & body
    torso = ch3 & ~head
    sleeve = ch9 & ~ch3 & ~head
    legs = legs & ~torso & ~sleeve & ~feet
    left = body & ~head & ~torso & ~sleeve & ~legs & ~feet
    hands = h3.copy()
    lab, n = components(left)
    for i in range(1, n+1):
        comp = lab == i
        near = dilate(comp)
        if (near & (h3 | sleeve)).any():
            hands |= comp
        elif (near & torso).any():
            torso |= comp
        elif (near & legs).any():
            legs |= comp
        else:
            hands |= comp
    torso &= ~hands; sleeve &= ~hands; legs &= ~hands
    return dict(body=body, lum=lum, head=head, torso=torso, sleeve=sleeve, legs=legs, feet=feet, hands=hands)

# ---------------- hair physics ----------------
NODES = 8
SEG = 1.9
def head_frame(seg, r):
    bb = bbox(seg["head"])
    if bb is None: return None
    x0,y0,x1,y1 = bb
    return dict(x0=x0,y0=y0,x1=x1,y1=y1,cx=(x0+x1)/2,cy=(y0+y1)/2,w=x1-x0+1,h=y1-y0+1)

def anchor_of(hf, r):
    fx, fy = FACE[r]
    ax = hf["cx"] - fx*hf["w"]*0.38
    ay = hf["y0"] + (0.5 - (0.6 if fy > 0.3 else 0) if abs(fx) > 0.3 else 0.2)
    if fy < -0.3: ay = hf["y0"] + 0.5
    return np.array([ax, ay])

def rest_dirs(r, trail):
    fx, fy = FACE[r]
    out = []
    for i in range(NODES):
        if i == 0: d = np.array([-fx*1.0, (-0.1 if fy > -0.3 else 0.3) if abs(fx) > 0.3 else 0.5])   # départ de la queue haute
        elif i == 1: d = np.array([-fx*0.7, 0.7])
        else: d = np.array([-fx*(0.30+trail*0.9), 1.0 - abs(trail)*0.25])
        out.append(d/ (np.linalg.norm(d)+1e-6))
    return out

def simulate(anchors, r, anim, loop):
    """lagging-spring chain (verlet-like) : les mèches traînent derrière le mouvement."""
    trail = TRAIL.get(anim, 0.0)
    dirs = rest_dirs(r, trail)
    n = len(anchors)
    def target(a, k, t):
        pts=[a.copy()]
        for i in range(NODES):
            sway = math.sin(t*2*math.pi/n*(2 if anim.startswith("Walk") or anim.startswith("Run") else 1) - i*0.55)
            amp = (0.10 if trail==0 else 0.18)*i
            d = dirs[i] + np.array([sway*amp*0.35, 0])
            pts.append(pts[-1] + d/np.linalg.norm(d)*SEG)
        return np.array(pts)
    P = target(anchors[0], 0, 0); prev = P.copy()
    res = [None]*n
    passes = 3 if loop else 1
    seq = list(range(n))*passes
    if not loop: seq = [0]*6 + seq
    for step, c in enumerate(seq):
        T = target(anchors[c], 0, c)
        vel = (P - prev)*0.55
        prev = P.copy()
        stiff = np.linspace(1.0, 0.30, NODES+1)[:,None]
        P = P + vel + (T - P)*stiff
        P[0] = anchors[c]
        for _ in range(3):
            for i in range(1, NODES+1):
                d = P[i]-P[i-1]; L = np.linalg.norm(d)+1e-6
                P[i] = P[i-1] + d/L*SEG
        if step >= len(seq)-n:
            Q = P.copy(); fx = FACE[r][0]
            if abs(fx) > 0.3:               # la queue reste du côté nuque, jamais devant le visage
                for i in range(2, NODES+1):
                    if (Q[i,0]-Q[0,0])*fx > -0.5: Q[i,0] = Q[0,0] - 0.5*np.sign(fx)
            res[c] = Q
    return res

def raster_chain(P, widths):
    m = np.zeros((FH,FW),bool); tpar = np.full((FH,FW), -1.0); side = np.zeros((FH,FW))
    x0=int(P[:,0].min())-3; x1=int(P[:,0].max())+4; y0=int(P[:,1].min())-3; y1=int(P[:,1].max())+4
    for y in range(max(0,y0), min(FH,y1)):
        for x in range(max(0,x0), min(FW,x1)):
            q = np.array([x+0.5,y+0.5]); best=None
            for i in range(len(P)-1):
                a,b = P[i],P[i+1]; ab=b-a; t=np.clip(np.dot(q-a,ab)/(np.dot(ab,ab)+1e-6),0,1)
                d = np.linalg.norm(q-(a+ab*t)); rad = (widths[i]*(1-t)+widths[i+1]*t)/2
                if d <= rad and (best is None or d < best[0]):
                    cr = ab[0]*(q-a)[1]-ab[1]*(q-a)[0]
                    best=(d,(i+t)/(len(P)-1), np.sign(cr)*d/max(rad,0.1))
            if best: m[y,x]=True; tpar[y,x]=best[1]; side[y,x]=best[2]
    return m, tpar, side

# ---------------- pieces ----------------
def render_head(seg, r, hf, P, locks):
    img = np.zeros((FH,FW,4), np.uint8)
    if hf is None: return img
    fx, fy = FACE[r]
    head = seg["head"]; L,M,D = PAL["hair"]
    ys, xs = np.nonzero(head)
    cap = np.zeros((FH,FW),bool)
    for y, x in zip(ys, xs):
        ry = (y-hf["y0"])/hf["h"]; u = (x-hf["cx"])/(hf["w"]/2)
        s = u*fx
        hair = ry < 0.36
        if fy < -0.3: hair = hair or s < 0.6 or ry < 0.9
        elif abs(fx) > 0.9: hair = hair or s < 0.1
        elif fy > 0.9: hair = hair or abs(u) > 0.62
        else: hair = hair or s < -0.2 or abs(u) > 0.85
        if abs(fx) > 0.3 and fy >= -0.3 and 0.36 <= ry < 0.48 and s < 0.5: hair = True  # frange latérale
        if fy < -0.3: hair = True
        cap[y,x] = hair
    # volume : +1 px au-dessus et côté nuque
    top = shift(cap,0,-1) & ~seg["body"]
    xs_top = np.nonzero(top)[1]
    if len(xs_top): top[:, [x for x in range(FW) if x <= xs_top.min() or x >= xs_top.max()]] = False
    back = (shift(cap, -1 if fx > 0.3 else (1 if fx < -0.3 else 0), 0) & ~seg["body"]) if abs(fx) > 0.3 else np.zeros_like(cap)
    cap |= top | back
    # queue de cheval
    widths = [2.2, 2.8, 2.9, 2.8, 2.6, 2.3, 2.0, 1.6, 1.0]
    pt, tpar, side = raster_chain(P, widths)
    behind = fy > 0.3
    if behind:
        pt &= ~dilate(seg["body"]) | (np.arange(FH)[:,None] < hf["y0"]+1)
        pt &= ~head
    else:
        pt &= ~(head & ~cap)
        if fy >= -0.3: pt &= ~(head & (tpar > 0.22))     # passe DERRIÈRE le crâne (fix clipping Attack1 E f6-7)
    # mèches longues (devant les épaules)
    lk = np.zeros((FH,FW),bool)
    for Q in locks:
        m,_,_ = raster_chain(Q, [1.3,1.3,1.2,1.1,0.9])
        lk |= m
    allh = cap | pt | lk
    img = cel(allh, PAL["hair"])
    # brillance (anneau de lumière) + mèches sombres
    for y, x in zip(*np.nonzero(cap)):
        ry=(y-hf["y0"])/hf["h"]
        if 0.12 <= ry < 0.30 and x < hf["cx"]+1 and img[y,x,0]==M[0]: img[y,x]=L
    for y, x in zip(*np.nonzero(pt)):
        if side[y,x] < -0.35: img[y,x]=D
        elif side[y,x] > 0.25 and tpar[y,x] < 0.75: img[y,x]=L
        if (x+y)%5==0 and tpar[y,x]>0.3: img[y,x]=D
    # ruban sarcelle à la base de la queue
    tL,tM,tD = PAL["gold"]   # attache or rose (pas de sarcelle sur la tête : évite tout effet "yeux")
    a = P[1] if behind else P[0]
    for dx, dy, col in ((0,0,tM),(0,1,tD)):
        x, y = int(round(a[0]))+dx, int(round(a[1]))+dy
        if 0<=x<FW and 0<=y<FH and (not behind or not seg["body"][y,x] or y < hf["y0"]+1) and allh[y,x]:
            img[y,x]=col
    face = dilate(head) & seg["body"] & ~allh      # pas de trait sombre sur le visage (aucun "trait" d'yeux/bouche)
    return outline(img, only_on=~face)

def render_chest(seg, r, V=None, lag=0):
    V = V or VARIANTS["base"]
    fx, fy = FACE[r]
    torso, sleeve = seg["torso"].copy(), seg["sleeve"]
    bb = bbox(torso)
    if bb is None: return np.zeros((FH,FW,4),np.uint8)
    x0,y0,x1,y1 = bb; h = y1-y0+1; cx=(x0+x1)/2
    # buste : galbe 1-2px vers l'avant (vues de profil / 3/4)
    add = np.zeros_like(torso)
    if abs(fx) > 0.3 and fy > -0.9:
        sgn = 1 if fx > 0 else -1
        b0 = y0 + int(round(h*0.18)) + lag
        hb = bbox(seg["head"])
        if V["bounce"] and hb: b0 = max(b0, hb[3] + lag)        # pas sous le menton
        prof = V["bust_side"] if abs(fx) > 0.9 else V["bust_34"]
        if fy < -0.3: prof = V["bust_34back"]
        for k, amt in enumerate(prof):
            y = b0+k
            xs = np.nonzero(torso[y])[0]
            if len(xs)==0: continue
            xf = xs.max() if sgn>0 else xs.min()
            # pulpeuse : le galbe passe devant un bras pendant (manche courte en largeur <=3 px)
            run = 0
            occ = sleeve | seg["hands"]          # bras/mains devant : le galbe continue derrière (gants au-dessus)
            while V["bounce"] and 0 <= xf+sgn*(run+1) < FW and occ[y, xf+sgn*(run+1)]: run += 1
            skip = min(run, 1) if run <= 3 else 0     # max +1 px derrière le bras (pas de "moignon")
            for j in range(1, amt+1+skip):
                x = xf + sgn*j
                if 0<=x<FW and (not seg["body"][y,x] or (j <= skip)): add[y,x]=True
    def side_grow(prof, b0):
        for k, amt in enumerate(prof):
            y = b0+k
            if not (0 <= y < FH): continue
            xs = np.nonzero(torso[y])[0]
            if len(xs)==0: continue
            for sgn, xe in ((-1, xs.min()), (1, xs.max())):
                for j in range(1, amt+1):
                    x = xe+sgn*j
                    if 0<=x<FW and not seg["body"][y,x]: add[y,x]=True
    if abs(fx) <= 0.3:
        b0 = y0 + int(round(h*0.16)) + lag
        if fy > 0.3 and V["bust_front"]: side_grow(V["bust_front"], b0)
        if fy < -0.3 and V["bust_back_side"]: side_grow(V["bust_back_side"], b0)
    torso |= add
    img = cel(torso, PAL["cloth"], seg["lum"])
    sl = cel(sleeve, PAL["cloth"])
    sl[sleeve & (seg["lum"]<120)] = PAL["cloth"][2]
    img[sleeve] = sl[sleeve]
    gL,gM,gD = PAL["gold"]; cL,cM,cD = PAL["cloth"]
    bust_y0 = y0 + int(round(h*0.18)) + lag; bust_y1 = bust_y0 + V["bust_rows"]
    waist_y = y0 + int(round(h*0.62))
    for y, x in zip(*np.nonzero(torso)):
        xs = np.nonzero(torso[y])[0]; ex = min(x-xs.min(), xs.max()-x)
        # col montant
        if y == y0 or (y == y0+1 and abs(x-cx) <= 1): img[y,x] = gM if x < cx+1 else gD
        # cintrage taille (corset) : flancs sombres + ceinture V or rose
        if waist_y-2 <= y <= waist_y+1 and ex == 0: img[y,x] = cD
        if V["waist_cinch"] and waist_y-3 <= y <= waist_y+1 and not add[y,x]:
            # taille plus fine : 1 px de contour rentré de chaque côté (+1 px ombre)
            if ex == 0: img[y,x] = OUT
            elif ex == 1: img[y,x] = cD
        if y == waist_y+1 + (0 if abs(x-cx) > 1.5 or fy < 0 else 1): img[y,x] = gL if x < cx else gM
        # buste (vues de face) : deux volumes ombrés + sous-buste
        if fy > 0.3:
            if bust_y0 <= y < bust_y1 and ex >= 1:
                img[y,x] = cL if ((y == bust_y0 or (V["bust_front"] and y == bust_y0+1 and ex >= 2)) and abs(x-cx) > 0.6) else cM
                if abs(x-cx) < 0.6: img[y,x] = gM          # broche/couture centrale
            if y == bust_y1 and ex >= 1: img[y,x] = cD     # ombre sous-buste
            # laçage du corset
            if bust_y1 < y < waist_y and abs(x-cx) < 0.6: img[y,x] = gL if y % 2 else gD
        elif fy < -0.3:
            if y0+2 < y < waist_y and abs(x-cx) < 0.6: img[y,x] = gL if y % 2 else gD   # laçage dos
        else:
            if bust_y0 <= y < bust_y1 and add[y].any():
                xs2 = np.nonzero(add[y])[0]
                img[y, xs2] = cL
    # épaulettes or rose
    shoulder = sleeve & dilate(seg["torso"]) & (np.arange(FH)[:,None] <= y0+3)
    for y, x in zip(*np.nonzero(shoulder)):
        img[y,x] = gL if x < cx else gM
    return outline(img)

def render_legs(seg, r, V=None, lag=0):
    V = V or VARIANTS["base"]
    fx, fy = FACE[r]
    legs = seg["legs"].copy()
    bb = bbox(legs)
    if bb is None: return np.zeros((FH,FW,4),np.uint8)
    x0,y0,x1,y1 = bb; h=y1-y0+1
    add = np.zeros_like(legs)
    body = seg["body"]
    free = seg["sleeve"] | seg["hands"]      # bras/mains (dessinés au-dessus) : la hanche passe derrière
    def grow(y, sgn, amt):
        xs = np.nonzero(legs[y])[0]
        if len(xs)==0: return
        xe = xs.max() if sgn>0 else xs.min()
        if V["bounce"]:                       # traverse une main/manche collée (<=3 px) : la courbe passe derrière
            run = 0
            while 0 <= xe+sgn*(run+1) < FW and free[y, xe+sgn*(run+1)] and run < 4: run += 1
            if run <= 3: xe += sgn*run
        for j in range(1, amt+1):
            x = xe+sgn*j
            if 0<=x<FW and (not body[y,x] or (V["bounce"] and free[y,x])): add[y,x]=True
    # hanches + fessiers arrondis
    hy = y0 + 1 + lag
    if abs(fx) > 0.3:
        bs = -1 if fx > 0 else 1          # côté dos
        prof = V["hip_side_back"] if abs(fx) > 0.9 else V["hip_34_back"]
        for k, amt in enumerate(prof): grow(hy+k, bs, amt)
        for k, amt in enumerate(V["hip_side_front"] if abs(fx) > 0.9 else V["hip_34_front"]): grow(hy+k, -bs, amt)   # hanche avant
        for k in range(V["thigh"]*4): grow(hy+len(prof)+k, -bs, 1)                    # cuisse avant
    else:
        for k, amt in enumerate(V["hip_front"]):
            grow(hy+k, -1, amt); grow(hy+k, 1, amt)
        for k in range(V["thigh"]*4):                                                  # cuisses
            grow(hy+len(V["hip_front"])+k, -1, 1); grow(hy+len(V["hip_front"])+k, 1, 1)
    legs |= add
    img = cel(legs, PAL["cloth"], seg["lum"])
    cL,cM,cD = PAL["cloth"]; gL,gM,gD = PAL["gold"]
    # leggings un ton plus sombre sous le genou, tassettes or rose sur les hanches
    tas_y1 = y0 + max(3, int(round(h*0.22)))
    for y, x in zip(*np.nonzero(legs)):
        if y <= tas_y1:
            row = np.nonzero(legs[y])[0]; ex = min(x-row.min(), row.max()-x)
            if ex <= 1: img[y,x] = gL if (y == y0 or ex == 0 and x < (x0+x1)/2) else gM
            if y == tas_y1 and ex <= 1: img[y,x] = gD
        elif y > y0 + h*0.62 and img[y,x,0] == cM[0]:
            img[y,x] = cD if (x+y) % 7 == 0 else cM
    # rondeur du fessier en vue de dos : couture centrale + reflets
    if fy < -0.3:
        cx = (x0+x1)/2
        for y in range(tas_y1+1, tas_y1+4):
            for x in range(int(cx)-3, int(cx)+4):
                if legs[y,x]:
                    if abs(x-cx) < 0.6: img[y,x]=cD
                    elif y == tas_y1+1 and abs(x-cx) in (1.5,2.5,2,1): img[y,x]=cL
    return outline(img)

def render_hands(seg, r):
    hands = seg["hands"]
    img = cel(hands, PAL["teal"])
    if not hands.any(): return img
    nL,nM,nD = PAL["nail"]; gL,gM,gD = PAL["gold"]
    lab, n = components(hands)
    nails = []
    for i in range(1, n+1):
        comp = lab == i
        pts = np.argwhere(comp)
        att = np.argwhere(comp & dilate(seg["sleeve"] | seg["torso"]))
        if len(att) == 0: att = pts[:1] if len(pts) else pts
        a = att.mean(0)
        d = np.linalg.norm(pts - a, axis=1)
        if len(pts) < 2: continue
        tip = pts[d.argmax()]
        dirv = tip - a; dirv = dirv/(np.linalg.norm(dirv)+1e-6)
        # poignet or rose
        for y,x in att[:2]: img[y,x] = gM
        # ongle : bout du doigt + 1 px d'ongle long au-delà
        img[tip[0],tip[1]] = nM
        ny, nx = int(round(tip[0]+dirv[0])), int(round(tip[1]+dirv[1]))
        if 0<=ny<FH and 0<=nx<FW and not hands[ny,nx]:
            img[ny,nx] = nL; nails.append((ny,nx))
        # 2e ongle (doigt voisin) si la main a la place
        perp = np.array([-dirv[1], dirv[0]])
        sy, sx = int(round(tip[0]+perp[0])), int(round(tip[1]+perp[1]))
        if 0<=sy<FH and 0<=sx<FW and hands[sy,sx]: img[sy,sx] = nD
    return outline(img, only_on=~seg["torso"] & ~seg["sleeve"])

# ---------------- driver ----------------
def process(anim, variant="base"):
    V = VARIANTS[variant]; SUF = V["suffix"]
    S = {f: load(f, anim) for f in ("NakedBody","Head7","Chest3","Chest9","Legs1","Hands3","Shoes1")}
    if S["NakedBody"] is None: return anim
    sheets = {k: np.zeros((FH*ROWS, FW*COLS, 4), np.uint8) for k in ("Head","Chest","Legs","Hands")}
    loop = anim in LOOP
    for r in range(ROWS):
        segs = [segment(S, r, c) for c in range(COLS)]
        hfs = [head_frame(s, r) for s in segs]
        valid = [h for h in hfs if h]
        if not valid: continue
        anchors = []; last = None
        for h in hfs:
            if h: last = anchor_of(h, r)
            anchors.append(last if last is not None else anchor_of(valid[0], r))
        chains = simulate(anchors, r, anim, loop)
        # mèches latérales (2 courtes chaînes, même inertie)
        fx, fy = FACE[r]
        lock_sets = []
        for c, h in enumerate(hfs):
            locks = []
            if h and fy > -0.3:
                sides = [-1, 1] if abs(fx) < 0.3 else [1 if fx > 0 else -1]
                lag = chains[c][3] - chains[c][0]
                for sd in sides:
                    if abs(fx) < 0.3: sx = h["x0"]-0.2 if sd < 0 else h["x1"]+1.2
                    else: sx = h["cx"] + sd*h["w"]*0.12
                    st = np.array([sx, h["y0"]+h["h"]*0.42])
                    pts=[st]
                    for k in range(4):
                        pts.append(pts[-1] + np.array([sd*0.15*(abs(fx)<0.3) + lag[0]*0.06*(k+1), 1.6]))
                    locks.append(np.array(pts))
            lock_sets.append(locks)
        # rebond secondaire : buste/hanches suivent le corps avec 1 frame de retard (±1 px)
        def lags(key):
            ys_ = [(bbox(s[key]) or (0,0,0,0))[1] for s in segs]
            out = []
            for c in range(COLS):
                pc = (c-1) % COLS if loop else max(0, c-1)
                out.append(int(np.clip(ys_[pc]-ys_[c], -1, 1)) if V["bounce"] else 0)
            return out
        tl, ll = lags("torso"), lags("legs")
        for c in range(COLS):
            s = segs[c]; ys, xs = r*FH, c*FW
            if not s["body"].any(): continue
            sheets["Head"][ys:ys+FH, xs:xs+FW] = render_head(s, r, hfs[c], chains[c], lock_sets[c])
            sheets["Chest"][ys:ys+FH, xs:xs+FW] = render_chest(s, r, V, tl[c])
            sheets["Legs"][ys:ys+FH, xs:xs+FW] = render_legs(s, r, V, ll[c])
            sheets["Hands"][ys:ys+FH, xs:xs+FW] = render_hands(s, r)
    for k, a in sheets.items():
        d = BASE/(k+SUF); d.mkdir(parents=True, exist_ok=True)
        Image.fromarray(a, "RGBA").save(d/f"{anim}.png", optimize=True)
    return anim

if __name__ == "__main__":
    args = sys.argv[1:]; variant = "base"
    if "--variant" in args:
        i = args.index("--variant"); variant = args[i+1]; del args[i:i+2]
    assert variant in VARIANTS, variant
    anims = args or ANIMS
    with ProcessPoolExecutor() as ex:
        for a in ex.map(process, anims, [variant]*len(anims)): print("ok", variant, a, flush=True)
