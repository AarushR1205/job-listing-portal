import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { GoogleGenerativeAI } from '@google/generative-ai';

const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

export const calculateATSScore = async (resumeRelativePath, job) => {
    try {
        if (!resumeRelativePath) return null;
        
        // Construct absolute path
        // Assuming resumeRelativePath is relative to the backend root (e.g., 'uploads/...')
        const backendRoot = path.resolve();
        const absolutePath = path.join(backendRoot, resumeRelativePath);
        
        if (!fs.existsSync(absolutePath)) {
            console.warn(`Resume file not found at ${absolutePath}`);
            return null;
        }

        // Parse PDF
        const dataBuffer = fs.readFileSync(absolutePath);
        const pdfData = await pdf(dataBuffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length === 0) {
           return null;
        }

        const genAI = getGenAI();
        if (!genAI) return null;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are an expert ATS (Applicant Tracking System) parser.
        Evaluate the candidate's resume against the Job Description.

        Job Title: ${job.title}
        Job Qualifications & Responsibilities:
        ${job.qualifications}
        ${job.responsibilities}
        ${job.description}

        Candidate Resume Text:
        ${resumeText.substring(0, 10000)} // Truncate to avoid token limits

        Please provide a detailed response formatted EXACTLY as a JSON object with:
        "score": A number between 0 and 100 representing the match percentage.
        "feedback": A 2-3 sentence explanation of the score.

        Return ONLY valid JSON. Do not include markdown codeblocks.
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(responseText);
        
        return {
            score: data.score || 0,
            feedback: data.feedback || ''
        };
    } catch (err) {
        console.error('Error calculating ATS Score:', err.message);
        return null; // Gracefully fail
    }
};
