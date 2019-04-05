const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const OAuth2Client = google.google.auth.OAuth2;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly','https://www.googleapis.com/auth/drive.readonly','https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'credentials.json';
var credentials = {};
module.exports = {
  updateStudentData: updateStudentData,
  updateHeatData: updateBuggyHeatData,
  updatePlayerRecords: updatePlayerRecords,
};

// Spreadsheet ID 
databaseSpreadsheetID = "15aiBF1Njfz2d-bzeCqvWTyeatWC9tqSMDbovZDAYGxM"
// Load client secrets from a local file.
fs.readFile('client_id.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  credentials = JSON.parse(content);
 // authorize(JSON.parse(content), cacheBuggyStudentData);
 // authorize(JSON.parse(content), cacheBuggyHeatData);
 authorize(JSON.parse(content), fetchPlayerData);

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
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {OAuth2Client} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.get({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    range: 'Class Data!A2:E',
  }, (err, { data }) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = data.values;
    if (rows.length) {
      console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[4]}`);
      })
    } else {
      console.log('No data found.');
    }
  });
}





/**
 * Reads in and caches all of the data on Buggy participants 
 * @see https://docs.google.com/spreadsheets/d/1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw/edit
 * @param {OAuth2Client} auth The authenticated Google OAuth client.
 * Data Range : STUDENT_DATA'!A1:K
 * ID : 1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw
 */

//


function updateStudentData(callback) {

  authorize(credentials, function (auth) {
    cacheBuggyStudentData(auth, callback);
  });

}


function updatePlayerRecords(callback){
  authorize(credentials, function (auth) {
    fetchPlayerData(auth, callback);
  });
}

function downloadPlayerPhotos(auth,callback,photoFolder,fileIDList){

  fileIDList.forEach(fid => {
    
  });

}

/**Reads in the data on each value entered into the spreadsheet*/
function fetchPlayerData(auth, callback) {
  const sheets = google.google.sheets({ version: 'v4', auth });
  // Fetch data 
  var headers = sheets.spreadsheets.values.get({
    spreadsheetId: databaseSpreadsheetID,
    range: 'STUDENTS!A:K',
  }, (err, { data }) => {
    if (err) return console.log("The SHEETS API returned an error : " + err);
    // Get data 
    const rows = data.values;

    // Load all the columns into an entry for each student 
    var studentDatabase = [];

    rows.forEach(function (element) {
      var student = {};
      student.email = element[1];
      student.andrewid = element[2];
      student.name = element[3];
      student.pronounce = element[4];
      student.majorTeam = element[5];
      student.school = element[6];
      student.role = element[7];
      student.year = element[8];
      student.googleDrivePhotoLink = element[9];
      student.photoDriveID = student.googleDrivePhotoLink.split("drive.google.com/open?id=")[1];

      // COMPUTE PHOTO PATH 
      var nameNoSpaces = student.name.replace(/\s/g, '');
      student.photoSRC = "img/profiles/png/" + nameNoSpaces + "copy.png";


      studentDatabase.push(student);
    });

    console.log("STUDENT RECORDS...");
    console.log(studentDatabase);
    if (callback != null) {
      callback(studentDatabase);
    }
  });

}


function cacheBuggyStudentData(auth, callback) {

  const sheets = google.google.sheets({ version: 'v4', auth });
  // Grab the data 
  sheets.spreadsheets.values.get({
    spreadsheetId: '1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw',
    range: 'STUDENT_FORM_RESPONSES!A:K',
  }, (err, { data }) => {

    if (err) return console.log("The SHEETS API returned an error : " + err);
    //   console.log(data);
    const rows = data.values;

    // Load all the columns into an entry for each student 
    var studentDatabase = [];

    rows.forEach(function (element) {
      var student = {};
      student.email = element[1];
      student.andrewid = element[2];
      student.name = element[3];
      student.pronounce = element[4];
      student.majorTeam = element[5];
      student.school = element[6];
      student.role = element[7];
      student.year = element[8];
      student.googleDrivePhotoLink = element[9];
      


      // COMPUTE PHOTO PATH 
      var nameNoSpaces = student.name.replace(/\s/g, '');
      student.photoSRC = "img/profiles/png/" + nameNoSpaces + "copy.png";


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

/* Weapper function */

function updateBuggyHeatData(callback) {

  authorize(credentials, function (auth) {
    cacheBuggyHeatData(auth, callback);
  });

}

function cacheBuggyHeatData(auth, callback) {

  const sheets = google.google.sheets({ version: 'v4', auth });

  sheets.spreadsheets.values.get({
    spreadsheetId: '1R1MAh29qzwWu399t4hNNvF0-78hO486AiUkI_STLZOw',
    range: 'HEATS!A:Y',
  }, (err, { data }) => {

    if (err) return console.log("The SHEETS API returned an error : " + err);
    //   console.log(data);
    const rows = data.values;

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
      callback(HeatsDatabase);
    }

  });

}