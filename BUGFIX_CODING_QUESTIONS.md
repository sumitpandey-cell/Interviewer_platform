# Bug Fix: Coding Questions Not Opening Code Editor

## Problem Description
The first coding question was opening the code editor correctly, but subsequent coding questions were not triggering the code editor to open.

## Root Cause Analysis

### Issue 1: Question Index Management
The `currentQuestionIndex` was being incremented **before** the question was fully processed. This caused the detection logic to skip over questions when looking for the next coding question.

**Location**: `InterviewRoom.tsx` lines 273-311

**Problem Flow**:
1. First coding question asked (index = 0)
2. Modal opens, index incremented to 1
3. Second coding question asked (index = 1)
4. Code searches from index 1 onwards using `.slice(currentQuestionIndex)`
5. If the second question was at index 1, it would be skipped because `.slice(1)` starts from index 1 (excluding it)

### Issue 2: Unclear AI Instructions
The system prompt had confusing instructions about when to use the `[CODING_CHALLENGE]` marker:
- Had a typo: "Speak question"
- Wasn't clear that the marker must be used for **EVERY** coding question
- The AI might have thought it only needed to use it once

**Location**: `company-interview.txt` line 136

## Solutions Implemented

### Fix 1: Improved Question Detection Logic
**File**: `/home/sumit/Documents/Projects/interviewer/src/pages/InterviewRoom.tsx`

**Changes**:
1. Added better logging to track question index and total questions
2. Implemented fallback search: if no coding question found from `currentQuestionIndex` onwards, search **all** questions
3. Changed index update logic to use `findIndex` with ID comparison instead of `indexOf`
4. Only update index if the found question is at or after the current index
5. Use the AI's question text as the generic question text if no match found

**Key Code Changes**:
```typescript
// Strategy: Search through ALL coding questions to find one that hasn't been asked yet
// We'll look for the first coding question starting from currentQuestionIndex
let questionToUse = companyQuestions
    .slice(currentQuestionIndex)
    .find(q => q.question_type === 'Coding');

// If we didn't find one from currentQuestionIndex onwards, it might be that
// the AI is asking questions out of order. Let's search all questions.
if (!questionToUse && companyQuestions.length > 0) {
    console.log('⚠️ No coding question found from current index, searching all questions...');
    questionToUse = companyQuestions.find(q => q.question_type === 'Coding');
}

// Update question index ONLY if it's from company questions and we found it in the list
const questionIndex = companyQuestions.findIndex(q => q.id === questionToUse!.id);
if (questionIndex !== -1 && questionIndex >= currentQuestionIndex) {
    console.log(`Updating question index from ${currentQuestionIndex} to ${questionIndex + 1}`);
    setCurrentQuestionIndex(questionIndex + 1);
}
```

### Fix 2: Clarified AI Instructions
**File**: `/home/sumit/Documents/Projects/interviewer/src/prompts/company-interview.txt`

**Changes**:
1. Removed confusing instruction with typo
2. Added clear, bold section: "MANDATORY MARKER FOR CODING QUESTIONS"
3. Emphasized that marker must be used **EVERY TIME** a coding question is asked
4. Provided clear example
5. Added warning about consequences of forgetting the marker

**New Instructions**:
```
**MANDATORY MARKER FOR CODING QUESTIONS**:
- **EVERY TIME** you ask a coding question (marked as [Coding] in the questions list), 
  you MUST include the text `[CODING_CHALLENGE]` immediately after stating the question
- This marker triggers the code editor to open for the candidate
- Example: "Can you write a function to reverse a linked list? [CODING_CHALLENGE]"
- **DO NOT FORGET THIS MARKER** - without it, the code editor won't open
- This applies to ALL coding questions, not just the first one
```

## Testing Recommendations

To verify the fix works:

1. **Test Sequential Coding Questions**:
   - Create a company template with 2-3 coding questions
   - Start an interview
   - Verify that each coding question opens the code editor

2. **Test Out-of-Order Questions**:
   - Let the AI ask questions in a different order than the list
   - Verify that coding questions still trigger the editor

3. **Test Generic Coding Questions**:
   - Start a general interview (not company-specific)
   - Ask the AI to give you a coding challenge
   - Verify the generic question text appears in the editor

4. **Check Console Logs**:
   - Open browser console
   - Look for the new log messages:
     - "Current question index: X"
     - "Total company questions: Y"
     - "📝 Selected coding question: ..."
     - "Updating question index from X to Y"

## Expected Behavior After Fix

✅ First coding question opens code editor
✅ Second coding question opens code editor
✅ Third coding question opens code editor
✅ All subsequent coding questions open code editor
✅ AI consistently uses `[CODING_CHALLENGE]` marker for all coding questions
✅ Question index properly tracks which questions have been asked
✅ Fallback to generic question if no match found in company questions
