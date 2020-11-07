/* include zquery */
/* file:zquery.js */

//=require _*.js

// debug level, see _base.js:initEnv()
let debugLevel = null;
const animFrame = getRequestAnimationFrame();

const dom = {};
const state = {
    ctxA: null,
    ctxB: null,
    ctxC: null,
    ctxD: null,
    width: 0,
    height: 0,
    dx: 0,
    dy: 0,
};
const conf = {};
const ref = [];
let chunkImage = [];

// palette[i].r .g .b is calculated
const palette = [
    { num: 0,  hex: "#000000", name:"Black" },
    { num: 1,  hex: "#FFFFFF", name:"White" },
    { num: 2,  hex: "#880000", name:"Red" },
    { num: 3,  hex: "#AAFFEE", name:"Cyan" },
    { num: 4,  hex: "#CC44CC", name:"Violet/purple" },
    { num: 5,  hex: "#00CC55", name:"Green" },
    { num: 6,  hex: "#0000AA", name:"Blue" },
    { num: 7,  hex: "#EEEE77", name:"Yellow" },
    { num: 8,  hex: "#DD8855", name:"Orange" },
    { num: 9,  hex: "#664400", name:"Brown" },
    { num: 10, hex: "#FF7777", name:"Light" },
    { num: 11, hex: "#333333", name:"Dark grey" },
    { num: 12, hex: "#777777", name:"Grey" },
    { num: 13, hex: "#AAFF66", name:"Light green" },
    { num: 14, hex: "#0088FF", name:"Light blue" },
    { num: 15, hex: "#BBBBBB", name:"Light grey" },
];

// "221,136,85": {num: 8,r: 221,b: 85,g: 136,hex: "#DD8855",name: "Orange"}
const rgbLookup = {};

zz.loadReady(function(){

    initEnv();

    initDOM();
    initConf();
    initState();

    handleOptionsToggle();
    handleForceDominantColor();
    handleClipboard();

    createReferenceArray()
    preparePalette();
    handleDragDropImage(z(".droppable"), doStageA);
});

/*
    options
*/

function handleOptionsToggle() {
    z(".options-toggle").addEventListener("click", function(e){
        z(".options").toggleClass("active");
    });
}

function handleForceDominantColor() {
    z(".options .bgcolor li").each(function(i, el){
        el.addEventListener("click", function(){
            z(".options .bgcolor li").removeClass("active");
            z(".options .bgcolor li")[i].addClass("active");
            doStageC(i);
        })
    });
}


/*
    downloads
*/

function handleClipboard() {
    z("section.f pre").addEventListener("click", function(e){

        let range = document.createRange();
        range.selectNode(this);
        window.getSelection().removeAllRanges(); // clear current selection
        window.getSelection().addRange(range); // to select text
        document.execCommand("copy");
        //window.getSelection().removeAllRanges();// to deselect
    });
}

/*
    preparations
*/

/*
    createReferenceArray
    load reference charset file
    build an array representing each character
    ref[0] = [false, false, true, true, true, true, false, ...]
    true = pixel is set
    false = pixel is not set (background color)
*/
function createReferenceArray() {
    let img = document.createElement("IMG");
    let ctx = document.createElement("CANVAS").getContext("2d");
    img.addEventListener('load', function() {

        ctx.drawImage(this,0,0);

        // for each 8x8 chunk
        for(let y=0; y<16; y++) {
            for(let x=0; x<16; x++) {
                let d = ctx.getImageData(x*8, y*8, 8, 8).data;
                let char = [];

                for(let i=0; i<64; i++) {
                    char.push(d[i*4] != 0);
                }

                ref.push(char);
            }
        }
    }, false);
    img.src = 'assets/images/petscii_0-255_16x16.png'; // Set source path

}

/*
    preparePalette
    create rgb values from hex colors
*/
function preparePalette() {
    for(let i in palette) {
        let hex = palette[i].hex.substr(1);
        palette[i].r = parseInt(hex.substr(0,2),16);
        palette[i].g = parseInt(hex.substr(2,2),16);
        palette[i].b = parseInt(hex.substr(4,2),16);

        // adding color info to a reverse lokup table for convenience
        rgbLookup[`${palette[i].r},${palette[i].g},${palette[i].b}`] =
            palette[i];
    }
}


