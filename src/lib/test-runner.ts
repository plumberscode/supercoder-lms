import { runCode, type CodeResult } from "./code-runner";

export interface TestCaseInput {
  id: string;
  title: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  order_index: number;
}

export interface TestResult {
  testCase: TestCaseInput;
  passed: boolean;
  actual_output: string;
  error: string | null;
}

export interface GradingResult {
  results: TestResult[];
  totalPassed: number;
  totalTests: number;
  score: number;
}

export async function runTestCases(
  language: string,
  studentCode: string,
  testCases: TestCaseInput[],
): Promise<GradingResult> {
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const fullCode = studentCode + "\n" + tc.input;
    let result: CodeResult;

    try {
      result = await runCode(language, fullCode);
    } catch (err: any) {
      results.push({
        testCase: tc,
        passed: false,
        actual_output: "",
        error: err.message || String(err),
      });
      continue;
    }

    const actualTrimmed = (result.output || "").trim();
    const expectedTrimmed = (tc.expected_output || "").trim();
    const passed = !result.error && actualTrimmed === expectedTrimmed;

    results.push({
      testCase: tc,
      passed,
      actual_output: result.output || "",
      error: result.error,
    });
  }

  const totalPassed = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const score =
    totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  return { results, totalPassed, totalTests, score };
}
