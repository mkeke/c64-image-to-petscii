/* include zquery */
/* file:zquery.js */

//=require _*.js

// debug level, see _base.js:initEnv()
let debugLevel = null;

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
const raf = getRequestAnimationFrame();

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
    { num: 11, hex: "#333333", name:"Dark grey 1" },
    { num: 12, hex: "#777777", name:"Grey 2" },
    { num: 13, hex: "#AAFF66", name:"Light green" },
    { num: 14, hex: "#0088FF", name:"Light blue" },
    { num: 15, hex: "#BBBBBB", name:"Light grey 3" },
];
const rgbLookup = {};

zz.loadReady(function(){

    initEnv();

    initDOM();
    initConf();
    initState();

    createReferenceMap()
    preparePalette();
    handleDragDropImage(z(".droppable"), doStuff);


});

/*
    createReferenceMap
    load reference file
    build a map of each character
*/
function createReferenceMap() {
    // var img = new Image();   // Create new img element

    var img = document.createElement("IMG");
    var ctx = document.createElement("CANVAS").getContext("2d");
    img.addEventListener('load', function() {

        ctx.drawImage(this,0,0);

        // for each 8x8 chunk
        for(let y=0; y<16; y++) {
            for(let x=0; x<16; x++) {
                let c = ctx.getImageData(x*8, y*8, 8, 8).data;
                let str = "";
                for(let i=0; i<64; i++) {
                    if(c[i*4] == 0) { str += " "; } else { str += "X"; }
                    if (i%8 == 7) { str += "\n"; }
                }
                log(str);
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

function doStuff() {
    // TODO request animation frame for each step?

    clearCanvases();

    resizeImage(arguments[0]);

    applyPalette();

    applyDominantColor();

    applySubDominantColor();

    // findNearestPetscii
    // createBasic
}

function applySubDominantColor() {
    // find sub-dominant color for each 8x8 chunk
    // this will be the character color
    for(let y=0; y<25; y++) {
        for(let x=0; x<40; x++) {

            let count = Array(16).fill(0);
            let chunk = state.ctxC.getImageData(x*8, y*8, 8, 8);

            // count the colors in the chunk. ignore dominant color
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
            for(let i in count) {
                if (count[i] > max) {
                    max = count[i];
                    subIndex = i;
                }
            }

            // replace everything that is not sub-dominant with dominant
            for(let i=0; i<256; i+=4) {
                let rgb = `${chunk.data[i]},${chunk.data[i + 1]},${chunk.data[i + 2]}`;
                if (rgbLookup[rgb].num != subIndex) {                   
                    chunk.data[i] = palette[state.dominantIndex].r;
                    chunk.data[i+1] = palette[state.dominantIndex].g;
                    chunk.data[i+2] = palette[state.dominantIndex].b;
                }
            }

            // paint chunk on canvas
            state.ctxD.putImageData(chunk, x*8, y*8);
        }
    }
}



function applyDominantColor() {
    // find the dominant color in image
    // this will be used as the background color

    let max = 0;
    let index = false
    for(let i in palette) {
        if(palette[i].count > max) {
            max = palette[i].count;
            index = i;
        }
    }

    state.dominantIndex = index;

    log(palette[index].name + " has " + palette[index].count + " colors");

    // clear canvas with dominant color
    state.ctxC.fillStyle = "rgb("
        + palette[index].r + ","
        + palette[index].g + ","
        + palette[index].b + ")";
    state.ctxC.fillRect(0, 0, 320, 200);

    for(let y=state.dy; y<state.dy+state.height; y++) {
        for(let x=state.dx; x<state.dx+state.width; x++) {
            let p = state.ctxB.getImageData(x,y,1,1).data;
            state.ctxC.fillStyle = "rgba("+p[0]+","+p[1]+","+p[2]+","+p[3]+")";
            state.ctxC.fillRect(x,y,1,1);
        }
    }
}


function applyPalette() {

    // reset color counters in palette
    for(let i in palette) {
        palette[i].count = 1;
    }

    for(let y=state.dy; y<state.dy+state.height; y++) {
        for(let x=state.dx; x<state.dx+state.width; x++) {
            let p = getNearestColor(state.ctxA.getImageData(x,y,1,1).data);
            state.ctxB.fillStyle = "rgba("+p[0]+","+p[1]+","+p[2]+","+p[3]+")";
            state.ctxB.fillRect(x,y,1,1);
        }
    }
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

}

function handleDragDropImage(el, callback) {
    el.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        el.addClass('dragover');
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
        }

        // only proceed if image
        if (/^image\/[(jpeg)|(png)|(gif)]/.test(image.type)) {
            reader.readAsDataURL(image);
        }
    });

}

function initDOM(){}
function initState(){
    state.ctxA = z("section.a canvas").getContext("2d");
    state.ctxB = z("section.b canvas").getContext("2d");
    state.ctxC = z("section.c canvas").getContext("2d");
    state.ctxD = z("section.d canvas").getContext("2d");
    state.ctxE = z("section.e canvas").getContext("2d");
}
function initConf(){}

function getRequestAnimationFrame() {
    return window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame;
}

