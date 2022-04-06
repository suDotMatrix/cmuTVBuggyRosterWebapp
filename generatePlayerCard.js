const nodeHtmlToImage = require('node-html-to-image')
var mkdirp = require('mkdirp');
var path = require('path');

// If temp directory dosen't already exist create it now 

const http = require('http'); // or 'https' for https:// URLs
const https = require('https'); // or 'https' for https:// URLs

const fs = require('fs');

const faceapi = require('face-api.js')
const canvas = require('canvas');
const convert_heic = require('heic-convert');
const sharp = require('sharp');

//const { image } = require('@tensorflow/tfjs-node');

// Node JS 
const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })


const TEMP_FOLDER_PATH  = path.join("temporary");
const TEMP_FOLDER_PATH_WEBAPP  = path.join("client_webapp","temporary");

const TEMP_FOLDER_FACEMODELS_PATH = path.join(TEMP_FOLDER_PATH, "FaceModels");
const TEMP_FOLDER_PHOTOS_PATH = path.join(TEMP_FOLDER_PATH, "photos");
// Where the originals are downloaded. These are only used when the file is downloaded from google drive. They are not checked
const TEMP_FOLDER_PHOTOS_ORIGINALS_PATH = path.join(TEMP_FOLDER_PATH, "photos","originals");
// Where the photos are stored once they are converted to png. These files are checked when seeing if a player photo has been downloaded
const TEMP_FOLDER_PHOTOS_CONVERTED_PATH = path.join(TEMP_FOLDER_PATH, "photos","originals");

const TEMP_FOLDER_PHOTOS_CROPPED = path.join(TEMP_FOLDER_PATH, "photos","croped");
const TEMP_FOLDER_PLAYER_CARDS_PATH = path.join(TEMP_FOLDER_PATH, "photos","cards");

// Unit test
if (require.main === module) {
    console.log('called directly');
    downloadAndCacheResourceFromURL("temp/cats/", "cat.jpeg", "http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg");
    loadFaceAPIModels()
    nodeHtmlToImage({
        output: './image.png',
        html: '<html><body>Hello world!</body></html>'
    })
        .then(() => console.log('The image was created successfully!'))

} else {
    console.log('required as a module');
}


function setupTemporaryDirectoriesAndFaceAPI(){
    
    if(!fs.existsSync(TEMP_FOLDER_PATH)){
        console.log("Creating temporary folder")
        fs.mkdirSync(TEMP_FOLDER_PATH);
    }
    
    if(!fs.existsSync(TEMP_FOLDER_PATH_WEBAPP)){
    // Setup Symlink so folder is acsessible by web-app 
    console.log("Creating symlink in client_webapp/temporary -> temporary folder");
    fs.symlinkSync(path.join(process.cwd(),TEMP_FOLDER_PATH),TEMP_FOLDER_PATH_WEBAPP,'dir');
    }
    
    if(!fs.existsSync(TEMP_FOLDER_FACEMODELS_PATH)){
        console.log("Creating temporary folder for FaceModels")
        fs.mkdirSync(TEMP_FOLDER_FACEMODELS_PATH);
    }

    if(!fs.existsSync(TEMP_FOLDER_PHOTOS_PATH)){
        console.log("Creating temporary folder for Photos")
        fs.mkdirSync(TEMP_FOLDER_PHOTOS_PATH);
    }

    if(!fs.existsSync(TEMP_FOLDER_PLAYER_CARDS_PATH)){
        console.log("Creating temporary folder for Cards")
        fs.mkdirSync(TEMP_FOLDER_PLAYER_CARDS_PATH);
    }

    if(!fs.existsSync(TEMP_FOLDER_PHOTOS_ORIGINALS_PATH)){
        console.log("Creating temporary folder for Orignals")
        fs.mkdirSync(TEMP_FOLDER_PHOTOS_ORIGINALS_PATH);
    }

    loadFaceAPIModels()
}


