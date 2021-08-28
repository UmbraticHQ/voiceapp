import {
  serve
} from "https://deno.land/std@0.99.0/http/server.ts"; //HTTP Server
import {
  serveFile
} from "https://deno.land/std@0.99.0/http/file_server.ts"; //HTTP FILE Server
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.99.0/ws/mod.ts";
import {
  v4
} from "https://deno.land/std@0.99.0/uuid/mod.ts";

class room {
  location: string;
  user: string[];
  constructor(location: string, user: string[]) {
    this.user = user;
    this.location = location;
  }
}

class User {
  uid: string;
  location: string;
  socket: WebSocket;
  constructor(uid: string, location: string, socket: any) {
    this.uid = uid;
    this.location = location;
    this.socket = socket;
  }
}

class UserList {
  list: User[];

  constructor(list: any) {
    var t: User[] = [];
    this.list = t
  }

  public addUser(user: User) {
    this.list.push(user);
  }
  public rmUser(uid: string) {
    var rmAt = this.list.findIndex(toFindUid => toFindUid.uid === uid);
    this.list.splice(rmAt, 1);
  }
  public changeLocation(uid: string, loc: string) {
    var mark = this.list.findIndex(user => user.uid == uid);
    this.list[mark].location = loc;
  }
  public getLocation(uid: string) {
    var lc;
    lc = this.list.find(x => x.uid = uid);
    if (lc != undefined) {
      return lc.location;
    }
    return lc;
  }
}


var mpath = await Deno.cwd(); //Current directory
var rooms: room[] = [];
var usercollection = new UserList("");
const sockets = new Map < string,WebSocket > ()

// On new Socket
async function handleWs(sock: WebSocket) {
  //This will be executed every time a new Socket is created
  const uid = v4.generate()
  sockets.set(uid, sock)
  var checkUser = usercollection.list.find(x => x.uid == uid)
  if (checkUser == undefined) {
    usercollection.addUser(new User(uid, "", sock))
  }


  for await (const ev of sock) {
    //On Disconnect
    if (isWebSocketCloseEvent(ev)) {
      removeUser(uid);
      return
    }

    //Json Message
    if (typeof ev === "string") {
      var jobject = JSON.parse(ev);
      if (jobject.cmd == "join") {
        var roomExists = rooms.find(({
          location
        }) => location === jobject.data)
        if (roomExists == undefined) { 
          rooms.push(new room(jobject.data, [uid]))

        } else {
          var d = rooms.find(({
            location
          }) => location === jobject.data);
          if (d != undefined) {
            d.user.push(uid);

          }
        }
        usercollection.changeLocation(uid, jobject.data)

      }
      if (jobject.cmd == "sendMessage") {
        
        var lc = usercollection.getLocation(uid);
        if (lc != undefined) {
          sendMessage(jobject.data, lc)

        }
      }
    }
    //Binary Data
    if (ev instanceof Uint8Array) {
      console.log("Binary:", ev);
    }
  }

  function sendMessage(message: string, location: string) {
    var croom = rooms.find(x => x.location = location);
    if(croom != undefined){
    for(var xy = 0; xy < croom.user.length; xy++){
      var b = sockets.get(croom.user[xy])
      if (b != undefined){
            b.send(message)
      }
    }
  }
  }
}
async function runSocketServer() {
  /** websocket echo server **/
  const port = Deno.args[0] || "6060";
  console.log(`websocket server is running on :${port}`);
  for await (const req of serve(`:${port}`)) {
    //req.url is the path where the socket was created
    const {
      conn,
      r: bufReader,
      w: bufWriter,
      headers
    } = req;
    acceptWebSocket({
        conn,
        bufReader,
        bufWriter,
        headers,
      })
      .then(handleWs)
      .catch(async (err) => {
        console.error(`failed to accept websocket: ${err}`);
        await req.respond({
          status: 400
        });
      });
  }
}

async function runWebServer() {
  /** webserver **/
  const port = Deno.args[1] || "5050";
  const host = "http://localhost"
  const s = serve(`:${port}`);
  console.log(`webserver is running on ${host}:${port}`);
  for await (const req of s) {
    try {
      if (req.url != "/") {
        //console.log(req.url)
        const pathx = mpath + "/server.html"
        const contetnt = await serveFile(req, pathx)
        req.respond(contetnt);
      } else {
        req.respond({
          body: "Enter Your Chat Code in URL"
        });
      }

    } catch (e) {
      console.log("error")
    }
  }
}

function removeUser(uid: any) {
  usercollection.rmUser(uid)
  rooms.forEach(room => {
    var CurrentUser = room.user.findIndex(user => user === uid);
    console.log(CurrentUser)
    if(CurrentUser != -1 ){
      
      room.user.splice(CurrentUser, 1);
    }
  });
  sockets.delete(uid)
}

function removeEmptyRooms() {
  var Rlength = rooms.length;
  for (var x = 0; x < Rlength; x++) {
    if (rooms[x].user.length == 0) {
      rooms.splice(rooms.findIndex(x => x.user.length == 0), 1)
    }
  }
}

runSocketServer();
runWebServer();