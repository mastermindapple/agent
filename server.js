const express = require("express");
const { google } = require("googleapis");

const app = express();

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
    let data = req.body;

    // STEP 1: handle nested voice payload
    if (data.event_data) {
      let raw = data.event_data;

      // STEP 2: fix invalid JSON (single quotes → double quotes)
      raw = raw.replace(/'/g, '"');

      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error("❌ Failed to parse event_data:", raw);
        return res.status(400).json({
          success: false,
          error: "Invalid event_data format",
        });
      }
    }

    console.log("🔥 PARSED DATA:", data);

    const {
      title,
      description,
      start_time,
      end_time,
      timezone,
    } = data;

    // validation
    if (!title || !start_time || !end_time) {
      console.log("❌ Missing fields");
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        received: data,
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

    console.log("📅 EVENT TO CREATE:", event);

    const response = await calendar.events.insert({
      calendarId: "dhingrajanavllc@gmail.com",
      resource: event,
    });

    console.log("✅ EVENT CREATED:", response.data.htmlLink);

    return res.json({
      success: true,
      event_link: response.data.htmlLink,
    });

  } catch (err) {
    console.error("🔥 CALENDAR ERROR:", err);

    return res.status(500).json({
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