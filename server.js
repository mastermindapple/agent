const express = require("express");
const { google } = require("googleapis");

const app = express();

// MUST be first
app.use(express.json());

// Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// CREATE EVENT
app.post("/create-event", async (req, res) => {
  console.log("🔥 HIT /create-event");
  console.log("🔥 RAW BODY:", req.body);

  try {
    // DO NOT overcomplicate parsing
    const body = req.body;

    console.log("🔥 BODY AFTER EXPRESS PARSE:", body);

    const {
      title,
      description,
      start_time,
      end_time,
      timezone,
    } = body || {};

    // validation
    if (!title || !start_time || !end_time) {
      console.log("❌ Missing fields");
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
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

    console.log("📅 EVENT TO INSERT:", event);

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("✅ EVENT CREATED:", response.data.htmlLink);

    return res.json({
      success: true,
      event_link: response.data.htmlLink,
    });

  } catch (err) {
    console.error("🔥 CALENDAR ERROR FULL:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// health check
app.get("/", (req, res) => {
  res.send("Calendar API is running 🚀");
});

// render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});