// resumeParser.js
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import JSZip from "jszip";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Main parser
export const parseResume = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Processing file:", file.name, "Type:", file.type);

            const extractedInfo = await enhancedLocalParsing(file);
            console.log("Extracted information:", extractedInfo);

            resolve(extractedInfo);
        } catch (error) {
            console.error("Error parsing resume:", error);
            resolve(createIntelligentFallback(file.name));
        }
    });
};

// Enhanced local parsing with real text extraction
const enhancedLocalParsing = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                let text = "";

                if (file.type === "application/pdf") {
                    text = await extractPDFText(arrayBuffer);
                } else if (
                    file.type ===
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ) {
                    text = await extractDOCXText(arrayBuffer);
                }

                console.log("Extracted text length:", text.length);
                console.log("Text preview:", text.substring(0, 300));

                const extractedInfo = extractInfoFromText(text, file.name);
                resolve(extractedInfo);
            } catch (error) {
                console.error("Parsing error:", error);
                resolve(createIntelligentFallback(file.name));
            }
        };

        reader.onerror = () => {
            resolve(createIntelligentFallback(file.name));
        };

        reader.readAsArrayBuffer(file);
    });
};

// ✅ PDF text extraction with pdf.js
const extractPDFText = async (arrayBuffer) => {
    try {
        const typedArray = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map((item) => item.str);
            text += strings.join(" ") + "\n";
        }

        return text;
    } catch (error) {
        console.error("PDF extraction error:", error);
        return "";
    }
};

// ✅ DOCX text extraction with JSZip
const extractDOCXText = async (arrayBuffer) => {
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const doc = zip.file("word/document.xml");
        if (!doc) return "";

        const content = await doc.async("string");
        // Extract text between XML tags
        const matches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        return matches ? matches.map((t) => t.replace(/<.*?>/g, "")).join(" ") : "";
    } catch (error) {
        console.error("DOCX extraction error:", error);
        return "";
    }
};

// ✅ Extract structured info (Name, Email, Phone) from text
const extractInfoFromText = (text, filename) => {
    // Extract email
    const emailMatch = text.match(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    );
    const email = emailMatch ? emailMatch[0] : "";

    // Extract phone
    const phoneMatch = text.match(
        /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
    );
    const phone = phoneMatch ? phoneMatch[0] : "";

    // Extract name using multiple strategies
    let name = extractNameFromText(text);
    if (!name) {
        name = extractNameFromFilename(filename);
    }

    console.log("Extraction results:", { name, email, phone });

    return {
        name,
        email,
        phone,
        rawText: text.substring(0, 1000), // preview first 1000 chars
        note:
            !email || !phone
                ? "Some information is missing. Please fill manually."
                : "Information extracted from document. Please verify below.",
    };
};

// ✅ Improved name extraction from text
const extractNameFromText = (text) => {
    if (!text) return "";

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Strategy 1: Look for name at the very beginning (most resumes start with name)
    if (lines.length > 0) {
        const firstLine = lines[0];
        const nameCandidate = extractNameFromLine(firstLine);
        if (nameCandidate) {
            console.log("✅ Found name in first line:", nameCandidate);
            return nameCandidate;
        }
    }

    // Strategy 2: Look for common name patterns in first few lines
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        const nameCandidate = extractNameFromLine(line);
        if (nameCandidate) {
            console.log("✅ Found name in line", i + 1, ":", nameCandidate);
            return nameCandidate;
        }
    }

    // Strategy 3: Look for name before contact info
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // If this line looks like a name and next line has contact info
        if (isLikelyNameLine(line) && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            if (hasContactInfo(nextLine)) {
                const nameCandidate = extractNameFromLine(line);
                if (nameCandidate) {
                    console.log("✅ Found name before contact info:", nameCandidate);
                    return nameCandidate;
                }
            }
        }
    }

    console.log("❌ No name found in text content");
    return "";
};

// ✅ Extract name from a single line
const extractNameFromLine = (line) => {
    // Remove common resume headers and unwanted patterns
    const cleanLine = line
        .replace(/^(resume|curriculum vitae|cv|portfolio|profile):?\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Look for 2-4 capitalized words (typical name pattern)
    const namePatterns = [
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/, // Exactly 2-4 capitalized words
        /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/, // Exactly 2 capitalized words
        /^([A-Z][a-z]+\s+[A-Z]\.?\s*[A-Z][a-z]+)$/, // First Middle Last
    ];

    for (const pattern of namePatterns) {
        const match = cleanLine.match(pattern);
        if (match && match[1]) {
            const candidate = match[1].trim();
            // Validate it's a reasonable name (not too long, not all caps, etc.)
            if (isValidName(candidate)) {
                return candidate;
            }
        }
    }

    return "";
};

// ✅ Check if a line is likely to contain a name
const isLikelyNameLine = (line) => {
    if (!line || line.length > 50) return false;

    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;

    // Check if most words start with capital letters
    const capitalWords = words.filter(word => /^[A-Z][a-z]*$/.test(word));
    return capitalWords.length >= 2;
};

// ✅ Check if a line contains contact information
const hasContactInfo = (line) => {
    return line && (
        line.includes('@') || // email
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) || // phone
        line.toLowerCase().includes('phone') ||
        line.toLowerCase().includes('email') ||
        line.toLowerCase().includes('contact')
    );
};

// ✅ Validate if extracted text is a reasonable name
const isValidName = (name) => {
    if (!name || name.length < 4 || name.length > 50) return false;

    const words = name.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;

    // Check for common non-name patterns
    const invalidPatterns = [
        /http/i,
        /www\./i,
        /\.com/i,
        /\.org/i,
        /resume/i,
        /cv/i,
        /portfolio/i,
        /profile/i,
        /linkedin/i,
        /github/i,
        /phone/i,
        /email/i,
        /address/i,
        /\d/ // numbers
    ];

    return !invalidPatterns.some(pattern => pattern.test(name));
};

// ✅ Fallback when parsing fails
const createIntelligentFallback = (filename) => {
    const name = extractNameFromFilename(filename);
    return {
        name: name,
        email: "",
        phone: "",
        rawText: `File: ${filename}`,
        note: "Automatic parsing failed. Please enter your information manually.",
    };
};

// ✅ Extract name from filename (fallback only)
const extractNameFromFilename = (filename) => {
    let cleanName = filename
        .replace(/\.(pdf|docx?)$/i, "")
        .replace(/(resume|cv|_|-)/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    const parts = cleanName
        .split(" ")
        .filter(
            (part) =>
                part.length > 1 &&
                /^[A-Za-z]+$/.test(part) &&
                !part.match(/^(resume|cv)$/i)
        );

    if (parts.length >= 2) {
        return parts
            .slice(0, 3)
            .map(
                (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
            )
            .join(" ");
    } else if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    }

    return "Your Name";
};