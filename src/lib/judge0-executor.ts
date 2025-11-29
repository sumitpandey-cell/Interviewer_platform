// Judge0 Code Executor
// Sign up at https://judge0.com or use RapidAPI
// Free tier: https://rapidapi.com/judge0-official/api/judge0-ce

export interface TestCase {
    input: string;
    output: string;
}

export interface ExecutionResult {
    passed: boolean;
    output: string;
    error?: string;
    executionTime?: number;
    testResults?: {
        input: string;
        expected: string;
        actual: string;
        passed: boolean;
        error?: string;
    }[];
}

// Language ID mapping for Judge0
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
    javascript: 63,  // Node.js
    python: 71,      // Python 3
    java: 62,        // Java
    cpp: 54,         // C++ (GCC 9.2.0)
    c: 50,           // C (GCC 9.2.0)
    typescript: 74,  // TypeScript
    go: 60,          // Go
    rust: 73,        // Rust
};

// Configuration
const JUDGE0_CONFIG = {
    // Option 1: Use RapidAPI (Recommended for production)
    rapidApiUrl: 'https://judge0-ce.p.rapidapi.com/submissions',
    rapidApiKey: import.meta.env.VITE_RAPIDAPI_KEY || '',

    // Option 2: Self-hosted or Judge0 CE (Community Edition)
    // selfHostedUrl: 'http://localhost:2358/submissions',

    // Option 3: Use public instance (Limited, not for production)
    publicUrl: 'https://judge0-ce.p.rapidapi.com/submissions',
};

/**
 * Execute code using Judge0 API
 */
export async function executeCodeWithJudge0(
    code: string,
    language: string,
    testCases: TestCase[]
): Promise<ExecutionResult> {
    const languageId = JUDGE0_LANGUAGE_IDS[language];

    if (!languageId) {
        return {
            passed: false,
            output: `Language ${language} is not supported yet.`,
            error: 'Unsupported language'
        };
    }

    const results = [];
    let allPassed = true;
    const startTime = performance.now();

    try {
        for (const testCase of testCases) {
            try {
                // Parse input - Judge0 expects stdin format
                const stdin = parseInputForJudge0(testCase.input);

                // Create submission
                const submission = await createSubmission(code, languageId, stdin);

                // Get result
                const result = await getSubmissionResult(submission.token);

                // Parse output
                const actual = result.stdout?.trim() || '';
                const expected = testCase.output.trim();
                const isPassed = actual === expected;

                if (!isPassed) allPassed = false;

                results.push({
                    input: testCase.input,
                    expected: testCase.output,
                    actual: actual,
                    passed: isPassed,
                    error: result.stderr || result.compile_output || undefined
                });

            } catch (error: any) {
                allPassed = false;
                results.push({
                    input: testCase.input,
                    expected: testCase.output,
                    actual: '',
                    passed: false,
                    error: error.message
                });
            }
        }

        const endTime = performance.now();

        return {
            passed: allPassed,
            output: allPassed ? "All test cases passed!" : "Some test cases failed.",
            executionTime: endTime - startTime,
            testResults: results
        };

    } catch (error: any) {
        return {
            passed: false,
            output: "Execution failed",
            error: error.message,
            testResults: results
        };
    }
}

/**
 * Create a submission on Judge0
 */
async function createSubmission(
    code: string,
    languageId: number,
    stdin: string
): Promise<{ token: string }> {
    const useRapidApi = !!JUDGE0_CONFIG.rapidApiKey;
    const url = useRapidApi ? JUDGE0_CONFIG.rapidApiUrl : JUDGE0_CONFIG.publicUrl;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (useRapidApi) {
        headers['X-RapidAPI-Key'] = JUDGE0_CONFIG.rapidApiKey;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            source_code: btoa(code), // Base64 encode
            language_id: languageId,
            stdin: btoa(stdin),
            cpu_time_limit: 2,
            memory_limit: 128000, // 128 MB
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to create submission: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Get submission result (with polling)
 */
async function getSubmissionResult(token: string): Promise<any> {
    const useRapidApi = !!JUDGE0_CONFIG.rapidApiKey;
    const baseUrl = useRapidApi ? JUDGE0_CONFIG.rapidApiUrl : JUDGE0_CONFIG.publicUrl;
    const url = `${baseUrl}/${token}?base64_encoded=true`;

    const headers: HeadersInit = {};

    if (useRapidApi) {
        headers['X-RapidAPI-Key'] = JUDGE0_CONFIG.rapidApiKey;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    // Poll for result (max 10 attempts)
    for (let i = 0; i < 10; i++) {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to get submission: ${response.statusText}`);
        }

        const result = await response.json();

        // Status IDs: 1-2 = In Queue/Processing, 3 = Accepted, 4+ = Various errors
        if (result.status.id > 2) {
            // Decode base64 outputs
            return {
                ...result,
                stdout: result.stdout ? atob(result.stdout) : '',
                stderr: result.stderr ? atob(result.stderr) : '',
                compile_output: result.compile_output ? atob(result.compile_output) : '',
            };
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Execution timeout');
}

/**
 * Parse input format to stdin
 * Converts "nums = [2,7,11,15], target = 9" to proper stdin format
 */
function parseInputForJudge0(input: string): string {
    // For DSA problems, we need to convert the input format
    // This is a simple implementation - you may need to customize based on your format

    try {
        // Extract values from "key = value" format
        const parts = input.split(',').map(part => {
            const equalIndex = part.indexOf('=');
            if (equalIndex > -1) {
                return part.substring(equalIndex + 1).trim();
            }
            return part.trim();
        });

        // Join with newlines for stdin
        return parts.join('\n');
    } catch {
        return input;
    }
}
