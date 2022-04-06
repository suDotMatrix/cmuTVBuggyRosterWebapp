const fs = require('fs');
var path = require('path');
const readline = require('readline');
const google = require('googleapis');
const { resolve } = require('path/posix');
const OAuth2Client = google.google.auth.OAuth2;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'token.json';
const OAUTH_SECRETS_PATH = 'credentials.json';
const DATA_IMPORT_COMMAND_IGNORE_ROW = "#PRAGMA IGNORE_ROW"
const playercardfunctions = require('./generatePlayerCard.js');
const { rejects } = require('assert');
const { drive } = require('googleapis/build/src/apis/drive');

var credentials = {};
module.exports = {
  updateStudentData: updateStudentData,
  updateHeatData: updateBuggyHeatData
};

// Spreadsheet ID 
databaseSpreadsheetID = "1BNDo8nFdlHoeUtBuZvGui0fqbn0oofc5nCBelzWS_zc"
// Load client secrets from a local file.
fs.readFile(OAUTH_SECRETS_PATH, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  credentials = JSON.parse(content);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  console.log(credentials);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Error : Application is not authorized\n');

  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}




/**
 * Reads in and caches all of the data on Buggy participants 
 * @see https://docs.google.com/spreadsheets/d/1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw/edit
 * @param {OAuth2Client} auth The authenticated Google OAuth client.
 * Data Range : STUDENT_DATA'!A1:K
 * ID : 1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw
 */
function updateStudentData(callback, options) {

  authorize(credentials, function (auth) {
    fetchPlayerData(auth, options, function (studentDatabase) {
      // Update students before images have finished processing
      callback(studentDatabase);

      // Download Player Photos After
      downloadPlayerPhotos(auth, studentDatabase, options, function () {
        // Originally had callback here. Moved above 
      })
    });
  });

}

async function downloadPlayerPhotos(auth, studentDatabase, options, callback) {
  var ProgressCallback = function () { };

  if (options && options.ProgressCallback) {
    ProgressCallback = options.ProgressCallback
  }

  // Make sure temporary folders exist 
  playercardfunctions.init()


  // Try and Connect to Google Drive 
  // Check For what files are missing 

  var studentsToUpdate = [];
  studentDatabase.forEach(student => {
    if (!playercardfunctions.doesPlayerPhotoExist(student) || student.customLayoutHints) {
      studentsToUpdate.push(student);
    }
  });

  // ForEach doesn't play nice with Async/Await. use a for loop
  for (var i = 0; i < studentsToUpdate.length; i++) {
    // Curry Progress Callback 
    // Copy Options Object / "#f39c12"
    var localOptions = Object.assign({}, options);
    localOptions.ProgressCallback = (msg,color)=>{
      ProgressCallback(`[${studentsToUpdate[i].andrewid}] ${msg} (${i}/${studentsToUpdate.length})`, color);
    }
    await updatePlayerPhoto(auth, studentsToUpdate[i], localOptions);
  }

  ProgressCallback("","#2ecc71")
  callback()

}

async function updatePlayerPhoto(auth, student, options) {
  var ProgressCallback = function () { };
  const drive = google.google.drive({ version: 'v2', auth });

  if (options && options.ProgressCallback) {
    ProgressCallback = options.ProgressCallback
  }
  console.log("[" + student.andrewid + "] | Updating Photo");
  ProgressCallback("Downloading Photo","#f39c12")


  // Promise for downloading Google Drive Files 

  googleDriveFileDownloadPromise = new Promise((resolve, reject) => {

    // Get file metadata and then get file
    drive.files.get({ fileId: student.photoDriveID },
      async (err, response) => {
        // IF error getting file metadata, return 
        if(err){
          reject(err)
          return
        }

        const originalFilename = response.data.originalFilename;


        drive.files.get({ fileId: student.photoDriveID, alt: 'media' }, { responseType: "arraybuffer" },
          async (err, response) => {
            if (err) {
              reject(err)
              return
            }

            const imageData = response.data;
            const filePathOriginal = path.join(process.cwd(), playercardfunctions.TEMP_FOLDER_PHOTOS_ORIGINALS_PATH, originalFilename)
            await fs.promises.writeFile(filePathOriginal, Buffer.from(imageData));
            resolve({filepath : filePathOriginal,contentType:response.headers["content-type"]})


          });
      });
  });

  try {
    
 
  const fileMetadata = await googleDriveFileDownloadPromise

  // Convert to PNG
  ProgressCallback("Updating Player Card","#f39c12")
  const playerPhotoFilePath = playercardfunctions.getPathForPlayerPhoto(student)
  await playercardfunctions.utilsConvertPhotoToPng(fileMetadata.filepath,playerPhotoFilePath,fileMetadata.contentType)

  console.log("[" + student.andrewid + "] | Updating Player Card");

  // Generate Player card

  await playercardfunctions.processPhoto(playerPhotoFilePath,student)

} catch (error) {
  console.error("[" + student.andrewid + "] | Error Updating Player Card");
  ProgressCallback("Error Updaing Player Card", "#e74c3c");
  console.log(error)
  await new Promise(r => setTimeout(r, 2000));
}


}



