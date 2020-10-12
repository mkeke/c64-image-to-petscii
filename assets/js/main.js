/* include zquery */
/* file:zquery.js */

//=require _*.js

// debug level, see _base.js:initEnv()
let debugLevel = null;

const dom = {};
const state = {};
const conf = {};

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

function doStuff() {
    resizeImage(arguments[0]);
    applyPalette();
    // applyDominantSubdominant()
    // findNearestPetscii
    // createBasic
}

function applyPalette() {

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
    let rw=320;
    let rh=Math.round(oh*320/ow);
    if (rh > 200) {
        rh = 200;
        rw = Math.round(ow*200/oh);
    }

    // calculate offset to center image
    let dx = rw<320?(320-rw)/2:0;
    let dy = rh<200?(200-rh)/2:0;

    log(`o=${ow}x${oh} r=${rw}x${rh} dx=${dx} dy=${dy}`);

    // put scaled image in first canvas
    let ctx = z("section.a canvas").getContext("2d");
    ctx.drawImage(droppedImage, 0, 0, ow, oh, dx, dy, rw, rh);

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
function initState(){}
function initConf(){}