/*
    stages
*/

/*
    stage A
    resize original image to max 320x200
    place image centered on the canvas
*/
function doStageA() {
    clearCanvases();
    resizeImage(arguments[0]);

    let uri = z("section.a canvas").toDataURL("image/png");
    z("section.a a.dl").setAttribute("href", uri);
    z("section.a a.dl").setAttribute("download", state.filename + "_a_320x200.png");

    doStageB();
}
/*
    stage B
    convert to 16 color palette
*/
function doStageB() {
    applyPalette();

    let uri = z("section.b canvas").toDataURL("image/png");
    z("section.b a.dl").setAttribute("href", uri);
    z("section.b a.dl").setAttribute("download", state.filename + "_b_palette.png");

    doStageC();
}
/*
    stage C
    determine dominant color
    use dominant color as background color
*/
function doStageC(forcedDominantColorIndex) {
    applyDominantColor(forcedDominantColorIndex);

    let uri = z("section.c canvas").toDataURL("image/png");
    z("section.c a.dl").setAttribute("href", uri);
    z("section.c a.dl").setAttribute("download", state.filename + "_c_bgcolor.png");

    doStageD();
}
/*
    stage D
    for each 8x8 chunk, show the sub-dominant color on background
    all other colors are replaced with the background color
*/
function doStageD() {
    applySubDominantColor();

    let uri = z("section.d canvas").toDataURL("image/png");
    z("section.d a.dl").setAttribute("href", uri);
    z("section.d a.dl").setAttribute("download", state.filename + "_d_8x8chunk.png");

    doStageE();
}
/*
    stage E
    for each 8x8 chunk, find which PETSCII char looks most like said chunk
*/
function doStageE() {
    findNearestPetscii();

    let uri = z("section.e canvas").toDataURL("image/png");
    z("section.e a.dl").setAttribute("href", uri);
    z("section.e a.dl").setAttribute("download", state.filename + "_e_petscii.png");

    doStageF();
}
/*
    stage F
    create BASIC v2 listing
*/
function doStageF() {

    createBasic();
    let uri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(z("section.f pre").innerHTML);
    z("section.f a.dl").setAttribute("href", uri);
    z("section.f a.dl").setAttribute("download", state.filename + "_f_basic.txt");
}


/*
    clearCanvases
    yup. just that.
*/
function clearCanvases() {
    state.ctxA.fillStyle = "#000000";
    state.ctxA.fillRect(0, 0, 320, 200);
    state.ctxB.fillStyle = "#000000";
    state.ctxB.fillRect(0, 0, 320, 200);
    state.ctxC.fillStyle = "#000000";
    state.ctxC.fillRect(0, 0, 320, 200);
    state.ctxD.fillStyle = "#000000";
    state.ctxD.fillRect(0, 0, 320, 200);
    state.ctxE.fillStyle = "#000000";
    state.ctxE.fillRect(0, 0, 320, 200);
}

/*
    resizeImage
    take the original image
    resize it and place it in the center of the 320x200 canvas
*/
function resizeImage(droppedImage){
    // get original size of image
    let ow=droppedImage.width;
    let oh=droppedImage.height;

    // calculate size to fit inside 320x200
    state.width=320;
    state.height=Math.round(oh*320/ow);
    if (state.height > 200) {
        state.height = 200;
        state.width = Math.round(ow*200/oh);
    }

    // calculate offset to center image
    state.dx = state.width<320?Math.round((320-state.width)/2):0;
    state.dy = state.height<200?Math.round((200-state.height)/2):0;

    log(`original:${ow}x${oh} resized:${state.width}x${state.height} offset:${state.dx}x${state.dy}`);

    // put scaled image in first canvas
    state.ctxA.drawImage(droppedImage, 0, 0, ow, oh, state.dx, state.dy, state.width, state.height);

    z("section.a p span").innerHTML = `(${ow}x${oh})`;
}