async function downloadAndCacheResourceFromURL(tempFolderPath, localFileName, url) {
    filepath = path.join(process.cwd(), tempFolderPath, localFileName);
    if (!fs.existsSync(tempFolderPath)) {
        console.log("Error : Cannot download File. The enclosing folder\"" + tempFolderPath + "\" does not exist.")
        return false;
    }
    if (!fs.existsSync(filepath)) {
        console.log("FILE " + filepath + " does not exist on disk. Fetching from " + url)
        const file = fs.createWriteStream(filepath);

        const httpRequestPromise = new Promise((resolve) => {



            const request = https.get(url, function (response) {
                response.pipe(file);
                file.on("finish", () => {
                    file.close();
                    console.log("File Downloaded")
                    resolve(response);
                });
            });

            request.on("error", function (error) {
                console.log("Connection failed.", error);
                if (typeof callback === "function") {
                    callback(true, params);
                }
            });

        })
        await httpRequestPromise;
    }
}

/* Helper Functions for FaceModels*/

async function loadFaceAPIModels(){
    // Check that the models are downloaded. If not, run setup
    if(!fs.existsSync(TEMP_FOLDER_FACEMODELS_PATH)){
        console.log("Creating temporary folder for FaceModels")
        fs.mkdirSync(TEMP_FOLDER_FACEMODELS_PATH);
    }

    // Downloads Weights from v0.22.2 of the module 
    await downloadAndCacheResourceFromURL(TEMP_FOLDER_FACEMODELS_PATH,"ssd_mobilenetv1_model-weights_manifest.json","https://raw.githubusercontent.com/justadudewhohacks/face-api.js/8609b25a15f417398a4d2b95dc91985cd1e0c0c3/weights/ssd_mobilenetv1_model-weights_manifest.json")
    await downloadAndCacheResourceFromURL(TEMP_FOLDER_FACEMODELS_PATH,"ssd_mobilenetv1_model-shard1","https://raw.githubusercontent.com/justadudewhohacks/face-api.js/8609b25a15f417398a4d2b95dc91985cd1e0c0c3/weights/ssd_mobilenetv1_model-shard1")
    await downloadAndCacheResourceFromURL(TEMP_FOLDER_FACEMODELS_PATH,"ssd_mobilenetv1_model-shard2","https://raw.githubusercontent.com/justadudewhohacks/face-api.js/8609b25a15f417398a4d2b95dc91985cd1e0c0c3/weights/ssd_mobilenetv1_model-shard2")
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(TEMP_FOLDER_FACEMODELS_PATH)

    /*
    // Automatic cropping using face detection
    if(0){
        const imageFilePath = path.join(process.cwd(),TEMP_FOLDER_FACEMODELS_PATH,"test.jpeg")
        imgData = await fs.promises.readFile(imageFilePath)
        var image = new canvas.Image();
        image.src = imgData;

        const debugCanvas = new canvas.Canvas(image.width,image.height)
        const context = debugCanvas.getContext("2d");
        context.drawImage(image,0,0)

        const result = await faceapi.detectAllFaces(image);
    
        console.log("Detected faces:", result.length);
        console.log(result)

        faceapi.draw.drawDetections(debugCanvas, result)
        const buffer = debugCanvas.toBuffer("image/png");
        fs.writeFileSync("./testOutput.png", buffer);

        // Get First Face 
        face = result[0]
        // Compute ROI positon 


        var playerPhotoCropped = new canvas.Image()
        playerPhotoCropped.src  = CropAndResizeImage(image,300,300,100,100,0,0)
        composePlayerCard(playerPhotoCropped,"Deshawn Topaz \"The Lime\" Green","PUSHER")

        tensor.dispose();
    }
    */

}


async function updatePlayerPhotos(studentDatabase,progressCallBack){

}


