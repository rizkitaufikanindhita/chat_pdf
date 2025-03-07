const express = require("express");
const axios = require("axios");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

app.post("/upload-pdf", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "PDF file is required" });
        }

        const pdfData = await pdfParse(req.file.buffer);
        const pdfText = pdfData.text;

        res.json({ message: "PDF uploaded successfully", content: pdfText });
    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).json({ error: "Error processing PDF" });
    }
});

app.post("/ask", async (req, res) => {
    try {
        const { question, pdfContent } = req.body;
        if (!question || !pdfContent) {
            return res.status(400).json({ error: "Question and PDF content are required" });
        }

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: `Document content: ${pdfContent}\n\nQuestion: ${question}` }] }]
            }
        );

        const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";

        res.json({ question, answer });
    } catch (error) {
        console.error("Error getting response from Gemini:", error);
        res.status(500).json({ error: "Error getting response from Gemini" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Export for serverless
module.exports = app;