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

zz.loadReady(function(){

    initEnv();

    initDOM();
    initConf();
    initState();

    preparePalette();

    handleDragDropImage(z(".droppable"), doStuff);

    /*
    */
});

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
    clearCanvases();

    resizeImage(arguments[0]);
    applyPalette();

    applyDominantSubdominant();
    // findNearestPetscii
    // createBasic
}

function applyDominantSubdominant() {
    // find the dominant color in image
    // this will be used as the background color

    let colorCount = {};

    for(let y=state.dy; y<state.dy+state.height; y++) {
        for(let x=state.dx; x<state.dx+state.width; x++) {
            let p = state.ctxB.getImageData(x,y,1,1).data;
            let key = p[0]+"-"+p[1]+"-"+p[2];
            if(!colorCount[key]) {
                colorCount[key] = 0;
            }
            colorCount[key]++;
        }
    }

    let key = false;
    let score = 0;
    for(let k in colorCount) {
        if(colorCount[k] > score) {
            score = colorCount[k];
            key = k;
        }
    }

    log(colorCount);
    log(key + " has " + colorCount[key] + " colors");

    let col = key.split("-");

    state.ctxC.fillStyle = "rgb("+col[0]+","+col[1]+","+col[2]+")";
    state.ctxC.fillRect(0, 0, 320, 200);

    // TODO tell farger når man finner ut nærmeste farge
    // bedre måte å finne tilbake til fargekode, når det skal lages basic
    for(let y=state.dy; y<state.dy+state.height; y++) {
        for(let x=state.dx; x<state.dx+state.width; x++) {
            let p = state.ctxB.getImageData(x,y,1,1).data;
            state.ctxC.fillStyle = "rgba("+p[0]+","+p[1]+","+p[2]+","+p[3]+")";
            state.ctxC.fillRect(x,y,1,1);
        }
    }


    // find sub-dominant color for each 8x8 chunk
    // this will be the character color
}


function applyPalette() {

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
    let score = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

    for(let i in palette) {
        score[i] = Math.pow(palette[i].r - data[0], 2)
            + Math.pow(palette[i].g - data[1], 2)
            + Math.pow(palette[i].b - data[2], 2);
    }

    // pick the index with the lowest score
    let col = 0;
    let min = Math.pow(255,2) * 3;
    for(let i in score) {
        if(score[i] < min) {
            min = score[i];
            col = i;
        }
    }

    // use the new colors
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