async function processPhoto(imageFilePath, player) {        
        // If player has multiple roles recurisvley call this function for all roles 
        if(player.roles.length > 1){

            await Promise.all(player.roles.map(async(role)=>{
                var playerObjectCopy = Object.assign({}, player);
                // Disconnect Array instance 
                var roleArray = [role]
                playerObjectCopy.roles = roleArray
                await processPhoto(imageFilePath,playerObjectCopy)
            }));
            return;
        }

        const playerCardOutputPath = getPathForPlayerCard(player,player.roles[0])
        // Load the Image 
        imgData = await fs.promises.readFile(imageFilePath)

        // Load Image into Canvas Object 
        var playerImage = new canvas.Image();
        playerImage.src = imgData; 

        //TODO Run Facial Recogniton here....

        var playerPhotoCropped = new canvas.Image()
        var off_x = 0; 
        var off_y =0; 
        // if Layout hints, apply 
        if(player.customLayoutHints){
            if(player.customLayoutHints.offset_x){
                off_x = player.customLayoutHints.offset_x;
            }
            if(player.customLayoutHints.offset_y){
                off_y = player.customLayoutHints.offset_y;
            }
        }
        playerPhotoCropped.src  = CropAndResizeImage(playerImage,300,300,100,100,0,0,off_x,off_y)

        var buffer = composePlayerCard(playerPhotoCropped,player.name,player.roles[0])
        await fs.promises.writeFile(playerCardOutputPath, buffer);

}

function getPathForPlayerCard(player,role){
    // Specify role in case player has more than one role 
    // Verify passed role exists for player
    if(!player.roles.includes(role)){
        throw console.error("Tried to get path to player card but the player does not hold the specified role.");
    }

    return path.join(TEMP_FOLDER_PLAYER_CARDS_PATH,player.andrewid+"_"+role+".png");

}

function getPathForPlayerPhoto(player){

    return path.join(TEMP_FOLDER_PHOTOS_CONVERTED_PATH,player.andrewid+".png");

}

function doesPlayerPhotoExist(player){
    const filepath = getPathForPlayerPhoto(player);
    return fs.existsSync(filepath);
}

function doesPlayerCardExist(player){
    for(var i=0; i < player.roles.length; i++){
        const filepath = getPathForPlayerCard(player,player.roles[i])
        if(!fs.existsSync(filepath)){
            return false;
        }
    }

    return true;
    
}



// https://plusqa.com/2020/09/25/dynamically-resize-text-with-html-canvas-measuretext/
 function CropAndResizeImage(img,target_width,target_height,roi_w=0,roi_h=0,roi_x=0,roi_y=0,img_off_x=0,img_off_y=0){
    const _canvas = new canvas.Canvas(target_width,target_height)
    const context = _canvas.getContext("2d")

    // Assume ROI is centered 
    
    wratio = _canvas.width/img.width;
    hratio = _canvas.height/img.height;
    var ratio  = Math.max ( wratio, hratio );
    var centerShift_x = (( _canvas.width - img.width*ratio ) / 2) + img_off_x;
    var centerShift_y = (( _canvas.height - img.height*ratio ) / 2) + img_off_y;  

    context.drawImage(img, 0,0, img.width, img.height,
                       centerShift_x,centerShift_y,img.width*ratio, img.height*ratio); 



    context.strokeRect(roi_w,roi_h,roi_x,roi_y)
    const buffer = _canvas.toBuffer("image/png");
    return buffer;
}

 function composePlayerCard(playerImage,playerName,playerRole){
    const _canvas = new canvas.Canvas(300,375)
    const context = _canvas.getContext("2d")

    // Place player photo at top of canvas 
    
    context.drawImage(playerImage,0,0)
    context.fillStyle = "#FFFFFF"
    context.fillRect(0,300,300,100)

    // Draw Text for Player Name 
    const textMaxWidth = 100;
    const initalFontSize = 40; 

    function fontSizeForMaxWidth(max_width,initalFontSize,font_faimly,text){
        var fontSize = initalFontSize;
        context.font = `${fontSize}px ${font_faimly}`;
        
        var boundingBox = context.measureText(text)

        while(boundingBox.width > max_width){
            fontSize = fontSize-0.2;
            context.font = `${fontSize}px ${font_faimly}`;
            boundingBox = context.measureText(text)
        }

        return `${fontSize}px ${font_faimly}`;
    }

    // Write the player name 
    // Dynamicaly size the font so larger names still fit 
    context.font = fontSizeForMaxWidth(290,30,"Georgia",playerName)
    var playerNameBoundingBox = {x:0,y:0,height:context.measureText(playerName).actualBoundingBoxAscent,width:context.measureText(playerName).width}


    // Center Player Name 
    playerNameBoundingBox.x = (_canvas.width - playerNameBoundingBox.width)/2;
    playerNameBoundingBox.y = 320 + playerNameBoundingBox.height/2; 


    // Write Player Name 
    context.fillStyle = "#000000"
    context.fillText(playerName,playerNameBoundingBox.x,playerNameBoundingBox.y)


    // Write Player Role 
    context.font = fontSizeForMaxWidth(300,40,"Din Alternate",playerRole)
    var playerRoleBoundingBox = {x:0,y:0,height:context.measureText(playerRole).actualBoundingBoxAscent,width:context.measureText(playerRole).width}

     // Center Player Role  
     playerRoleBoundingBox.x = (_canvas.width - playerRoleBoundingBox.width)/2;
     playerRoleBoundingBox.y = 355 + playerRoleBoundingBox.height/2; 

      // Write Player Role 
    context.fillStyle = "#000000"
    context.fillText(playerRole,playerRoleBoundingBox.x,playerRoleBoundingBox.y)


    const buffer = _canvas.toBuffer("image/png");
    return buffer; 

}