function applyPalette() {

    // count how many times a color is used, to find the dominant color
    // reset color counters in palette
    for(let i in palette) {
        palette[i].count = 0;
    }

    for(let y=state.dy; y<state.dy+state.height; y++) {
        for(let x=state.dx; x<state.dx+state.width; x++) {
            let p = getNearestColor(state.ctxA.getImageData(x,y,1,1).data);
            state.ctxB.fillStyle = "rgba("+p[0]+","+p[1]+","+p[2]+","+p[3]+")";
            state.ctxB.fillRect(x,y,1,1);
        }
    }

    let numColors = 0;
    for(let i in palette) {
        if (palette[i].count > 0) {
            numColors++;
        }
    }
    z("section.b p span").innerHTML = `${numColors} colors used.`;

}

function getNearestColor(data) {

    // give a score to each of the 16 colors
    let score = Array(16).fill(0);

    for(let i in palette) {
        score[i] = Math.pow(palette[i].r - data[0], 2)
            + Math.pow(palette[i].g - data[1], 2)
            + Math.pow(palette[i].b - data[2], 2);
    }

    // pick the index with the lowest score (aka closest match)
    let col = 0;
    let min = Math.pow(255,2) * 3;
    for(let i in score) {
        if(score[i] < min) {
            min = score[i];
            col = i;
        }
    }

    // inc color counter for this color in the palette
    palette[col].count++;

    // return the new color
    data[0] = palette[col].r;
    data[1] = palette[col].g;
    data[2] = palette[col].b;

    return data;
}

function applyDominantColor(forcedDominantColorIndex) {
    // find the dominant color in image
    // this will be used as the background color

    // dominant color index can be overridden by param

    let index = false;

    if (forcedDominantColorIndex !== undefined) {
        index = forcedDominantColorIndex;        
    } else {
        // we have already counted the usage of each color
        // find the index with the highest count
        let max = -1;
        for(let i in palette) {
            if(palette[i].count > max) {
                max = palette[i].count;
                index = i;
            }
        }
    }

    state.dominantIndex = index;
    // update color indicator in options
    z(".options .bgcolor li").removeClass("active");
    z(".options .bgcolor li")[index].addClass("active");

    // clear canvas with dominant color
    state.ctxC.fillStyle = "rgb("
        + palette[index].r + ","
        + palette[index].g + ","
        + palette[index].b + ")";
    state.ctxC.fillRect(0, 0, 320, 200);

    // draw image
    for(let y=state.dy; y<state.dy+state.height; y++) {
        for(let x=state.dx; x<state.dx+state.width; x++) {
            // pixel info
            let p = state.ctxB.getImageData(x,y,1,1).data;
            let rgb = `${p[0]},${p[1]},${p[2]}`;

            state.ctxC.fillStyle = `rgba(${rgb},255)`;
            state.ctxC.fillRect(x,y,1,1);
        }
    }

    z("section.c p span").innerHTML = palette[index].name;
}

function applySubDominantColor() {
    // find sub-dominant color for each 8x8 chunk
    // this will be the character color

    // also update chunkImage to represent each 8x8 chunk in the image
    chunkImage = [];

    // for each 8x8 chunk of stage C
    for(let y=0; y<25; y++) {
        for(let x=0; x<40; x++) {

            let chunk = state.ctxC.getImageData(x*8, y*8, 8, 8);

            // count the colors being used
            // count the colors in the chunk. ignore dominant color
            let count = Array(16).fill(0);
            for(let i=0; i<256; i+=4) {
                let rgb = `${chunk.data[i]},${chunk.data[i + 1]},${chunk.data[i + 2]}`;
                if (rgbLookup[rgb].num != state.dominantIndex) {
                    count[rgbLookup[rgb].num] ++;
                }
            }

            // find the index with highest score
            // this is the sub-dominant color
            let max = 0;
            let subIndex = state.dominantIndex;
            let foundSub = false;
            for(let i in count) {
                if (count[i] > max) {
                    max = count[i];
                    subIndex = i;
                    foundSub = true;
                }
            }

            // subIndex now points to the subDominant color
            // or the dominant, if no other color is found

            // replace everything that is not sub-dominant with dominant
            let imageData = [];
            for(let i=0; i<256; i+=4) {
                // pixel data
                let rgb = `${chunk.data[i]},${chunk.data[i + 1]},${chunk.data[i + 2]}`;

                // set pixel data to dominant color if it is not dubDominant
                if(foundSub && rgbLookup[rgb].num == subIndex) {
                    // leave pixel as is
                    imageData.push(true);
                } else {
                    // draw dominant color
                    chunk.data[i] = palette[state.dominantIndex].r;
                    chunk.data[i+1] = palette[state.dominantIndex].g;
                    chunk.data[i+2] = palette[state.dominantIndex].b;
                    imageData.push(false);
                }
            }

            chunkImage.push({data:imageData, i:subIndex});

            // paint chunk on canvas
            state.ctxD.putImageData(chunk, x*8, y*8);
        }
    }
}

