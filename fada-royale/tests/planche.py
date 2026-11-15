import json,sys
from PIL import Image, ImageDraw
d,skin=sys.argv[1],sys.argv[2]; sh=json.load(open(f'{d}/{skin}-sheets.json'))
rows=list(sh.items()); W,H=360,440; lw=150
img=Image.new('RGB',(lw+4*W,len(rows)*H),(20,14,8)); dr=ImageDraw.Draw(img)
for r,(name,files) in enumerate(rows):
    dr.text((6,r*H+10),name.replace('-','\n'),fill=(255,220,150))
    for c,f in enumerate(files): img.paste(Image.open(f).convert('RGB'),(lw+c*W,r*H))
img=img.resize((img.width//2,img.height//2)); img.save(f'{d}/{skin}-planche.png'); print(img.size)