async function utilsConvertPhotoToPng(srcFilePath,outputFilePath,contentType=null){

    switch(contentType){

        case 'image/jpeg':
            await utilsConvertJpegToPng(srcFilePath,outputFilePath)
            break;
        case 'image/heic':
        case 'image/heif':
           await utilsConvertHeicToPng(srcFilePath,outputFilePath,contentType)
        break;
        default :
            await utilsConvertPhotoToPngDefault(srcFilePath,outputFilePath,contentType=null)

    }
}

async function utilsConvertJpegToPng(srcFilePath,outputFilePath){
    // Soooooooo aparently some JPEGS lie about their pixel orientation and just use an EXIF tag to tell the computer to rotate it!?
    // The NodeJS canvas Image implementation we use can't handle reading this EXIF data and applying the correct orientation for us
    // Thankfully, an entuire nodeJS package exists just to help us solve this problem... ಠ_ಠ
    const inputBufferJpeg = await fs.promises.readFile(srcFilePath);
    const outputBuffer = await sharp(inputBufferJpeg).rotate().png().toBuffer();
    await fs.promises.writeFile(outputFilePath,outputBuffer)


    
}

async function utilsConvertHeicToPng(srcFilePath,outputFilePath,contentType=null){
    const inputBufferHeic = await fs.promises.readFile(srcFilePath);
    const outputBuffer = await convert_heic({buffer:inputBufferHeic,format:'PNG'});
    await fs.promises.writeFile(outputFilePath,outputBuffer)
}

async function utilsConvertPhotoToPngDefault(srcFilePath,outputFilePath,contentType=null){
    const srcImage = new canvas.Image(); 
    const imgData = await fs.promises.readFile(srcFilePath)
    srcImage.src = imgData
    const _canvas = new canvas.Canvas(srcImage.width,srcImage.height)
    const context = _canvas.getContext("2d")

    context.fillRect(0,300,300,100)
    context.drawImage(srcImage,0,0)
    const buffer = _canvas.toBuffer("image/png");
    await fs.promises.writeFile(outputFilePath, buffer);
}

module.exports = {
    updatePlayerPhotos: updatePlayerPhotos,
    getPathForPlayerCard : getPathForPlayerCard,
    getPathForPlayerPhoto : getPathForPlayerPhoto,
    doesPlayerPhotoExist : doesPlayerPhotoExist,
    doesPlayerCardExist : doesPlayerCardExist,
    utilsConvertPhotoToPng:utilsConvertPhotoToPng,
    processPhoto : processPhoto,
    init : setupTemporaryDirectoriesAndFaceAPI,
    TEMP_FOLDER_PHOTOS_ORIGINALS_PATH : TEMP_FOLDER_PHOTOS_ORIGINALS_PATH,
    TEMP_FOLDER_PLAYER_CARDS_PATH : TEMP_FOLDER_PLAYER_CARDS_PATH

  };
  