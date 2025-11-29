import { executeCodeWithJudge0 } from './judge0-executor';

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

// Configuration: Set to true to use Judge0 for all languages
const USE_JUDGE0 = !!import.meta.env.VITE_RAPIDAPI_KEY || !!import.meta.env.VITE_JUDGE0_URL;

export async function executeCode(
    code: string,
    language: string,
    testCases: TestCase[]
): Promise<ExecutionResult> {
    // If Judge0 is configured, use it for non-JavaScript languages
    if (USE_JUDGE0 && language !== 'javascript') {
        return executeCodeWithJudge0(code, language, testCases);
    }

    // Otherwise, use local execution
    switch (language) {
        case 'javascript':
            return executeJavaScript(code, testCases);
        case 'python':
            return executePython(code, testCases);
        case 'java':
            return executeJava(code, testCases);
        case 'cpp':
            return executeCpp(code, testCases);
        default:
            return {
                passed: false,
                output: `Language ${language} is not supported yet.`,
                error: 'Unsupported language'
            };
    }
}

async function executeJavaScript(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const results = [];
    let allPassed = true;
    const startTime = performance.now();

    for (const testCase of testCases) {
        try {
            // Parse input to extract arguments
            // Expected format: "nums = [2,7,11,15], target = 9"
            const inputVars = testCase.input.split(',').map(part => {
                const equalIndex = part.indexOf('=');
                if (equalIndex > -1) {
                    return part.substring(equalIndex + 1).trim();
                }
                return part.trim();
            });

            // Find function name from code
            const functionNameMatch = code.match(/(?:var|let|const|function)\s+(\w+)\s*=?\s*function/);
            const functionName = functionNameMatch ? functionNameMatch[1] : 'solution';

            // Create isolated execution context
            const runnerCode = `
                'use strict';
                ${code}
                
                const args = [${inputVars.join(',')}];
                
                if (typeof ${functionName} === 'function') {
                    return ${functionName}(...args);
                } else {
                    throw new Error("Function '${functionName}' not found. Make sure you define the function.");
                }
            `;

            const runUserCode = new Function(runnerCode);
            const result = runUserCode();

            // Parse expected output
            let expected;
            try {
                expected = JSON.parse(testCase.output);
            } catch {
                expected = testCase.output;
            }

            const actual = result;
            const isPassed = JSON.stringify(actual) === JSON.stringify(expected);

            if (!isPassed) allPassed = false;

            results.push({
                input: testCase.input,
                expected: testCase.output,
                actual: JSON.stringify(actual),
                passed: isPassed
            });

        } catch (e: any) {
            allPassed = false;
            results.push({
                input: testCase.input,
                expected: testCase.output,
                actual: '',
                passed: false,
                error: e.message
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
}

async function executePython(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    // For Python, we'll simulate execution since we can't run Python in browser
    // In a real implementation, you'd use a backend service or Pyodide
    const results = [];
    let allPassed = true;

    for (const testCase of testCases) {
        try {
            // Parse the code to find function name
            const functionMatch = code.match(/def\s+(\w+)\s*\(/);
            const functionName = functionMatch ? functionMatch[1] : 'solution';

            // For now, we'll return a simulated result
            // In production, you'd send this to a backend Python executor
            results.push({
                input: testCase.input,
                expected: testCase.output,
                actual: '',
                passed: false,
                error: 'Python execution requires a backend service. Please use JavaScript for now.'
            });
            allPassed = false;

        } catch (e: any) {
            allPassed = false;
            results.push({
                input: testCase.input,
                expected: testCase.output,
                actual: '',
                passed: false,
                error: e.message
            });
        }
    }

    return {
        passed: allPassed,
        output: "Python execution requires a backend service.",
        testResults: results
    };
}

async function executeJava(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const results = [];
    let allPassed = true;

    for (const testCase of testCases) {
        results.push({
            input: testCase.input,
            expected: testCase.output,
            actual: '',
            passed: false,
            error: 'Java execution requires a backend service. Please use JavaScript for now.'
        });
        allPassed = false;
    }

    return {
        passed: allPassed,
        output: "Java execution requires a backend service.",
        testResults: results
    };
}

async function executeCpp(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
    const results = [];
    let allPassed = true;

    for (const testCase of testCases) {
        results.push({
            input: testCase.input,
            expected: testCase.output,
            actual: '',
            passed: false,
            error: 'C++ execution requires a backend service. Please use JavaScript for now.'
        });
        allPassed = false;
    }

    return {
        passed: allPassed,
        output: "C++ execution requires a backend service.",
        testResults: results
    };
}
