import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// We initialize it lazily inside the functions to allow the server to start even if the key is missing initially
const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables. Please add it to your .env file.");
    }
    return new GoogleGenerativeAI(apiKey);
};

// @desc    Generate Job Description, Qualifications, and Responsibilities
// @route   POST /api/ai/generate-job-desc
// @access  Private (Employer)
export const generateJobDescription = async (req, res) => {
    try {
        const { title, jobType } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Job title is required for generation.' });
        }

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert HR professional and technical recruiter.
        I need a professional job posting for the following role:
        Title: ${title}
        Job Type: ${jobType || 'Full-time'}
        
        Please provide a detailed response formatted EXACTLY as a JSON object with the following three keys:
        "description": A compelling 2-3 paragraph overview of the role and its impact.
        "qualifications": A bulleted list of required and preferred qualifications, education, and skills.
        "responsibilities": A bulleted list of the day-to-day duties and expectations.

        Return ONLY valid JSON. Do not include markdown codeblocks (like \`\`\`json) in your response, just the raw JSON object.
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Clean up the response in case it contains markdown formatting
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(responseText);

        res.status(200).json(data);
    } catch (error) {
        console.error('AI Job Description Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate content. Please ensure your GEMINI_API_KEY is valid.',
            error: error.message 
        });
    }
};

// @desc    Generate a tailored Cover Letter for a specific job
// @route   POST /api/ai/generate-cover-letter
// @access  Private (Job Seeker)
export const generateCoverLetter = async (req, res) => {
    try {
        const { jobTitle, jobDescription, userSkills } = req.body;

        if (!jobTitle || !jobDescription) {
            return res.status(400).json({ message: 'Job title and description are required.' });
        }

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert career coach helping a job seeker write a highly tailored, professional cover letter for a specific job.

        Job Title: ${jobTitle}
        Job Description:
        ${jobDescription}

        ${userSkills ? `The applicant has the following skills: ${userSkills}` : ''}

        Write a concise, compelling cover letter (3-4 paragraphs) expressing enthusiasm for the role and explaining why the candidate is a strong fit based on the job description. Do not include placeholder brackets like [Your Name] or [Company Name] at the top or bottom, just provide the main body text of the letter. Make it sound natural and professional.
        `;

        const result = await model.generateContent(prompt);
        const coverLetter = result.response.text().trim();

        res.status(200).json({ coverLetter });
    } catch (error) {
        console.error('AI Cover Letter Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate cover letter. Please ensure your GEMINI_API_KEY is valid.',
            error: error.message 
        });
    }
};

