var WebSocketServer = require('websocket').server;
var googleInterface = require('./serverGoogleAuth.js');
var http = require('http');
var webSocketsServerPort = 3001;

var clients = [];


var DB = {
    students: [],
    andrewid : []
}



// Start by Authorizing to Google Sheets 

var server = http.createServer(function (request, response) {
    // process HTTP request. Since we're writing just WebSockets
    // server we don't have to implement anything.
});

server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port "
        + webSocketsServerPort);
});

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin '
        + request.origin + '.');
    var connection = request.accept(null, request.origin);
    clients.push(connection);


    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function (message) {
        try {
            if (message.type === 'utf8') {
                // process WebSocket message
                console.log("MESSAGE : " + message.utf8Data);
                // Always should be JSON data 

                var command = JSON.parse(message.utf8Data)

                /* Choose which command to execute*/
                
                switch(command.cmd){

                    case "PULL_STUDENT_DATA" :
                    send("CONTROL_CLIENT=>UPDATE_STATUS",{color : "#f1c40f",msg:"Refresh Data"})
                    googleInterface.updateStudentData((studentData)=>{
                        OnStudentDataUpdate(studentData);
                    },{ForceProfilePhotoDowload:False,ProgressCallback : OnServerStatusUpdate});
                    break;

                    case "PULL_HEAT_DATA" :
                    googleInterface.updateHeatData(OnHeatDataUpdate);
                    break;

                    case "PUSH_HEAT=>DISPLAY" :
                    
                    // For now, forward command 
                    send(command.cmd,command.data);

                    case "REQUEST_SERVER_STATUS" :
                        

                    break;

                    default:
                    console.log("INVALID COMMAND RECEIVED", command);
                }
            }
        } catch (error) {
            console.error(error);

        }
    });

    connection.on('close', function (connection) {
        // close user connection

        // Find element in clients, and remove 

        remove(clients,connection);

    });
});

function remove(array, element) {
    const index = array.indexOf(element);
    
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function send(command,data){

    var command = {
        cmd : command,
        data : data
    }

    clients.forEach(element => {
        
        if(element.connected){
            element.sendUTF(JSON.stringify(command));
        }

    });


}


function OnHeatDataUpdate(heatData){

    send("CONTROL_CLIENT=>UPDATE_HEATS",heatData);
}

function OnStudentDataUpdate(studentData) {
    // Update DB 
    DB.students = studentData;

    // Send a command to client 
    send("CONTROL_CLIENT=>UPDATE_STUDENTS",studentData);

    // Download Student Photos

    // Reprocess Student Photos



}

function OnServerStatusUpdate(message,color="green"){
    
    send("CONTROL_CLIENT=>UPDATE_STATUS",{msg:message,color:color});
}


