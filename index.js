const express = require("express");
const axios = require("axios");

const app = express();

const ws = 10; // window size
let wn = [];   // window numbers

const valid = ["p", "f", "e", "r"];

async function fetchNumber(id) {
  try {
    const response = await axios.get(`http://20.244.56.144/numbers/${id}`);
    return response.data.numbers || [];
  } catch (error) {
    return [];
  }
}

app.get("/numbers/:id", async (req, res) => {
  const id = req.params.id;

  if (!valid.includes(id)) {
    return res.status(400).json({ error: "invalid" });
  }

  const prev = [...wn];
  const fetched = await fetchNumber(id);

  for (let num of fetched) {
    if (!wn.includes(num)) {
      wn.push(num);
      if (wn.length > ws) {
        wn.shift(); // remove oldest
      }
    }
  }

  const avg = wn.reduce((sum, val) => sum + val, 0) / wn.length;

  res.json({
    windowPrevState: prev,
    windowCurrState: wn,
    numbers: fetched,
    avg: Number(avg.toFixed(2)),
  });
});

const port = 9876;

app.listen(port, (err) => {
  if (err) console.log(err);
  else console.log(`SERVER RUNNING ON PORT: ${port}`);
});