/**Reads in the data on each value entered into the spreadsheet*/
function fetchPlayerData(auth, options, callback) {
  var ProgressCallback = function () { };
  if (options && options.ProgressCallback) {
    ProgressCallback = options.ProgressCallback
  }
  ProgressCallback("Fetching player Data from Google", "#f39c12");
  const sheets = google.google.sheets({ version: 'v4', auth });
  // Fetch data 
  var headers = sheets.spreadsheets.values.get({
    spreadsheetId: databaseSpreadsheetID,
    range: 'STUDENT_DATA!A:L',
  }, (err, response) => {
    if (err) return console.log("The SHEETS API returned an error : " + err);
    if (response == undefined) {
      return console.log("The response from the SHEETS API was null. Fatal Error.")
    }
    ProgressCallback("Loading player data", "#f39c12");
    // Get data 
    const rows = response.data.values;



    // Load all the columns into an entry for each student 
    var studentDatabase = [];

    rows.forEach(function (element) {
      var student = {};
      if (element[0].includes(DATA_IMPORT_COMMAND_IGNORE_ROW)) {
        return;
      }
      student.email = element[0];
      student.andrewid = element[1].trim();
      student.name = element[2];
      student.pronounce = element[3];
      student.majorTeam = element[4];
      student.school = element[5];
      student.roles = element[6].split(",");
      student.year = element[7];
      student.googleDrivePhotoLink = element[8];
      try {
        if(element[10]==="" || element[10] === undefined){
          student.customLayoutHints = null
        }else{
          student.customLayoutHints = JSON.parse(element[10])
        }
      } catch (error) {
        console.error("Failed to parse custom layout hints for student " + student.andrewid + " Expect JSON, got \""+element[10] + "\"");
        
      }
      student.photoDriveID = student.googleDrivePhotoLink.split("drive.google.com/open?id=")[1];

      // COMPUTE PHOTO Paths for each role 
      var photoPaths = {}; 
      student.roles.forEach(role => {
        photoPaths[role] = playercardfunctions.getPathForPlayerCard(student,role)
      });
      student.photoSRC = photoPaths;


      studentDatabase.push(student);
    });

    console.log("STUDENT RECORDS...");
    console.log(studentDatabase);
    if (callback != null) {
      callback(studentDatabase);
    }
  });

}




/**
 * Reads in and caches all of the data on the Buggy Heats 
 * @see https://docs.google.com/spreadsheets/d/1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw/edit
 * @param {OAuth2Client} auth The authenticated Google OAuth client.
 * Data Range : 'HEATS!A:Y'
 * ID : 1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw
 */

function updateBuggyHeatData(callback,options) {

  authorize(credentials, function (auth) {
    cacheBuggyHeatData(auth, callback,options);
  });

}

function cacheBuggyHeatData(auth, callback,options) {
  var ProgressCallback = function () { };
  if (options && options.ProgressCallback) {
    ProgressCallback = options.ProgressCallback
  }

  ProgressCallback("Updating Heats","#f39c12")

  const sheets = google.google.sheets({ version: 'v4', auth });

  sheets.spreadsheets.values.get({
    spreadsheetId: databaseSpreadsheetID,
    range: 'HEATS!A:Y',
  }, (err, response) => {

    if (err) return console.log("The SHEETS API returned an error : " + err);
    const rows = response.data.values;

    // Load all the columns into an entry for each student 
    var HeatsDatabase = [];

    rows.forEach(function (element) {
      var heat = {};
      heat.name = element[0];
      /* Import Team 1 data. All roles are refered to only by andrew IDs*/
      heat.team1 = {};
      heat.team1.roles = {};
      heat.team1.name = element[1];
      heat.team1.roles.driver = element[2];
      heat.team1.roles.hill1 = element[3];
      heat.team1.roles.hill2 = element[4];
      heat.team1.roles.hill3 = element[5];
      heat.team1.roles.hill4 = element[6];
      heat.team1.roles.hill5 = element[7];
      heat.team1.time = element[8];


      heat.team2 = {};
      heat.team2.roles = {};
      heat.team2.name = element[9];
      heat.team2.roles.driver = element[10];
      heat.team2.roles.hill1 = element[11];
      heat.team2.roles.hill2 = element[12];
      heat.team2.roles.hill3 = element[13];
      heat.team2.roles.hill4 = element[14];
      heat.team2.roles.hill5 = element[15];
      heat.team2.time = element[16];



      heat.team3 = {};
      heat.team3.roles = {};
      heat.team3.name = element[17];
      heat.team3.roles.driver = element[18];
      heat.team3.roles.hill1 = element[19];
      heat.team3.roles.hill2 = element[20];
      heat.team3.roles.hill3 = element[21];
      heat.team3.roles.hill4 = element[22];
      heat.team3.roles.hill5 = element[23];
      heat.team3.time = element[24];




      HeatsDatabase.push(heat);
    });

    console.log("Heats...")
    console.log(HeatsDatabase);
    console.log("")
    console.log("")

    if (callback != null) {
      ProgressCallback(" ","#2ecc71")
      callback(HeatsDatabase);
    }

  });

}