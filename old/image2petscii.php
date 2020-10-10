<?php
/*
    usage:
      $ php image2char.php <source_image.jpg> [dest_image.png]

    convert any image to c64 petscii
    reduce image size if necessary, keeping ratio
    keep image size max 40*8 x 24*8 px
    snap to closest color in c64 palette

    save dest as png (dest.png)
    save dest as txt (dest.txt)

    Simen Lysebo, 2018-06-18
*/

$config = array(
    "colors" => [
        "000000",
        "ffffff",
        "882000",
        "68d0a8",
        "a838a0",
        "50b818",
        "181090",
        "f0e858",
        "a04800",
        "472b1b",
        "c87870",
        "484848",
        "808080",
        "98ff98",
        "5090d0",
        "b8b8b8" 
    ],

    "color_names" => [
        "black", 
        "white", 
        "red", 
        "cyan", 
        "purple", 
        "green", 
        "blue", 
        "yellow", 
        "orange", 
        "brown", 
        "pink", 
        "darkgrey", 
        "grey", 
        "lightgreen", 
        "lightblue", 
        "lightgrey", 
    ],

    "reference_image_filename" => "petscii_0-255_16x16.png",
);


/*
    check prerequisites
*/
if (!is_file($config["reference_image_filename"])) {
    die ("  reference file (".$config["reference_image_filename"].") not found\n");
}

if (count($argv) < 2) {
    die ("  params: <source_filename>\n");
}

$source_filename = strtolower($argv[1]);

if (!is_file($source_filename)) {
    die ("  source file not found: '".$argv[1]."'\n");
}

if (!preg_match('/\.(png|jpg|jpeg|gif|bmp)?$/', $source_filename, $matches)) {
    die ("  source file must be an image.\n");
}

$str = "Converting " . $source_filename . " to PETSCII";
echo $str . "\n" . str_repeat("-", strlen($str)) . "\n";

/*
  Load source image
*/
echo "  loading source image\n";
$source_image = '';
switch($matches[1]) {
    case 'jpg':
    case 'jpeg':
        $source_image = imagecreatefromjpeg($source_filename);
        break;
    case 'png':
        $source_image = imagecreatefrompng($source_filename);
        break;
    case 'gif':
        $source_image = imagecreatefromgif($source_filename);
        break;
    case 'bmp':
        $source_image = imagecreatefromwbmp($source_filename);
        break;
}

if ($source_image == '') {
  die ("  what is this sorcery? unable to determine source image type\n");
}


/*
    resize source_image to correct width x height
*/
$width = 0;
$height = 0;
$ratio = 320/200;
$resize = false;
$source_width = imagesx($source_image);
$source_height = imagesy($source_image);
$source_ratio = $source_width / $source_height;

if ($source_ratio > $ratio) {
    // width is largest
    $width = 320;
    $height = round($width / $source_ratio);
} else {
    // height is largest
    $height = 200;
    $width = round($height * $source_ratio);
}

echo "  resizing from " . $source_width . "x" . $source_height . " to " . $width . "x" . $height . "\n";
$source_image = imagescale($source_image, $width, $height);
imagepng($source_image, "convert_stage_01.png");


/*
    enforce the correct palette
*/
echo "  generating color palette\n";
$palette = imagecreate(16,1);
$x = 0;
foreach ($config["colors"] as $col) {
    $r = substr($col, 0, 2);
    $g = substr($col, 2, 2);
    $b = substr($col, 4, 2);
    $c = imagecolorallocate($palette, hexdec($r), hexdec($g), hexdec($b));
    imagesetpixel($palette, $x++, 0, $c);
}

echo "  adjusting image to color palette\n";
$dest_image = imagecreate($width, $height);
imagepalettecopy($dest_image, $palette);
imagecopy($dest_image, $source_image, 0, 0, 0, 0, $width, $height);
imagepalettecopy($dest_image, $palette);
imagepng($dest_image, "convert_stage_02.png");

/*
    determine the dominant color (background color)
*/
echo "  determining dominant color\n";
$color_score = array();
for($i=0; $i<count($config["colors"]); $i++){
    $color_score[] = 0;
}
for($x=0; $x<$width; $x++) {
    for($y=0; $y<$height; $y++) {
        $color_score[imagecolorat($dest_image, $x, $y)] ++ ;
    }
}
$dominant_color_index = 0;
for($i=0; $i<count($color_score); $i++) {
    if ($color_score[$i] > $color_score[$dominant_color_index]) {
        $dominant_color_index = $i;
    }
}

