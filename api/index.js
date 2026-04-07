require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors({
  origin: "*",  // update to your Vercel URL after deploy e.g. "https://your-app.vercel.app"
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET all students (with optional filters)
app.get("/api/students", async (req, res) => {
  try {
    const { skill, activity, violation, affiliation, search } = req.query;
    let query = supabase.from("students").select("*");

    if (skill) query = query.contains("skills", [skill]);
    if (activity) query = query.contains("non_academic_activities", [activity]);
    if (violation) query = query.contains("violations", [violation]);
    if (affiliation) query = query.contains("affiliations", [affiliation]);
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message, details: error });
    }
    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single student
app.get("/api/students/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create student
app.post("/api/students", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update student
app.put("/api/students/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(3001, () => console.log("API running on http://localhost:3001"));
}
