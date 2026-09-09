import express from "express";
import Database from "better-sqlite3";

const app = express();
const database = new Database("server/voltix.db");

database.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

app.use((req, res, next) => {
    res.header(
        "Access-Control-Allow-Origin",
        "*",
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Nuvra backend is running");
});

app.post("/api/contact", (req, res) => {
    const {name, email, subject, message} = req.body ?? {};

    if(
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof subject !== "string" ||
        typeof message !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !subject.trim() ||
        !message.trim()
    ) {
        return res.status(400).json({
            error: "All fields are required",
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailPattern.test(email.trim())) {
        return res.status(400).json({
            error: "Please provide a valid email address",
        });
    }

    try {
        const insertInquiry = database.prepare(`
            INSERT INTO inquiries (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `);

        insertInquiry.run(
            name.trim(),
            email.trim(),
            subject.trim(),
            message.trim(),
        );

        return res.status(201).json({
            message: "Inquiry received successfully",
        });
    } catch {
        return res.status(500).json({
            error: "Could not save inquiry",
        });
    }
});


const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
