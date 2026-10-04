const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send(`
      <h1>What's in your head?</h1>
          <textarea rows="5" style="width:100%"></textarea>
              <br><button>Shape it</button>
                `);
                });

                app.listen(3000, () => console.log("Running on port 3000"));
                