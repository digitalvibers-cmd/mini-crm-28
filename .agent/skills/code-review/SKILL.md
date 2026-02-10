---
name: code-review
description: Reviews code changes for bugs, style issues, security vulnerabilities, and best practices. Use when reviewing PRs, diffs, or checking code quality before commit.
---

# Code Review Skill

When reviewing code, you MUST follow a systematic approach to ensure high-quality, maintainable, and secure code.

## Review Checklist

### 1. Correctness
- Does the code implement the intended functionality?
- Are there logical errors or incorrect assumptions?
- Does it handle the expected inputs and edge cases?
- Are return values and side effects correct?

### 2. Edge Cases & Error Handling
- Are null/undefined values handled properly?
- Are boundary conditions tested (empty arrays, zero values, max limits)?
- Is there proper error handling (try-catch, error propagation)?
- Are network/IO failures anticipated?
- Does the code handle concurrent access safely?

### 3. Code Style & Readability
- Does it follow the project's coding conventions?
- Are variable and function names descriptive and consistent?
- Is the code DRY (Don't Repeat Yourself)?
- Are comments present only where necessary (why, not what)?
- Is indentation and formatting consistent?
- Are magic numbers replaced with named constants?

### 4. Performance & Efficiency
- Are there obvious inefficiencies (nested loops, repeated calculations)?
- Is the correct data structure used (map vs array, set vs list)?
- Are database queries optimized (N+1 problem)?
- Is pagination used for large datasets?
- Are there memory leaks (unclosed connections, event listeners)?

### 5. Security
- Are user inputs validated and sanitized?
- Is there protection against SQL injection, XSS, CSRF?
- Are secrets hardcoded in the code?
- Is authentication/authorization implemented correctly?
- Are sensitive data (passwords, tokens) properly encrypted?

### 6. Testing & Maintainability
- Are unit tests present and comprehensive?
- Can this code be easily tested in isolation?
- Is the code modular with clear separation of concerns?
- Are dependencies minimal and justified?
- Is the change backwards-compatible?

## How to Provide Feedback

When giving code review feedback, follow these principles:

1. **Be Specific**: Point to exact lines or blocks. Use concrete examples.
   - ❌ "This function is bad"
   - ✅ "Line 42: `getUserData()` performs O(n) search. Consider using a Map for O(1) lookup."

2. **Explain Why**: Don't just state the problem; explain the impact.
   - ❌ "Use async/await"
   - ✅ "Use async/await here to avoid callback hell and improve error handling with try-catch."

3. **Suggest Alternatives**: Propose actionable solutions.
   - ❌ "This is wrong"
   - ✅ "Instead of mutating the array directly, use `.map()` to return a new array and keep the function pure."

4. **Prioritize Issues**: Use severity labels:
   - 🔴 **Critical**: Security vulnerability, crash, data loss
   - 🟡 **Important**: Performance issue, missing error handling
   - 🔵 **Minor**: Style inconsistency, better naming

5. **Acknowledge Good Code**: Highlight clever solutions or improvements.
   - ✅ "Nice use of memoization here to avoid re-computation."

## Output Format

Structure your review as follows:

### Summary
- Brief overview of the changes
- Overall quality assessment

### Critical Issues (🔴)
- [List any blocking problems]

### Important Issues (🟡)
- [List significant improvements needed]

### Minor Issues (🔵)
- [List style/preference suggestions]

### Positive Observations
- [Highlight good practices]

### Recommendation
- ✅ Approve / ⚠️ Approve with minor changes / ❌ Request changes
