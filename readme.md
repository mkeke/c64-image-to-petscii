# image to petscii converter

online tool for creating a PETSCII representation of a custom image.  
drag drop your image to convert it.  
visualising the different stages of the conversion  

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

- [x] DONE drag-drop image, get image data

- [x] DONE resize image to 320x200, centered

- [x] DONE put image on canvas

- [x] edit image palette
    - [x] read pixel data
    - [x] find nearest color  
    distance^2 = (R2-R1)^2 + (G2-G1)^2 + (B2-B1)^2  
    Do this for each pixel (yikes)

- [x] find dominant color

- [ ] create 8x8 sub dominant on dominant

- [ ] read reference image

- [ ] create reference map

- [ ] preload reference image 0-255 16x16

- [ ] nudge dropped image 1px in either direction

