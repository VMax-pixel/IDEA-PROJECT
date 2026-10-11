const express = require("express");
const app = express();
app.use(express.json());

const page = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#4f46e5">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon.svg">
<title>Idea Workspace</title>
<style>
body{font-family:sans-serif;max-width:600px;margin:0 auto;padding:16px;background:#fafafa}
textarea{width:100%;padding:10px;font-size:16px;box-sizing:border-box}
button{background:#4f46e5;color:#fff;border:0;padding:12px 20px;font-size:16px;border-radius:8px;margin-top:8px}
.card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:12px;margin-top:12px}
</style></head><body>
<h1>What's in your head?</h1>
<textarea id="idea" rows="5" placeholder="Describe your idea..."></textarea>
<button onclick="shape()">Shape it</button>
<div id="out"></div>
<script>
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js"); }
async function shape(){
  var idea = document.getElementById("idea").value;
    var out = document.getElementById("out");
      out.innerHTML = "Shaping...";
        var r = await fetch("/shape", {
            method: "POST",
                headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({idea: idea})
                      });
                        var data = await r.json();
                          out.innerHTML = data.directions.map(function(d){
                              return '<div class="card"><b>' + d.name + '</b><p>' + d.text + '</p></div>';
                                }).join("");
                                }
                                </script></body></html>`;

                                app.get("/", (req, res) => res.send(page));

                                app.get("/manifest.json", (req, res) => res.json({
                                  name: "Idea Workspace",
                                    short_name: "Ideas",
                                      start_url: "/",
                                        display: "standalone",
                                          background_color: "#fafafa",
                                            theme_color: "#4f46e5",
                                              icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
                                              }));

                                              app.get("/sw.js", (req, res) => {
                                                res.type("application/javascript");
                                                  res.send('self.addEventListener("fetch", function(){});');
                                                  });

                                                  app.get("/icon.svg", (req, res) => {
                                                    res.type("image/svg+xml");
                                                      res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#4f46e5"/><text x="256" y="340" font-size="280" text-anchor="middle" fill="#fff" font-family="sans-serif">I</text></svg>');
                                                      });

                                                      app.post("/shape", (req, res) => {
                                                        const idea = req.body.idea || "your idea";
                                                          res.json({
                                                              directions: [
                                                                    { name: "A: Bold & Colourful", text: "A vibrant, high-energy take on: " + idea },
                                                                          { name: "B: Minimal & Clean", text: "A calm, simple look for: " + idea },
                                                                                { name: "C: Warm & Handmade", text: "A cozy, textured feel for: " + idea }
                                                                                    ]
                                                                                      });
                                                                                      });

                                                                                      const port = process.env.PORT || 3000;
                                                                                      app.listen(port, () => console.log("Running on port " + port));9