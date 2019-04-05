

// Database 
var DB = {
	students: [],
	andrewid: [],
	heats: [],
	searchStudent : {},
	activeHeat :{}
}


reconnect();

function  watchdog(){

	if(connection.readyState != 1){
		reconnect();
	}else{
		window.setTimeout(watchdog, 100000);
	}
}

function reconnect() {

//	connection = new WebSocket('ws://127.0.0.1:1337');
	connection = new WebSocket ('ws:128.2.66.138:1337');
//  connection = new WebSocket ('ws:128.237.143.229:1337');
 
	connection.onopen = function () {
		'use strict';
		
		connection.send("HELLO WORLD");
	};

	connection.onclose = function () {
		'use strict';
		watchdog();
	};



	connection.onmessage = function (message) {
		// try to decode json (I assume that each message
		// from server is json)
		try {
			var command = JSON.parse(message.data);

			// handle incoming message
			//	alert(message.data);
			switch (command.cmd) {
				case "CONTROL_CLIENT=>UPDATE_STUDENTS":
					//	console.log(command.data);
				                    break;

				case "CONTROL_CLIENT=>UPDATE_HEATS":
                    // Update DB 
                    
					break;
                case "PUSH_HEAT=>DISPLAY":
                    DB.activeHeat = command.data;
                updateDisplay();
                    break;
				default:
					console.log("INVALID COMMAND RECEIVED", command);
			}
		} catch (e) {
			console.log('This doesn\'t look like a valid JSON: ',
				message.data);
			return;
		}
	};



}


function send(command) {
	/* https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants*/
	if (connection.readyState != 1) {
		alert("ERROR : Could not send command. A connection to the server must be established first. \n\n" + JSON.stringify(command, null, 2)); // spacing level = 2)
		return;
	}

	connection.send(JSON.stringify(command));

}


function updateDisplay(){
    // Update all of the image SRC's

    // Update Team 1 Stuff 

	// if 
	
	// Store Team name without last letter 

if(elementExists("team1")){
	var teamName = DB.activeHeat.team1.name;
	var teamNameShort  = teamName.substring(0,teamName.length-1);
    updateText(teamNameShort,"teamName");
    updateText(DB.activeHeat.name,"heatDisplayTitle");
    updateImage(DB.activeHeat.team1.roles.driver,"t1Driver");
    updateImage(DB.activeHeat.team1.roles.hill1,"t1Hill1");
    updateImage(DB.activeHeat.team1.roles.hill2,"t1Hill2");
    updateImage(DB.activeHeat.team1.roles.hill3,"t1Hill3");
    updateImage(DB.activeHeat.team1.roles.hill4,"t1Hill4");
    updateImage(DB.activeHeat.team1.roles.hill5,"t1Hill5");
}

if(elementExists("team2")){
	var teamName = DB.activeHeat.team2.name;
	var teamNameShort  = teamName.substring(0,teamName.length-1);
    updateText(teamNameShort,"teamName");
   // updateText(DB.activeHeat.team2.name,"teamName");
    updateText(DB.activeHeat.name,"heatDisplayTitle");
    updateImage(DB.activeHeat.team2.roles.driver,"t1Driver");
    updateImage(DB.activeHeat.team2.roles.hill1,"t1Hill1");
    updateImage(DB.activeHeat.team2.roles.hill2,"t1Hill2");
    updateImage(DB.activeHeat.team2.roles.hill3,"t1Hill3");
    updateImage(DB.activeHeat.team2.roles.hill4,"t1Hill4");
    updateImage(DB.activeHeat.team2.roles.hill5,"t1Hill5");
}


if(elementExists("team3")){
	var teamName = DB.activeHeat.team3.name;
	var teamNameShort  = teamName.substring(0,teamName.length-1);
    updateText(teamNameShort,"teamName");
   // updateText(DB.activeHeat.team2.name,"teamName");
    updateText(DB.activeHeat.name,"heatDisplayTitle");
    updateImage(DB.activeHeat.team2.roles.driver,"t1Driver");
    updateImage(DB.activeHeat.team2.roles.hill1,"t1Hill1");
    updateImage(DB.activeHeat.team2.roles.hill2,"t1Hill2");
    updateImage(DB.activeHeat.team2.roles.hill3,"t1Hill3");
    updateImage(DB.activeHeat.team2.roles.hill4,"t1Hill4");
    updateImage(DB.activeHeat.team2.roles.hill5,"t1Hill5");
}


}

function updateImage (role,id){
    // Get element 
   var element =  document.getElementById(id);
   element.src = role.photoSRC;
}

function updateText(text,elementID){
    var element =  document.getElementById(elementID);
    element.innerText = text;

}

function elementExists(id){
    var element =  document.getElementById(id);

    return (element != undefined);
    
}