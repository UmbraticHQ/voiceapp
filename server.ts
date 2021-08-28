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
  username: string;
  location: string;
  socket: WebSocket;
  constructor(uid: string,username: string, location: string, socket: any) {
    this.uid = uid;
    this.location = location;
    this.socket = socket;
    this.username = username;
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
const sockets = new Map < string,
  WebSocket > ()

// On new Socket
async function handleWs(sock: WebSocket) {
  //This will be executed every time a new Socket is created
  const uid = v4.generate()
  sockets.set(uid, sock)
  var checkUser = usercollection.list.find(x => x.uid == uid)
  if (checkUser == undefined) {
    usercollection.addUser(new User(uid,randomName(), "", sock))
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
      if (jobject.cmd == "exchangeRTC") {
        //exchangeRTC(JSON.stringify(jobject))
      }
      if (jobject.cmd == "getUsers") {

        var lc = usercollection.getLocation(uid);
        if (lc != undefined) {
          getUsers(JSON.stringify(jobject))
        }
      }
    }

    function removeUser(uid: any) {
      usercollection.rmUser(uid)
      rooms.forEach(room => {
        var CurrentUser = room.user.findIndex(user => user === uid);
        if (CurrentUser != -1) {

          room.user.splice(CurrentUser, 1);
        }
      });
      sockets.delete(uid)
    }

    function getUsers(jobject: string) {
      var local = usercollection.getLocation(uid);
      if (local != undefined) {
        var croom = rooms.find(x => x.location == local);
        console.log(croom)
        if (croom != undefined) {
          for (var xy = 0; xy < croom.user.length; xy++) {
            var b = sockets.get(croom.user[xy])
            if (b != undefined) {
              console.log(usercollection);
              var UserSum = [""];
              usercollection.list.forEach(user => {
                if(user.location == local){
                  UserSum.push(user.username)
                }
              });

              b.send(JSON.stringify(UserSum))
            }
          }
        }
      }
    }


    /*
    
    //d8637364-9aed-45cd-a724-b29c59ac54de  8-4-4-4-12
    function exchangeRTC(jobject: string) {
      var local = usercollection.getLocation(uid);
      var datalength = JSON.parse(jobject).data.length;
      if (local != undefined && datalength == 36) { // && jobject.id.length == 36
        var croom = rooms.find(x => x.location == local);
        if (croom != undefined) {
          //for every client in the channel do x
          for (var xy = 0; xy < croom.user.length; xy++) {
            var b = sockets.get(croom.user[xy])
            if (b != undefined) {
              b.send(jobject)
            }
          }
        }
      }
    }
    */
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
        if (req.url == "/peer.js") {
          const pathx = mpath + "/peer.js"
          const contetnt = await serveFile(req, pathx)
          req.respond(contetnt);
        } else if (req.url == "/server.js") {
          const pathx = mpath + "/server.js"
          const contetnt = await serveFile(req, pathx)
          req.respond(contetnt);
        } else {
          //console.log(req.url)
          const pathx = mpath + "/server.html"
          const contetnt = await serveFile(req, pathx)
          req.respond(contetnt);
        }
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

function randomName(){
	var firstname = ["Akward", "Tasty", "Samll", "Long", "Old", "Kind", "Horny", "Huge", "Generic", "Professor", "Doctor", "Mr", "Atomic"];
	var lastname= ["John", "Dan", "Daniel", "Hans", "Mikle", "Susi", "Johnathan", "Jotaro", "Kim", "Trevor", "Alien"];
	var rand_first = Math.floor(Math.random()*firstname.length); 
	var rand_last = Math.floor(Math.random()*lastname.length); 
  return firstname[rand_first]+lastname[rand_last]
}

runSocketServer();
runWebServer();