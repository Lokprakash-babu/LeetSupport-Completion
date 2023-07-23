const express = require("express");

const app = express();
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function validateAccessToken(req, res, next) {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USERPOOL_ID, // mandatory, can't be overridden upon calling verify
    tokenUse: process.env.TOKEN_USE, // needs to be specified here or upon calling verify
    clientId: process.env.CLIENT_ID, // needs to be specified here or upon calling verify
  });
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access token missing." });
    }
    const payload = await verifier.verify(token);
    console.log("Token is valid. Payload:", payload);
    req.user = payload;
    next();
  } catch (err) {
    console.log("Token not valid!", err);
    return res.status(401).json({ error: "Invalid access token." });
  }
}
app.post("/completion", validateAccessToken, async (req, res) => {
  try {
    const requestBody = req.body;
    console.log("request body", requestBody);
    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    const responseJson = await response.json();
    console.log("response", responseJson);
    // Add your code here
    res.status(200).json(responseJson);
  } catch (err) {
    console.log("error", err);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});
app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
