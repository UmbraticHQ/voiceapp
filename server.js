

const peer = new Peer();
const websocket = new WebSocket("ws://" + window.location.host.split(':')[0] + ":6060/")

peer.on('open', function (id) {
    document.getElementById("adress").innerHTML = 'My peer ID is: ' + id;
});

peer.on('connection', function (dataconnection) {
    console.log(dataconnection)
    document.getElementById("msg").innerHTML = "Connected to:" + dataconnection.peer;
});

function connect() {
    adress = document.getElementById("text").value;
    peer.connect(adress)
    console.log("conecting to:" + adress)
}


websocket.onopen = () => {
    var jsonstring = '{"cmd": "join","data": "' + window.location + '"}';
    websocket.send(jsonstring);
    var jsonstring = '{"cmd": "getUsers","data": "' + window.location + '"}';
    websocket.send(jsonstring);
    //jsonstring = '{"cmd": "exchangeRTC","data": "' + peer.id +'"}';
    //websocket.send(jsonstring);
}
websocket.onmessage = (event) => {
    console.log(event.data);
};


console.log("server.js geladen")