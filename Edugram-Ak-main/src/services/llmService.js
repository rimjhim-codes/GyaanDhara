const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'deepseek-r1:1.5b';

/**
 * Helper to call Ollama Streams
 * In this implementation, we wait for full generation rather than streaming for simplicity,
 * though a production app would use stream: true and process chunks.
 */
async function generateFromOllama(prompt) {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error communicating with Ollama:", error);
    throw new Error('Failed to connect to Local LLM. Ensure Ollama is running and CORS is configured.');
  }
}

/**
 * Removes <think> blocks strictly used by DeepSeek R1 models
 */
function stripThinkBlocks(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Generates a syllabus JSON based on the user's topic
 */
export async function generateSyllabus(topic) {
  const prompt = `You are an expert tutor. Create a detailed, step-by-step syllabus to learn "${topic}".
Output ONLY valid JSON consisting of an array of objects. Do not include any markdown formatting, only the raw JSON.
Each object should have:
- "title": Title of the subtopic
- "description": A brief one-sentence description

Example format:
[
  { "title": "Introduction to X", "description": "Basic concepts and definitions." }
]`;

  const rawText = await generateFromOllama(prompt);
  const cleanText = stripThinkBlocks(rawText);

  try {
    // Try to parse out the JSON if there's markdown wrappings incorrectly provided
    const match = cleanText.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : cleanText);
  } catch (e) {
    throw new Error('Failed to parse syllabus from LLM. Raw output: ' + cleanText);
  }
}

/**
 * Generates learning content for a specific subtopic, optionally with custom instructions
 */
export async function generateContent(mainTopic, subtopic, customInstructions = "") {
  let prompt = `You are a personalized, expert tutor helping a student learn "${mainTopic}". 
Please provide detailed, engaging, and clear educational content for the specific subtopic: "${subtopic}".
Use markdown formatting (headers, bullet points, bold text). Include examples where applicable.`;

  if (customInstructions) {
    prompt += `\n\nThe student has requested the following specific changes or focus for this explanation: "${customInstructions}". Please incorporate this into your explanation.`;
  }

  prompt += `\n\nEnd with a brief 1-sentence thought-provoking question related to the topic.`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

/**
 * Generates a 3-question quiz for a topic using plain text formatting (reliable for 1.5b)
 */
export async function generateQuiz(topic, subtopic, difficulty = 'medium') {
  const difficultyInstructions = {
    easy: 'Create simple questions that test basic understanding.',
    medium: 'Create moderate questions that test application of concepts.',
    hard: 'Create challenging questions that require deep analysis and synthesis.'
  };

  const prompt = `You are an expert tutor. Create a 3-question multiple choice quiz about: "${subtopic}" (context: "${topic}").
Difficulty level: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

DO NOT use JSON. You MUST use EXACTLY this plain text format for each question:

Q1. [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [A, B, C, or D]
Explanation: [Brief explanation]

Q2. [Question text here]
A) [Option A]
...and so on for 3 questions.`;

  const rawText = await generateFromOllama(prompt);
  let cleanText = stripThinkBlocks(rawText);

  try {
    const questionsList = [];
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentQuestion = null;
    let currentOptions = [];
    let currentAnswer = -1;
    let currentExplanation = '';

    const pushQuestion = () => {
      if (currentQuestion && currentOptions.length >= 2) {
        questionsList.push({
          question: currentQuestion,
          options: [...currentOptions],
          correctAnswer: currentAnswer >= 0 && currentAnswer < currentOptions.length ? currentAnswer : 0,
          explanation: currentExplanation || "No explanation provided."
        });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      // Strip leading markdown formatting chars (asterisks, dashes, hashes, etc.)
      const line = lines[i].replace(/^\s*[\*\_\-\#]+\s*/, '');

      // Detect Question: Starts with Q1., Question 1:, 1., 1) etc.
      const isQuestionPattern = line.match(/^(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\:\)])/i);

      // Detect Option: Starts with A), A., 1), 1.
      const isOptionAlpha = line.match(/^[A-D][\.\)]\s*/i);
      const isOptionNum = line.match(/^[1-4][\.\)]\s*/i);

      if (isQuestionPattern || (line.endsWith('?') && !isOptionAlpha && !isOptionNum && !currentQuestion)) {
        pushQuestion(); // Save the previous question before starting a new one

        let qText = line;
        if (isQuestionPattern) {
          // Strip the "Q1:" or "Q1.**" prefix
          qText = line.replace(/^(?:Q(?:uestion)?\s*\d+[\.\:\)]|\d+[\.\:\)])[\*\_\s]*/i, '');
        }
        currentQuestion = qText;
        currentOptions = [];
        currentAnswer = -1;
        currentExplanation = '';
      }
      else if (isOptionAlpha) {
        currentOptions.push(line.replace(/^[A-D][\.\)]\s*/i, '').replace(/^[\*\_\s]+|[\*\_\s]+$/g, ''));
      }
      else if (isOptionNum) {
        // If the options are numbered 1-4
        currentOptions.push(line.replace(/^[1-4][\.\)]\s*/i, '').replace(/^[\*\_\s]+|[\*\_\s]+$/g, ''));
      }
      else if (line.toLowerCase().startsWith('answer')) { // Matches Answer: or Answer** or Answer:**
        const ansStr = line.replace(/^answer[\*\_\:\s]*/i, '').trim();
        const cleanAnsStr = ansStr.replace(/^[\*\_\-\s]+/, ''); // Just in case "Answer: **A)"
        const ansChar = cleanAnsStr.charAt(0).toUpperCase(); // Extract 'A'

        if (ansChar >= 'A' && ansChar <= 'D') {
          currentAnswer = ansChar.charCodeAt(0) - 65; // A=0, B=1, ...
        } else if (ansChar >= '1' && ansChar <= '4') {
          currentAnswer = parseInt(ansChar, 10) - 1;  // 1=0, 2=1, ...
        }
      }
      else if (line.toLowerCase().startsWith('explanation')) {
        currentExplanation = line.replace(/^explanation[\*\_\:\s]*/i, '').trim();
      }
    }
    pushQuestion(); // Make sure to save the last question processed

    if (questionsList.length === 0) {
      throw new Error("Could not parse options or answer from text.");
    }

    // Limit to 3 questions max just in case
    return questionsList.slice(0, 3);
  } catch (e) {
    console.error("Quiz Parse Error. Raw output was:", cleanText);
    throw new Error('LLM output format was unreadable. Try regenerating.');
  }
}