echo "  dominant color is $dominant_color_index (". $config["color_names"][$dominant_color_index].")\n";

/*
    center image horizontally on a 320x200 image with correct background color
*/
$centered_image = imagecreate(320, 200);
imagepalettecopy($centered_image, $palette);
imagefilledrectangle($centered_image, 0, 0, 320, 200, $dominant_color_index);
imagecopy($centered_image, $dest_image, floor((320-$width)/2), 0, 0, 0, $width, $height);
$dest_image = $centered_image;

/*
    create reference map
*/
$reference_map = createReferenceMap($config["reference_image_filename"]);
echo "  created reference map with " . count($reference_map) . " characters\n";

/*
    create image with 8x8 chunks of sub dominant color on a dominant color background
*/
$dest_map = createSubDominantMap($dest_image, $dominant_color_index);

/*
    AND NOW!
    foreach chunk in $dest_map, find the most similar entry in $reference_map
    return character index
    draw character to bitmap in the desired color

    $dest_map[] = { color: int, map: string(8x8) }
    $reference_map[] = string(8x8)
*/

$width = 320;
$height = 200;
$dest_image = imagecreate($width, $height);
imagepalettecopy($dest_image, $palette);
imagefilledrectangle($dest_image, 0, 0, $width, $height, $dominant_color_index);
imagefilledrectangle($dest_image, 0, 0, $width, $height, $dominant_color_index);

$char_width = ceil($width / 8);
$char_height = ceil($height / 8);
echo "  $char_width" . "x" . $char_height . " = " . count($dest_map) . " chars\n";

echo "  generating petscii image\n";

$basic = "1 poke53280," . $dominant_color_index . "\n";
$basic .= "2 poke53281," . $dominant_color_index . "\n";
$basic .= '3 print chr$(147)' . "\n";

$basic .= "10 for i=0 to " . (count($dest_map)-1) . "\n";
$basic .= "11 read s" . "\n";
$basic .= "12 read c" . "\n";
$basic .= "13 poke 1024+i,s" . "\n";
$basic .= "14 poke 55296+i,c" . "\n";
$basic .= "15 next" . "\n";
$basic .= "16 goto 16";

$line_num = 100;
$line_str = $line_num . " data ";
$comma = false;

for($i=0; $i<count($dest_map); $i++) {
    $startx = ($i%$char_width)*8;
    $starty = (floor($i/$char_width))*8;

    $char_index = determineClosestResemblance($dest_map[$i]["map"], $reference_map);
    for($c=0; $c<strlen($reference_map[$char_index]); $c++) {
        if(substr($reference_map[$char_index], $c, 1) == "1") {
            $px = ($c%8) + $startx;
            $py = floor($c/8) + $starty;
            imagesetpixel($dest_image, $px, $py, $dest_map[$i]["color"]);
        }
    }

    if (strlen($line_str) > 70 ) {
        $basic .= "\n" . $line_str;
        $line_num++;
        $line_str = $line_num . " data ";
        $comma = false;
    }

    if ($comma) {
        $line_str .= ",";
    } else {
        $comma = true;
    }

    $line_str .= $char_index . "," . $dest_map[$i]["color"];

    // TODO fill the rest of the line
    
    // $dest_map[$i]["color"]

    // draw char_index on dest_image using the correct color
    // imagesetpixel($dest_image, x, y, color)

    //    add poke char + color to result array
}

$basic .= "\n" . $line_str;
echo "$basic\n";

imagepng($dest_image, "convert_stage_04.png");



// output poke sequence + color
// save resized palette-fixed image
// save example of final petscii output

die("\ndone\n");

function determineClosestResemblance($chunk, $reference_map) {
    $max_score = -1;
    $index = -1;
    for($i=0; $i<count($reference_map); $i++) {
        $score = 0;
        for($c=0; $c<strlen($chunk); $c++) {
            if (substr($chunk, $c, 1) == substr($reference_map[$i], $c, 1)) {
                $score++;
            } else {
                $score--;
            }
        }
        if ($score > $max_score) {
            $max_score = $score;
            $index = $i;
        }
        if ($max_score == 64) {
            break;
        }
    }
    // echo $chunk . " <==> " . $reference_map[$index] . "   (" . $max_score . ")\n";
    // printMatch($chunk, $reference_map[$index], $max_score, $index);
    return $index;
}

