# image to petscii converter

online tool for creating a PETSCII representation of a custom image.  
drag drop your image to convert it.  
visualising the different stages of the conversion  

![screenshot](filename.png)  

```
[image]
  |
  | drag-drop gif|png|jpg|jpeg
  V
[original 320x200 reduced size]
  |
  |
  V
[palette adjusted]
  |
  |
  V
[dominant/sub-dominant 8x8]
  |
  |
  V
[petscii on dominant bg]
  |
  |
  V
[BASIC]
```

## master plan

- [x] preload reference image 0-255 16x16
- [x] read reference image
- [x] create reference map (via hidden canvas. or visible during dev? always visible?)
    linear array med true, false, ... 

- [x] DONE drag-drop image, get image data

- [x] DONE resize image to 320x200, centered

- [x] DONE put image on canvas

- [x] edit image palette
    - [x] read pixel data
    - [x] find nearest color  
    distance^2 = (R2-R1)^2 + (G2-G1)^2 + (B2-B1)^2  
    Do this for each pixel (yikes)

- [x] find dominant color

- [x] create 8x8 sub dominant on dominant

- [x] create linear array with subdom img pixels
subdomimg[i].data = [true, false, false, ..]
subdomimg[i].i = index to palette

- [x] find closest resemblance

- [ ] nudge dropped image 1px in either direction

- [ ] force dominant color

- [ ] download images for all stages

- [ ] `C=` svg loading animation before each stage

- [ ] lots of status info along the way

- [ ] double buffering + raf. Write stages to a internal canvas first.

- [x] respionsive width. under hverandre når width < 670

- [ ] bare bruk farger fra $palette i gui

- [ ] hide options on dragover


google sitt tannhjul (1220 chars)
```
<svg width="24" height="24" viewBox="0 0 24 24" focusable="false" class="Hdh4hc cIGbvc NMm5M"><path d="M13.85 22.25h-3.7c-.74 0-1.36-.54-1.45-1.27l-.27-1.89c-.27-.14-.53-.29-.79-.46l-1.8.72c-.7.26-1.47-.03-1.81-.65L2.2 15.53c-.35-.66-.2-1.44.36-1.88l1.53-1.19c-.01-.15-.02-.3-.02-.46 0-.15.01-.31.02-.46l-1.52-1.19c-.59-.45-.74-1.26-.37-1.88l1.85-3.19c.34-.62 1.11-.9 1.79-.63l1.81.73c.26-.17.52-.32.78-.46l.27-1.91c.09-.7.71-1.25 1.44-1.25h3.7c.74 0 1.36.54 1.45 1.27l.27 1.89c.27.14.53.29.79.46l1.8-.72c.71-.26 1.48.03 1.82.65l1.84 3.18c.36.66.2 1.44-.36 1.88l-1.52 1.19c.01.15.02.3.02.46s-.01.31-.02.46l1.52 1.19c.56.45.72 1.23.37 1.86l-1.86 3.22c-.34.62-1.11.9-1.8.63l-1.8-.72c-.26.17-.52.32-.78.46l-.27 1.91c-.1.68-.72 1.22-1.46 1.22zm-3.23-2h2.76l.37-2.55.53-.22c.44-.18.88-.44 1.34-.78l.45-.34 2.38.96 1.38-2.4-2.03-1.58.07-.56c.03-.26.06-.51.06-.78s-.03-.53-.06-.78l-.07-.56 2.03-1.58-1.39-2.4-2.39.96-.45-.35c-.42-.32-.87-.58-1.33-.77l-.52-.22-.37-2.55h-2.76l-.37 2.55-.53.21c-.44.19-.88.44-1.34.79l-.45.33-2.38-.95-1.39 2.39 2.03 1.58-.07.56a7 7 0 0 0-.06.79c0 .26.02.53.06.78l.07.56-2.03 1.58 1.38 2.4 2.39-.96.45.35c.43.33.86.58 1.33.77l.53.22.38 2.55z"></path><circle cx="12" cy="12" r="3.5"></circle></svg>
```

simen sitt tannhjul (752 chars)

html
```
<div class="testsvg"></div>
```
css
```
.testsvg{width:400px;height:400px;margin:0 auto;background-color:#222;background-image:url("data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><mask id=\"bar\" stroke=\"none\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"white\" /><circle cx=\"50\" cy=\"50\" r=\"14\" fill=\"black\" /></mask><g stroke=\"%23bbbbbb\" stroke-width=\"20\" fill=\"none\" mask=\"url(%23bar)\"><path d=\"M50,5 V95\" /><path d=\"M50,5 V95\" transform=\"rotate(60 50 50)\"/><path d=\"M50,5 V95\" transform=\"rotate(-60 50 50)\"/><circle stroke=\"none\" fill=\"%23bbbbbb\" cx=\"50\" cy=\"50\" r=\"33\" /></g></svg>");background-repeat:no-repeat;background-size:contain;background-position:center center}
```

svg stream
```
data:image/svg+xml;utf8,
<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
    <mask id=\"bar\" stroke=\"none\">
        <rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"white\" />
        <circle cx=\"50\" cy=\"50\" r=\"14\" fill=\"black\" />
    </mask>
    <g stroke=\"%23bbbbbb\" stroke-width=\"20\" fill=\"none\" mask=\"url(%23bar)\">
        <path d=\"M50,5 V95\" />
        <path d=\"M50,5 V95\" transform=\"rotate(60 50 50)\"/>
        <path d=\"M50,5 V95\" transform=\"rotate(-60 50 50)\"/>
        <circle stroke=\"none\" fill=\"%23bbbbbb\" cx=\"50\" cy=\"50\" r=\"33\" />
    </g>
</svg>
```