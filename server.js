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
function esc(s){ var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
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
                                                                                html += data.directions.map(function(d){
                                                                                      return '<div class="card"><b>' + esc(d.name) + '</b><p>' + esc(d.text) + '</p></div>';
                                                                                          }).join("");
                                                                                              out.innerHTML = html;
                                                                                                } catch (e) {
                                                                                                    out.innerHTML = '<div class="card">Something went wrong. Please try again.</div>';
                                                                                                      }
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