function printMatch($a, $b, $score, $index) {
    for($y=0; $y<8; $y++) {
        echo "'";
        for($ax=0; $ax<8; $ax++) {
            echo substr($a,$y*8+$ax,1) == "1" ? "X" : " ";
        }
        echo "'";
        echo " " . ($y==3?"<==>":"    ") . " ";
        echo "'";
        for($bx=0; $bx<8; $bx++) {
            echo substr($b,$y*8+$bx,1) == "1" ? "X" : " ";
        }
        echo "'";
        if ($y < 7) {
            echo "\n";
        }
    }
    echo "    " . $score . " points, index " . $index . "\n";
    echo str_repeat("-", 26) . "\n";
    /*
    for($i=0; $i<strlen($a); $i++) {
        echo substr($a,$i,1) == "1" ? "X" : " ";
    }
    echo "\n";
    for($i=0; $i<strlen($b); $i++) {
        echo substr($b,$i,1) == "1" ? "X" : " ";
    }
    echo "  " . $score . " (index ".$index.")\n";
    echo str_repeat("-", strlen($a)) . "\n";
    */
}

function createSubDominantMap($image, $dominant_color_index) {
    // foreach chunk
    //      find sub dominant color index
    //      replace everything else with dominant color index
    $map = array();

    $w = imagesx($image);
    $h = imagesy($image);

    for($y=0; $y<$h; $y+=8) {
        for($x=0; $x<$w; $x+=8) {

            // find sub dominant color in 8x8 chunk
            $color_score = array_fill(0, 16, 0);
            $found_sub = false;
            for($cy=$y; $cy<$y+8 && $cy<$h; $cy++) {
                for($cx=$x; $cx<$x+8 && $cx<$w; $cx++) {
                    $i = imagecolorat($image, $cx, $cy);
                    if ($i != $dominant_color_index) {
                        $color_score[$i] ++;
                        $found_sub = true;
                    }

                }
            }

            $str = '';
            $sub_dominant_color_index = $dominant_color_index;
            if (!$found_sub) {
                $str = str_repeat('0', 8*8);
            } else {
                $sub_dominant_color_index = ($dominant_color_index + 1)%16;
                for($i=0; $i<count($color_score); $i++) {
                    if($i != $dominant_color_index && $color_score[$i] > -1) {
                        if($color_score[$i] > $color_score[$sub_dominant_color_index]) {
                            $sub_dominant_color_index = $i;
                        }
                    } 
                }
                // replace pixels that are not sub dominant, resulting in dominant + sub dominant
                // create string representation of chunk
                for($cy=$y; $cy<$y+8 && $cy<$h; $cy++) {
                    for($cx=$x; $cx<$x+8 && $cx<$w; $cx++) {
                        if (imagecolorat($image, $cx, $cy) != $sub_dominant_color_index) {
                            imagesetpixel($image, $cx, $cy, $dominant_color_index);
                            $str .= '0';
                        } else {
                            $str .= '1';
                        }
                    }
                    // fill
                    if ($cx < $x+8) {
                        $str .= str_repeat('0', $x+8-$cx);            
                    }
                }

            }

            $map[] = array("color"=>$sub_dominant_color_index, "map"=>$str);
        }
    }

    imagepng($image, "convert_stage_03.png");
    return $map;
}


/*
    createReferenceMap
    load reference file characters.png
    create map for each character
       poke_num => binary representation of pixels
*/
function createReferenceMap($reference_image_filename) {
    $map = array();

    /*
        load reference image (128x128px character map with 16x16 characters)
        create binary stream of each char
    */
    $reference_image = imagecreatefrompng($reference_image_filename);

    echo "  loaded $reference_image_filename (" . imagesx($reference_image) . "x" . imagesy($reference_image) . ")\n";

    for($y=0; $y<16; $y++) {
        for($x=0; $x<16; $x++) {
            $map[] = createCharSequence($x, $y, $reference_image);
        }
    }

    return $map;
}

function createCharSequence($startx, $starty, $reference_image) {
    $mapValue = "";
    $startx *= 8;
    $starty *= 8;
    for ($y=$starty; $y<$starty+8; $y++) {
        for ($x=$startx; $x<$startx+8; $x++) {
            $v = imagecolorat($reference_image, $x, $y);
            $mapValue .= $v==0?'0':'1';
        }
    }
    return $mapValue;
}

/*
    =======================================
    old but gold code below :-D
    =======================================
*/