/**
 * Generates practical assignment exercises based on the topic
 */
export async function generateAssignment(topic, subtopic) {
  const prompt = `You are an expert tutor. Create 2 practical assignment exercises for the subtopic: "${subtopic}" (in context of "${topic}").
Format EXACTLY like this:

**Exercise 1:**
Description: [A clear problem statement or task description]
Difficulty: Easy
Instructions: [Step-by-step instructions]
Expected Outcome: [What the student should produce/learn]

**Exercise 2:**
Description: [Another practical exercise]
Difficulty: Medium
Instructions: [Detailed steps]
Expected Outcome: [Expected result/learning]

Make the exercises practical, hands-on, and progressively challenging.`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

/**
 * Generates feedback for submitted assignments
 */
export async function generateAssignmentFeedback(topic, subtopic, submission) {
  const prompt = `You are an expert tutor providing constructive feedback.
Topic: "${topic}"
Subtopic: "${subtopic}"
Student's Submission: "${submission}"

Provide feedback in this format:
**Score: X/10**
**Strengths:**
- [What they did well]

**Areas for Improvement:**
- [What needs work]

**Suggestions:**
- [Specific actionable suggestions]

**Next Steps:**
[Brief guidance on what to practice next]`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

/**
 * Generates practice problems for a topic
 */
export async function generatePracticeProblems(topic, subtopic, difficulty = 'medium') {
  const prompt = `You are an expert tutor. Create 3 practice problems for "${subtopic}" (part of "${topic}").
Difficulty level: ${difficulty.toUpperCase()}

Format:
**Problem 1:**
[Problem statement]
(Space for student answer)

**Problem 2:**
[Problem statement]
(Space for student answer)

**Problem 3:**
[Problem statement]
(Space for student answer)

**Answer Key:**
Problem 1: [Answer and brief explanation]
Problem 2: [Answer and brief explanation]
Problem 3: [Answer and brief explanation]

Make problems progressively challenging and include real-world applications.`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

/**
 * Generates smart notes from content with key points, summary, and highlights
 */
export async function generateSmartNotes(content) {
  const prompt = `Analyze this learning content and create study notes with:
1. Key Points (bullet-pointed main ideas)
2. Summary (brief 2-3 sentence overview)
3. Important Terms (bold the technical terms)
4. Practice Tips (how to remember this)

Content to analyze:
"${content}"

Format your response clearly with these sections.`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

/**
 * Generates a comprehensive study guide for a topic
 */
export async function generateStudyGuide(topic, subtopic, content) {
  const prompt = `Create a comprehensive study guide for: "${subtopic}" (part of "${topic}")

Include:
1. Learning Objectives: What students should learn
2. Key Concepts: Main ideas explained simply
3. Important Formulas/Rules: If applicable
4. Real-World Applications: How this is used
5. Common Mistakes: What students often get wrong
6. Study Tips: How to master this topic
7. Review Questions: 3-4 questions for self-testing

Content reference:
"${content.substring(0, 500)}..."

Make it concise but comprehensive.`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

/**
 * Generates flashcard questions from content
 */
export async function generateFlashcards(topic, subtopic, content) {
  const prompt = `Create 5 flashcard pairs (Q&A) for: "${subtopic}"

Format:
**Card 1:**
Q: [Question]
A: [Answer]

**Card 2:**
Q: [Question]
A: [Answer]

(continue for 5 cards)

Make questions progressively harder and cover key concepts.`;

  const rawText = await generateFromOllama(prompt);
  return stripThinkBlocks(rawText);
}

