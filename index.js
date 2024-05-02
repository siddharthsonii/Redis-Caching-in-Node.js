const express = require("express");
const redis = require("redis");
const app = express();

const PORT = 5000;
const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);
(async () => {
  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  await client.connect();
  console.log("Connected to Redis");
})();

// Set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos </h2>`;
}

//Make request to Github for data
async function getRepos(req, res, next) {
  try {
    console.log("Fetching Data....");

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    // Convert response into JSON
    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    await client.set(username, repos);

    res.send(setResponse(username, repos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
}

// Cache Middleware
async function cache(req, res, next) {
  const { username } = req.params;

  const value = await client.get(username);
  res.send(setResponse(username, value));
}

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
