const websocket = new WebSocket("ws://"+ window.location.host.split(':')[0] + ":6060/")
websocket.onopen = () => {
    var jsonstring = '{"cmd": "join","data": "' + window.location + '"}';
    websocket.send(jsonstring);
}
websocket.onmessage = (event) => {
    console.log(event.data);
};
function sendMessage() {
    var m = document.getElementById("txt").value
    websocket.send('{"cmd":"sendMessage", "data":"' + m + '"}');
}