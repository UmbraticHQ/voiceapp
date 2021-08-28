import { Webview } from "./src/webview/mod.ts";

//var test = await Deno.readTextFile("test.html")

const html = `
  <html>

  <body>
    <h1>Hello from deno v${Deno.version.deno}</h1>
  </body>
  </html>
`;
const webview = new Webview(
  { url: `data:text/html,${encodeURIComponent(html)}` },
);
await webview.run();