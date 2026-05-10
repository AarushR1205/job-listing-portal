import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { Mistral } from '@mistralai/mistralai';

const getMistral = () => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return null;
    return new Mistral({ apiKey });
};

export const calculateATSScore = async (resumePath, job) => {
    try {
        if (!resumePath) return null;

        // Construct absolute path
        const backendRoot = path.resolve();
        const absolutePath = path.isAbsolute(resumePath)
            ? resumePath
            : path.join(backendRoot, resumePath);

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

        const client = getMistral();
        if (!client) return null;

        const prompt = `
        You are an expert ATS (Applicant Tracking System) parser.
        Evaluate the candidate's resume against the Job Description.

        Job Title: ${job.title}
        Job Qualifications & Responsibilities:
        ${job.qualifications}
        ${job.responsibilities}
        ${job.description}

        Candidate Resume Text:
        ${resumeText.substring(0, 10000)}

        Please provide a response formatted EXACTLY as a JSON object with these keys:
        "score": A number between 0 and 100 representing the match percentage.
        "feedback": A 2-3 sentence explanation of the score.
        "matchedSkills": An array of skill strings found in BOTH the resume and the job requirements.
        "missingSkills": An array of skill strings required by the job but NOT found in the resume.

        Return ONLY valid JSON. Do not include markdown codeblocks.
        `;

        const result = await client.chat.complete({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
        });

        let responseText = result.choices[0].message.content.trim();
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(responseText);

        return {
            score: data.score || 0,
            feedback: data.feedback || '',
            matchedSkills: Array.isArray(data.matchedSkills) ? data.matchedSkills : [],
            missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
        };
    } catch (err) {
        console.error('Error calculating ATS Score:', err.message);
        return null;
    }
};