/*
  determine background color (param?)
  for each 8x8 chunk of the image
    find dominant color (excluding background color)
    find best match compared to petscii table

  finding best match:
    align pixels in each char on a single line
    align pixels in chunk on a single line
    pick the char giving the most accurate similarity
*/


/*
  Resize if source is too large in either direction
*/

echo "  source image is $width"."x".$height."\n";


$reference_map = [];

for($i=0; $i<count($reference_map); $i++) {
  echo $i . " : " . $reference_map[$i] . "\n";
}

// associate the correct petscii number
// var_dump($reference_map);


function printChar($startx, $starty, $reference_image){
  $startx *= 17;
  $starty *= 17;
  for ($y=$starty; $y<$starty+16; $y+=2) {
      for ($x=$startx; $x<$startx+16; $x+=2) {
          $v = imagecolorat($reference_image, $x, $y);
          if ($v == 0) { echo '  '; } else { echo "X "; }
          // echo $v . " "; //dechex($v);
      }
      echo "\n";
  }
  echo "----------------\n";

}

die("\n");
$maxwidth = 8*40;
$maxheight = 8*24;

if ($width > $maxwidth || $height > 128) {
  $resize = true;
  if ($width > $height) {
    $ratio = 128 / $width;
  } else {
    $ratio = 128 / $height;
  }
  $width = round($width * $ratio);
  $height = round($height * $ratio);
}

if ($resize) {
  echo "  resizing to $width"."x"."$height.\n";
  $source_image = imagescale($source_image, $width, $height);
}

/*
  Create palette with pico-8 colors
*/

echo "  generating palette\n";
$colors = array(
    "black"       => "000000",
    "dark-blue"   => "1D2B53",
    "dark-purple" => "7E2553",
    "dark-green"  => "008751",
    "brown"       => "AB5236",
    "dark-gray"   => "5F574F",
    "light-gray"  => "C2C3C7",
    "white"       => "FFF1E8",
    "red"         => "FF004D",
    "orange"      => "FFA300",
    "yellow"      => "FFEC27",
    "green"       => "00E436",
    "blue"        => "29ADFF",
    "indigo"      => "83769C",
    "pink"        => "FF77A8",
    "peach"       => "FFCCAA",
);

$palette = imagecreate(16,1);
$x = 0;
foreach ($colors as $col) {
    $r = substr($col, 0, 2);
    $g = substr($col, 2, 2);
    $b = substr($col, 4, 2);
    $c = imagecolorallocate($palette, hexdec($r), hexdec($g), hexdec($b));
    imagesetpixel($palette, $x++, 0, $c);
}

/*
  Force palette on source image
*/
echo "  adjusting image to palette\n";
$dest_image = imagecreate($width, $height);
imagepalettecopy($dest_image, $palette);
imagecopy($dest_image, $source_image, 0, 0, 0, 0, $width, $height);
imagepalettecopy($dest_image, $palette);

/*
  Save dest image if argv[2] present and file does not exist
*/
if (count($argv) > 2 && $argv[2] != '') {
  $dest_filename = $argv[2];
  if (!preg_match('/\.png$/', $dest_filename)) {
    $dest_filename .= '.png';
  }  
  if (is_file($dest_filename)) {
    echo "  NOTICE: won't save - dest file '$dest_filename' aready exists\n";
  } else {
    echo "  saving file '$dest_filename'\n";
    imagepng($dest_image, $argv[2] . ".png");
  }
}

/*
  Determine left and right padding for mem output
*/
$left_padding = 0;
$right_padding = 0;
if ($width < 128) {
    echo "  centering image\n";
    $left_padding = round((128 - $width)/2);
    $right_padding = 128 - $width - $left_padding;
}

/*
  Printing out hex dump for the __gfx__ section
*/
echo "  generating pico-8 __gfx__\n\n";
for ($y=0; $y<$height; $y++) {
    echo str_repeat(dechex(imagecolorat($dest_image, 0, $y)), $left_padding);
    for ($x=0; $x<$width; $x++) {
        $v = imagecolorat($dest_image, $x, $y);
        echo dechex($v);
    }
    echo str_repeat(dechex(imagecolorat($dest_image, $width-1, $y)), $right_padding);
    echo "\n";
}

/*
  Some user friendly addendum
*/
echo "\n";
echo "  paste $height lines to __gfx__ (mem addr 0x0)\n";
echo "  memcpy(0x6000, 0x0, " . $width . "*" . $height . "/2)\n";

echo "\nDONE!\n";
