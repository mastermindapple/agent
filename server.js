const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const app = express();
app.use(bodyParser.json());

// Google Auth (safe for deployment)
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "service-account.json",
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// CREATE EVENT ENDPOINT
app.post("/create-event", async (req, res) => {
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      timezone,
    } = req.body;

    const authClient = await auth.getClient();

    const calendar = google.calendar({
      version: "v3",
      auth: authClient,
    });

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: start_time,
        timeZone: timezone || "Asia/Kolkata",
      },
      end: {
        dateTime: end_time,
        timeZone: timezone || "Asia/Kolkata",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary", // safer than hardcoding email
      resource: event,
    });

    res.json({
      success: true,
      event_link: response.data.htmlLink,
    });

  } catch (err) {
    console.error("Calendar Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// HEALTH CHECK ROUTE (important for Render)
app.get("/", (req, res) => {
  res.send("Calendar API is running 🚀");
});

// IMPORTANT: Render uses process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});