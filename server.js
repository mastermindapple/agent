const express = require("express");
const { google } = require("googleapis");

const app = express();

// Use built-in JSON parser (better than body-parser)
app.use(express.json());

// Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// CREATE EVENT ENDPOINT
app.post("/create-event", async (req, res) => {
    console.log("🔥 HIT /create-event"); // 
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      timezone,
    } = req.body;

    // basic validation (prevents silent failures)
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, start_time, end_time",
      });
    }

    const authClient = await auth.getClient();

    const calendar = google.calendar({
      version: "v3",
      auth: authClient,
    });

    const event = {
      summary: title,
      description: description || "",
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
      calendarId: "dhingrajanavllc@gmail.com", // safer than hardcoding email
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

// Health check
app.get("/", (req, res) => {
  res.send("Calendar API is running 🚀");
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});