const express = require("express");
const zlib = require("zlib");
const path = require("path");
const app = express();
app.use(express.json({ limit: "50kb" }));

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

                                                                                                app.get("/", (req, res) => {
                                                                                                  res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
                                                                                                      if (err) res.status(500).send("Missing public/index.html");
                                                                                                        });
                                                                                                        });

                                                                                                        app.get("/manifest.json", (req, res) => res.json({
                                                                                                          id: "/",
                                                                                                            name: "Idea Workspace",
                                                                                                              short_name: "Ideas",
                                                                                                                description: "Turn a rough idea into visual concepts with AI.",
                                                                                                                  start_url: "/",
                                                                                                                    scope: "/",
                                                                                                                      display: "standalone",
                                                                                                                        orientation: "portrait",
                                                                                                                          background_color: "#f6f7fb",
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

                                                                                                                                                app.use(express.static(path.join(__dirname, "public")));

                                                                                                                                                const SYSTEM_PROMPT = [
                                                                                                                                                  "You are a warm, sharp creative thinking partner. You help people turn a vague idea in their head into something they can see.",
                                                                                                                                                    "Reply with ONLY valid JSON and nothing else, in exactly this shape:",
                                                                                                                                                      '{"summary":"...","questions":["..."],"directions":[{"name":"A: ...","text":"...","palette":["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB"],"images":["...","...","..."]}]}',
                                                                                                                                                        "Rules:",
                                                                                                                                                          "- summary: 1 to 2 sentences saying what you understand the idea to be so far.",
                                                                                                                                                            "- questions: 0 to 3 short questions, only the ones that would most sharpen the idea. Never repeat a question that was already answered. Use an empty list if the idea is already clear.",
                                                                                                                                                              "- directions: exactly 3 clearly different creative directions named A, B and C. If clarifications were given, the directions must clearly reflect them.",
                                                                                                                                                                "- text: 2 to 3 sentences covering mood, colours and style.",
                                                                                                                                                                  "- palette: exactly 5 hex colours that fit the direction.",
                                                                                                                                                                    "- images: exactly 3 short, concrete image prompts (maximum 25 words each) describing a scene, object or moodboard for that direction. No text, logos or real people."
                                                                                                                                                                    ].join("\n");

                                                                                                                                                                    function cleanResult(raw) {
                                                                                                                                                                      const hex = /^#[0-9a-fA-F]{6}$/;
                                                                                                                                                                        const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
                                                                                                                                                                          const dirs = Array.isArray(raw.directions) ? raw.directions : [];
                                                                                                                                                                            const directions = dirs.slice(0, 3).map((d, i) => ({
                                                                                                                                                                                name: str(d && d.name, 80) || "Direction " + "ABC"[i],
                                                                                                                                                                                    text: str(d && d.text, 600),
                                                                                                                                                                                        palette: Array.isArray(d && d.palette) ? d.palette.filter((c) => typeof c === "string" && hex.test(c)).slice(0, 5) : [],
                                                                                                                                                                                            images: Array.isArray(d && d.images) ? d.images.map((s) => str(s, 200)).filter(Boolean).slice(0, 3) : []
                                                                                                                                                                                              })).filter((d) => d.text);
                                                                                                                                                                                                if (!directions.length) throw new Error("No directions in reply");
                                                                                                                                                                                                  return {
                                                                                                                                                                                                      summary: str(raw.summary, 400),
                                                                                                                                                                                                          questions: Array.isArray(raw.questions) ? raw.questions.map((q) => str(q, 200)).filter(Boolean).slice(0, 3) : [],
                                                                                                                                                                                                              directions: directions
                                                                                                                                                                                                                };
                                                                                                                                                                                                                }

                                                                                                                                                                                                                async function askGemini(key, model, userText) {
                                                                                                                                                                                                                  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
                                                                                                                                                                                                                      method: "POST",
                                                                                                                                                                                                                          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
                                                                                                                                                                                                                              body: JSON.stringify({
                                                                                                                                                                                                                                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                                                                                                                                                                                                                                          contents: [{ role: "user", parts: [{ text: userText }] }],
                                                                                                                                                                                                                                                generationConfig: { responseMimeType: "application/json" }
                                                                                                                                                                                                                                                    })
                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                        const data = await r.json();
                                                                                                                                                                                                                                                          if (!r.ok) {
                                                                                                                                                                                                                                                              console.log(JSON.stringify(data));
                                                                                                                                                                                                                                                                  const err = new Error((data.error && data.error.message) || String(r.status));
                                                                                                                                                                                                                                                                      err.api = true;
                                                                                                                                                                                                                                                                          throw err;
                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                              let text = data.candidates[0].content.parts.map((p) => p.text || "").join("").trim();
                                                                                                                                                                                                                                                                                text = text.replace(/```json|```/g, "").trim();
                                                                                                                                                                                                                                                                                  return cleanResult(JSON.parse(text));
                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                  app.post("/shape", async (req, res) => {
                                                                                                                                                                                                                                                                                    const idea = String((req.body && req.body.idea) || "").trim().slice(0, 2000);
                                                                                                                                                                                                                                                                                      if (!idea) return res.json({ error: "Please describe your idea first." });
                                                                                                                                                                                                                                                                                        const key = process.env.GEMINI_API_KEY;
                                                                                                                                                                                                                                                                                          if (!key) return res.json({ error: "The AI is not connected yet." });
                                                                                                                                                                                                                                                                                            const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
                                                                                                                                                                                                                                                                                              const answers = Array.isArray(req.body.answers) ? req.body.answers.slice(0, 12) : [];
                                                                                                                                                                                                                                                                                                let userText = "Idea: " + idea;
                                                                                                                                                                                                                                                                                                  if (answers.length) {
                                                                                                                                                                                                                                                                                                      userText += "\n\nClarifications so far:\n" + answers.map((a) =>
                                                                                                                                                                                                                                                                                                            "Q: " + String((a && a.q) || "").slice(0, 300) + "\nA: " + String((a && a.a) || "").slice(0, 500)
                                                                                                                                                                                                                                                                                                                ).join("\n");
                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                    let lastErr;
                                                                                                                                                                                                                                                                                                                      for (let attempt = 0; attempt < 2; attempt++) {
                                                                                                                                                                                                                                                                                                                          try {
                                                                                                                                                                                                                                                                                                                                return res.json(await askGemini(key, model, userText));
                                                                                                                                                                                                                                                                                                                                    } catch (e) {
                                                                                                                                                                                                                                                                                                                                          lastErr = e;
                                                                                                                                                                                                                                                                                                                                                console.log("attempt " + (attempt + 1) + " failed: " + e.message);
                                                                                                                                                                                                                                                                                                                                                      if (e.api) break;
                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                              if (lastErr && lastErr.api) return res.json({ error: "AI error: " + lastErr.message });
                                                                                                                                                                                                                                                                                                                                                                res.json({ error: "Something went wrong. Please try again." });
                                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                                const port = process.env.PORT || 3000;
                                                                                                                                                                                                                                                                                                                                                                app.listen(port, () => console.log("Running on port " + port));