const express = require("express");
const zlib = require("zlib");
const app = express();
app.use(express.json());

const page = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#4f46e5">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon-192.png">
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
function esc(s){ var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
var dirs = [];
var lastIdea = "";
function see(i){
  var d = dirs[i];
    var box = document.getElementById("img" + i);
      var prompt = (lastIdea + ". " + d.name.replace(/^[A-C]: /, "") + ". " + d.text).slice(0, 400);
        var url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=768&height=512&nologo=true&seed=" + Math.floor(Math.random() * 100000);
          box.innerHTML = "Creating your image (this can take up to 30 seconds)...";
            var img = new Image();
              img.style.width = "100%";
                img.style.borderRadius = "8px";
                  img.onload = function(){ box.innerHTML = ""; box.appendChild(img); };
                    img.onerror = function(){ box.innerHTML = "The image service is busy right now. Tap See it again in a moment."; };
                      img.src = url;
                      }
                      async function shape(){
                        var idea = document.getElementById("idea").value;
                          var out = document.getElementById("out");
                            out.innerHTML = "Shaping your idea...";
                              try {
                                  var r = await fetch("/shape", {
                                        method: "POST",
                                              headers: {"Content-Type": "application/json"},
                                                    body: JSON.stringify({idea: idea})
                                                        });
                                                            var data = await r.json();
                                                                if (data.error) { out.innerHTML = '<div class="card">' + esc(data.error) + '</div>'; return; }
                                                                    var html = "";
                                                                        if (data.questions && data.questions.length) {
                                                                              html += '<div class="card"><b>Questions to think about</b><ul>' +
                                                                                      data.questions.map(function(q){ return '<li>' + esc(q) + '</li>'; }).join("") +
                                                                                              '</ul></div>';
                                                                                                  }
                                                                                                      dirs = data.directions;
                                                                                                          lastIdea = idea;
                                                                                                              html += data.directions.map(function(d, i){
                                                                                                                    return '<div class="card"><b>' + esc(d.name) + '</b><p>' + esc(d.text) + '</p><button onclick="see(' + i + ')">See it</button><div id="img' + i + '" style="margin-top:8px"></div></div>';
                                                                                                                        }).join("");
                                                                                                                            out.innerHTML = html;
                                                                                                                              } catch (e) {
                                                                                                                                  out.innerHTML = '<div class="card">Something went wrong. Please try again.</div>';
                                                                                                                                    }
                                                                                                                                    }
                                                                                                                                    </script></body></html>`;

                                                                                                                                    function crc32(buf) {
                                                                                                                                      let crc = 0xffffffff;
                                                                                                                                        for (let i = 0; i < buf.length; i++) {
                                                                                                                                            crc ^= buf[i];
                                                                                                                                                for (let k = 0; k < 8; k++) crc = (crc & 1) ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
                                                                                                                                                  }
                                                                                                                                                    return (crc ^ 0xffffffff) >>> 0;
                                                                                                                                                    }
                                                                                                                                                    function chunk(type, data) {
                                                                                                                                                      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
                                                                                                                                                        const t = Buffer.from(type);
                                                                                                                                                          const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
                                                                                                                                                            return Buffer.concat([len, t, data, crc]);
                                                                                                                                                            }
                                                                                                                                                            function makeIcon(size) {
                                                                                                                                                              const bg = [79, 70, 229], fg = [255, 255, 255];
                                                                                                                                                                const row = size * 4 + 1;
                                                                                                                                                                  const raw = Buffer.alloc(row * size);
                                                                                                                                                                    for (let y = 0; y < size; y++) {
                                                                                                                                                                        raw[y * row] = 0;
                                                                                                                                                                            for (let x = 0; x < size; x++) {
                                                                                                                                                                                  const inI = x > size * 0.44 && x < size * 0.56 && y > size * 0.28 && y < size * 0.72;
                                                                                                                                                                                        const c = inI ? fg : bg;
                                                                                                                                                                                              const o = y * row + 1 + x * 4;
                                                                                                                                                                                                    raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255;
                                                                                                                                                                                                        }
                                                                                                                                                                                                          }
                                                                                                                                                                                                            const ihdr = Buffer.alloc(13);
                                                                                                                                                                                                              ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
                                                                                                                                                                                                                ihdr[8] = 8; ihdr[9] = 6;
                                                                                                                                                                                                                  return Buffer.concat([
                                                                                                                                                                                                                      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
                                                                                                                                                                                                                          chunk("IHDR", ihdr),
                                                                                                                                                                                                                              chunk("IDAT", zlib.deflateSync(raw)),
                                                                                                                                                                                                                                  chunk("IEND", Buffer.alloc(0))
                                                                                                                                                                                                                                    ]);
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                    const icon192 = makeIcon(192);
                                                                                                                                                                                                                                    const icon512 = makeIcon(512);

                                                                                                                                                                                                                                    app.get("/", (req, res) => res.send(page));

                                                                                                                                                                                                                                    app.get("/manifest.json", (req, res) => res.json({
                                                                                                                                                                                                                                      id: "/",
                                                                                                                                                                                                                                        name: "Idea Workspace",
                                                                                                                                                                                                                                          short_name: "Ideas",
                                                                                                                                                                                                                                            description: "Turn a rough idea into visual concepts with AI.",
                                                                                                                                                                                                                                              start_url: "/",
                                                                                                                                                                                                                                                scope: "/",
                                                                                                                                                                                                                                                  display: "standalone",
                                                                                                                                                                                                                                                    orientation: "portrait",
                                                                                                                                                                                                                                                      background_color: "#fafafa",
                                                                                                                                                                                                                                                        theme_color: "#4f46e5",
                                                                                                                                                                                                                                                          icons: [
                                                                                                                                                                                                                                                              { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                                                                                                                                                                                                                                                                  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                                                                                                                                                                                                                                                                      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
                                                                                                                                                                                                                                                                        ]
                                                                                                                                                                                                                                                                        }));

                                                                                                                                                                                                                                                                        app.get("/icon-192.png", (req, res) => { res.type("image/png"); res.send(icon192); });
                                                                                                                                                                                                                                                                        app.get("/icon-512.png", (req, res) => { res.type("image/png"); res.send(icon512); });

                                                                                                                                                                                                                                                                        app.get("/sw.js", (req, res) => {
                                                                                                                                                                                                                                                                          res.type("application/javascript");
                                                                                                                                                                                                                                                                            res.send('self.addEventListener("install", function(){ self.skipWaiting(); });self.addEventListener("fetch", function(){});');
                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                            const SYSTEM_PROMPT = "You are a creative director who helps people turn a rough idea into visual concepts. Reply with ONLY valid JSON and nothing else, in exactly this shape: {\"questions\":[\"...\",\"...\"],\"directions\":[{\"name\":\"A: ...\",\"text\":\"...\"},{\"name\":\"B: ...\",\"text\":\"...\"},{\"name\":\"C: ...\",\"text\":\"...\"}]}. Give 2 to 3 short clarifying questions, and exactly 3 clearly different creative directions. Each direction text is 2 to 3 sentences covering mood, colours and style.";

                                                                                                                                                                                                                                                                            app.post("/shape", async (req, res) => {
                                                                                                                                                                                                                                                                              const idea = (req.body.idea || "").trim();
                                                                                                                                                                                                                                                                                if (!idea) return res.json({ error: "Please describe your idea first." });
                                                                                                                                                                                                                                                                                  const key = process.env.GEMINI_API_KEY;
                                                                                                                                                                                                                                                                                    if (!key) return res.json({ error: "The AI is not connected yet." });
                                                                                                                                                                                                                                                                                      const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
                                                                                                                                                                                                                                                                                        try {
                                                                                                                                                                                                                                                                                            const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
                                                                                                                                                                                                                                                                                                  method: "POST",
                                                                                                                                                                                                                                                                                                        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
                                                                                                                                                                                                                                                                                                              body: JSON.stringify({
                                                                                                                                                                                                                                                                                                                      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                                                                                                                                                                                                                                                                                                                              contents: [{ role: "user", parts: [{ text: idea }] }],
                                                                                                                                                                                                                                                                                                                                      generationConfig: { responseMimeType: "application/json" }
                                                                                                                                                                                                                                                                                                                                            })
                                                                                                                                                                                                                                                                                                                                                });
                                                                                                                                                                                                                                                                                                                                                    const data = await r.json();
                                                                                                                                                                                                                                                                                                                                                        if (!r.ok) {
                                                                                                                                                                                                                                                                                                                                                              console.log(JSON.stringify(data));
                                                                                                                                                                                                                                                                                                                                                                    return res.json({ error: "AI error: " + ((data.error && data.error.message) || r.status) });
                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                            let text = data.candidates[0].content.parts.map(function(p){ return p.text || ""; }).join("").trim();
                                                                                                                                                                                                                                                                                                                                                                                text = text.replace(/```json|```/g, "").trim();
                                                                                                                                                                                                                                                                                                                                                                                    res.json(JSON.parse(text));
                                                                                                                                                                                                                                                                                                                                                                                      } catch (e) {
                                                                                                                                                                                                                                                                                                                                                                                          console.log(e);
                                                                                                                                                                                                                                                                                                                                                                                              res.json({ error: "Something went wrong. Please try again." });
                                                                                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                                                                const port = process.env.PORT || 3000;
                                                                                                                                                                                                                                                                                                                                                                                                app.listen(port, () => console.log("Running on port " + port));