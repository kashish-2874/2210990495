const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const numberIdToUrl = {
  'p': 'http://20.244.56.144/evaluation-service/primes',
  'f': 'http://20.244.56.144/evaluation-service/fibo',
  'e': 'http://20.244.56.144/evaluation-service/even',
  'r': 'http://20.244.56.144/evaluation-service/rand'
};

const WINDOW_SIZE = 10;
let slidingWindow = [];

const fetchNumbers = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 500,
      headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ0NzAwNjQ4LCJpYXQiOjE3NDQ3MDAzNDgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc1NzliMThlLWM3MjctNGJkNC1iZjA5LTIwMGZkMWYyZDEwZCIsInN1YiI6Imthc2hpc2g0OTUuYmUyMkBjaGl0a2FyYS5lZHUuaW4ifSwiZW1haWwiOiJrYXNoaXNoNDk1LmJlMjJAY2hpdGthcmEuZWR1LmluIiwibmFtZSI6Imthc2hpc2ggYmFydGh3YWwiLCJyb2xsTm8iOiIyMjEwOTkwNDk1IiwiYWNjZXNzQ29kZSI6IlB3enVmRyIsImNsaWVudElEIjoiNzU3OWIxOGUtYzcyNy00YmQ0LWJmMDktMjAwZmQxZjJkMTBkIiwiY2xpZW50U2VjcmV0IjoiaE15VWdqdm5KSnRkUHZqeiJ9.kQy5E16MA4N_Zb2FgcdVFSmKubl0bHSmqECLnNA55K0"
      }
    });
    return response.data.numbers || [];
  } catch (error) {
    console.error(`Error fetching numbers from ${url}:`, error.message);
    return [];
  }
};

app.get('/numbers/:numberid', async (req, res) => {
  const numberId = req.params.numberid;

  if (!numberIdToUrl[numberId]) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  const url = numberIdToUrl[numberId];
  const windowPrevState = [...slidingWindow];
  const fetchedNumbers = await fetchNumbers(url);

  for (const num of fetchedNumbers) {
    if (!slidingWindow.includes(num)) {
      slidingWindow.push(num);
      if (slidingWindow.length > WINDOW_SIZE) {
        slidingWindow.shift();
      }
    }
  }

  const windowCurrState = [...slidingWindow];
  const avg = slidingWindow.length > 0
    ? parseFloat((slidingWindow.reduce((sum, num) => sum + num, 0) / slidingWindow.length).toFixed(2))
    : 0;

  res.json({
    windowPrevState,
    windowCurrState,
    numbers: fetchedNumbers,
    avg
  });
});

const PORT = 9876;
app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log(`Server running on Port: ${PORT}`);
});