function findNearestPetscii() {
    state.pokes = [];

    // for each chunk in chunkImage
    for(let i in chunkImage) {
        // chunkImage[i].data = array(64) true|false
        // chunkImage[i].i = index to subdominant color

        // get a score for each chunk in the reference
        // keep the highest score + index along the way
        let maxScore = -1;
        let index = -1;

        for(let ch in ref) {
            let score = 0; // score for this reference character
            for(let px in ref[ch]) {
                if(ref[ch][px] === chunkImage[i].data[px]) {
                    score++;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                index = ch;
                if(maxScore == 64) {
                    break;
                }
            }
        }

        // chunk looks like ref[index] with maxScore
        state.pokes.push(index);
        state.pokes.push(chunkImage[i].i);

        // draw closest match on canvas, in sub-dominant color
        let chunk = new ImageData(8,8);
        for(let c=0; c<64; c++) {
            chunk.data[c*4] = ref[index][c]?palette[chunkImage[i].i].r:palette[state.dominantIndex].r;
            chunk.data[c*4+1] = ref[index][c]?palette[chunkImage[i].i].g:palette[state.dominantIndex].g;
            chunk.data[c*4+2] = ref[index][c]?palette[chunkImage[i].i].b:palette[state.dominantIndex].b;
            chunk.data[c*4+3] = 255;
        }
        let y = Math.floor(parseInt(i)/40)*8;
        let x = (parseInt(i)%40)*8;
        state.ctxE.putImageData(chunk, x, y);
    }
}

function createBasic() {
    let str =
`10 poke53280,${state.dominantIndex}:poke53281,${state.dominantIndex}:print chr$(147);
20 for i=0 to ${state.pokes.length/2 - 1}
30 read s: read c: poke 1024+i,s: poke 55296+i,c
40 next i
50 goto 50`;

    let line = 100;
    for(let i=0; i<state.pokes.length; i++) {
        if(i%20 == 0) {
            str += `\n${line++} data `;
        }
        str += state.pokes[i];
        if(i%20 < 19 && i<state.pokes.length - 1) {
            str += ",";
        }
    }

    z("section.f pre").innerHTML = str;
}









function handleDragDropImage(el, callback) {
    el.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        el.addClass('dragover');
        z(".options").removeClass("active");
    });

    el.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        el.removeClass('dragover');
    });

    el.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        el.removeClass('dragover');

        // handle file upload
        let image;
        if(e.dataTransfer) {
            image = e.dataTransfer.files[0];
        } else if(e.target) {
            image = e.target.files[0];
        }

        let tempImage = document.createElement("IMG");
        tempImage.onload = function(e){
            callback(tempImage);
        }

        let reader = new FileReader();
        reader.onload = function (e) {
            // reader.onload doesn't know the width/height of the image
            // so we need to add it as src to a temp image
            // and trigger onload on that
            tempImage.src = e.target.result;
            state.filename = image.name.replace(/\.[^\.]+$/, "");
        }

        // only proceed if image
        if (/^image\/[(jpeg)|(png)|(gif)]/.test(image.type)) {
            reader.readAsDataURL(image);
        }
    });

}

function initDOM(){}
function initConf(){}
function initState(){
    state.ctxA = z("section.a canvas").getContext("2d");
    state.ctxB = z("section.b canvas").getContext("2d");
    state.ctxC = z("section.c canvas").getContext("2d");
    state.ctxD = z("section.d canvas").getContext("2d");
    state.ctxE = z("section.e canvas").getContext("2d");
}

function getRequestAnimationFrame() {
    return window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame;
}

