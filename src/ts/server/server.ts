import { serve } from "https://deno.land/std@0.97.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.97.0/http/file_server.ts";
import { path } from "https://deno.land/std@0.99.0/path/mod.ts";

// serve on port 5000
const s = serve({ port: 5000 });

console.log('Listening to port 5000 on http://localhost:5000');

// Wait for request and response with a text
for await (const req of s) {
  try{
  const pathx = path.basename(`${Deno.cwd()}/server/src${req.url}`);
  console.log(pathx)
  const contetnt = await serveFile(req, pathx)
  req.respond(contetnt);
  } catch(e){
    console.log("error")
  }
  
}