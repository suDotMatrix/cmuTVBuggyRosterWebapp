// JavaScript Document

// We assume that the broweser can support websocket. If not, show an alert. 
// Whole-script strict mode syntax


if (!window.WebSocket) {
	alert("Sorry, You must support websockets to use this application");
}


// Database 
var DB = {
	students: [],
	andrewid: [],
	heats: [],
	searchStudent : {},
	activeHeat :{}
}

window.setInterval(function(){
	/// call your function here
  }, 5000);
// Create a connection 

var connection;

function  watchdog(){

	if(connection.readyState != 1){
		reconnect();
	}else{
		window.setTimeout(watchdog, 100000);
	}
}

reconnect();
function reconnect() {

	connection = new WebSocket('ws://127.0.0.1:1337');
	//connection = new WebSocket ('ws:128.2.66.138:1337');

	connection.onopen = function () {
		'use strict';
		var connectionBar = document.getElementById("connectionStatusDiv");
		connectionBar.style.backgroundColor = "#2ecc71";
		connectionBar.innerHTML = "CONNECTED";
		connection.send("HELLO WORLD");
	};

	connection.onclose = function () {
		'use strict';
		var connectionBar = document.getElementById("connectionStatusDiv");
		connectionBar.style.backgroundColor = "#EE0003";
		connectionBar.innerHTML = "NOT CONNECTED";
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
					// Update autocomplete data for JQUERY UI 
					DB.students = command.data;
					DB.andrewid = [];
					DB.searchStudent = {};
					DB.students.forEach(element => {
						DB.andrewid.push(element.andrewid);
						DB.searchStudent[element.andrewid] = element;
					});

					$("#playerCardAndrewID").autocomplete({
						source: DB.andrewid
					});

					// Set Update student div back to default color 
					document.getElementById("updateStudents").style.backgroundColor = "white";
					break;

				case "CONTROL_CLIENT=>UPDATE_HEATS":
					// Update DB 
					DB.heats = command.data;

					// Relink ALL Student profiles to HEATS 
					




					// Update interface. 

					// Get current heat 
					var index = $("#currHeatBoxval").val();
					setCurrentHeat(DB.heats[index],index);

					// Update 

					

					document.getElementById("updateHeats").style.backgroundColor = "white";
					
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

/* JQUERY CLICK HANDLERS*/


$(document).ready(function () {

	// ON CLICK for Update Student Data 
	$("#updateStudents").click(function (e) {
		'use strict';
		// Send a message to the server 
		var command = {
			cmd: "PULL_STUDENT_DATA",
			data: undefined
		};
		document.getElementById("updateStudents").style.backgroundColor = "#f1c40f";

		send(command);
	});


	// On click update heat data 

	$("#updateHeats").click(function (e) {
		'use strict';
		// Send a message to the server 
		var command = {
			cmd: "PULL_HEAT_DATA",
			data: undefined
		};
		document.getElementById("updateHeats").style.backgroundColor = "#f1c40f";

		send(command);
	});


	$("#connectionStatusDiv").click(function (e) {
		if (connection && connection.readyState !== 1) {
			reconnect();
		}
	});

	$("#currHeatBoxval").val(0);


	$("#nextHeatbutton").click(function(e){
		// get current value 
		// Get current heat 
		var index = parseInt($("#currHeatBoxval").val());

		if(isNaN(index)){
			index = 0;
		}

		if(DB.heats[index+1] != undefined){
			setCurrentHeat(DB.heats[index+1],index+1);
		}
	});



	$("#prevHeatbutton").click(function(e){
		// get current value 
		// Get current heat 
		var index = parseInt($("#currHeatBoxval").val());

		if(isNaN(index)){
			index = 0;
		}

		if(DB.heats[index-1] != undefined){
			setCurrentHeat(DB.heats[index-1],index-1);
		}
	});


	$("#currHeatBox").submit(function(e){
		var index = parseInt($("#currHeatBoxval").val());

		if(isNaN(index)){
			index = 0;
		}

		if(DB.heats[index] != undefined){
			setCurrentHeat(DB.heats[index],index);
		}
		e.preventDefault();
		return false;
	});


	$("#pushToServerButton").click(function(e){
		
//		DB.activeHeat


		// Get Each andrewID from Heat before we send 

		// Deep copy
		var linkedHeat = jQuery.extend(true, {}, DB.activeHeat);

		
		var miniUltilty = function(team,role){
			var teamObject = linkedHeat[team];
			var roleandrewid = teamObject.roles[role];
			linkedHeat[team].roles[role] = DB.searchStudent[roleandrewid];

			if(DB.searchStudent[roleandrewid] == undefined){
				console.error("LOOKUP FAILED: Team " + team + " role " + role  + " was undefined. Role index was " + roleandrewid);
			}
		}
		miniUltilty("team1","driver");
		miniUltilty("team1","hill1");
		miniUltilty("team1","hill2");
		miniUltilty("team1","hill3");
		miniUltilty("team1","hill4");
		miniUltilty("team1","hill5");

		miniUltilty("team2","driver");
		miniUltilty("team2","hill1");
		miniUltilty("team2","hill2");
		miniUltilty("team2","hill3");
		miniUltilty("team2","hill4");
		miniUltilty("team2","hill5");


		miniUltilty("team3","driver");
		miniUltilty("team3","hill1");
		miniUltilty("team3","hill2");
		miniUltilty("team3","hill3");
		miniUltilty("team3","hill4");
		miniUltilty("team3","hill5");




		// Send a message to the server 
		var command = {
			cmd: "PUSH_HEAT=>DISPLAY",
			data: linkedHeat
		};

		send(command);



	});


	document.getElementById('playerCardAndrewIDFORM').addEventListener('submit', function (e) {
		//alert(document.getElementById("playerCardAndrewID").value)
		var formValue = document.getElementById("playerCardAndrewID").value; // The andrewID we are searching for 
		// Find a matching andrewID 
		var found = false; // Did we find a match 
		DB.students.forEach(student => {
			if (student.andrewid == formValue.trim()) {
				// Update the board 
				loadStudentIntoPlayerCard(student);
				found = true; // Yay closure 
			}
		});
		if (!found) // If not found, show error
			alert("Andrew ID \"" + formValue + "\" not found");

		e.preventDefault();
		return false;
	}, false);

	/*
	$( function() {
    var availableTags = [
      "ActionScript",
      "AppleScript",
      "Asp",
      "BASIC",
      "C",
      "C++",
      "Clojure",
      "COBOL",
      "ColdFusion",
      "Erlang",
      "Fortran",
      "Groovy",
      "Haskell",
      "Java",
      "JavaScript",
      "Lisp",
      "Perl",
      "PHP",
      "Python",
      "Ruby",
      "Scala",
      "Scheme"
    ];
    $( "#playerCardAndrewID" ).autocomplete({
      source: availableTags
    });
  } );
	*/

});

/* 

Sets the system to a HEAT. 
Also accepts an index to indicate which number heat it is.

*/


function setCurrentHeat(heat,index){
	// Start by making sure heat not null. If heat is null, exit early
	if(heat == undefined){
		return;
	}
	// SET As active heat : 
	DB.activeHeat = heat;


	// Start By Updating Heat Display 

	$("#currentHeatDisplay").html("[" + index + "] " + heat.name);
	$("#currHeatBoxval").val(""+index);
	$("#heatListDisplayContainer").html(generateHeatListHTML(DB.heats,heat));

	updateTeam("TEAM1",DB.activeHeat);

}

function updateTeam(teamPrefix,heat){

	// Get all team1 objects 

	jQuery( "[autobindTeam]" ).each(function(index){
		// Jquery Sets <this> to the elements we are seeking
		// Get path, split by dot
		
		/* The element has an autobindTeam attribute that refrences a path to a specific property in the heat object that it wants to be set to.*/
		var propertyPath = this.getAttribute("autobindTeam");
		var property = getNestedProperty({heat:heat,DB:DB},propertyPath);

		var tagName = this.tagName.toLowerCase();
		if (tagName == 'input'){
			this.value = property;
		}else if (tagName == 'img'){
		
			this.src = property;
		
		}else{
			this.html = property;
		}
	

	});

}

function getNestedProperty(object,string){
	// First split up string 
	var propertyElements = string.split(".");
	var index = 0;
	var property = object;
	while(propertyElements[index] != undefined){
		if(propertyElements[index]== "LINKSTUDENT"){
			// Assume last property was andrewID
			var linkedStudent = DB.searchStudent[property];
			if(linkedStudent== undefined){
				return ("[FATAL : ANDREWID NOT IN LINK DATABASE]" + property );
			}else{
				property = linkedStudent;
			}
			index++;
			continue;

		}
		property = property[propertyElements[index]];
		index++;
		
	}

	if(index == propertyElements.length){
		return property;
	}

	return undefined;

}



function generateHeatListHTML(heats,selectedHeat){
	var html = "";
	for (var i=0; i < heats.length; i++){	
		var cssClass = "heatListElement"; 	

		if(selectedHeat == heats[i])
			cssClass += " activeHeatListElement";

		var snippet = "<div class =\""+cssClass+"\"> <strong> [" + i+"]  "+ heats[i].name +  "</strong> | " + heats[i].team1.name + " | " + heats[i].team2.name +  " | " + heats[i].team3.name +  " </div>";
		html += snippet;
}
return html;
}



function loadStudentIntoPlayerCard(student) {
	document.getElementById("playerCardAndrewID").innerHTML = student.andrewid;
	document.getElementById("playerCardFullName").innerHTML = student.name;
	document.getElementById

	var nameNoSpaces = student.name.replace(/\s/g, '');
	var photoPath = "img/profiles/png/" + nameNoSpaces + "copy.png";

	document.getElementById("playerPhotoPreview").src = photoPath;
}


/* https://www.linkedin.com/pulse/javascript-find-object-array-based-objects-property-rafael*/
function findObjectByKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}