# Code Execution Integration Guide

This guide explains how to integrate a code compiler/executor for DSA problems in your interviewer app.

## Current Implementation

✅ **JavaScript**: Runs locally in the browser using `Function` constructor
❌ **Python, Java, C++**: Requires backend service

## Recommended Solution: Judge0

Judge0 is a robust, production-ready code execution system that supports 60+ programming languages.

### Option 1: RapidAPI (Easiest - Recommended)

1. **Sign up for RapidAPI**
   - Go to: https://rapidapi.com/judge0-official/api/judge0-ce
   - Subscribe to the free tier (50 requests/day)
   - Get your API key

2. **Add API key to your project**
   ```bash
   # Add to .env file
   VITE_RAPIDAPI_KEY=your_rapidapi_key_here
   ```

3. **Update code executor**
   - The code is already set up in `/src/lib/judge0-executor.ts`
   - Just add your API key and it will work!

### Option 2: Self-Hosted Judge0 (Free, Unlimited)

Perfect for production or if you need unlimited executions.

1. **Install Docker**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Clone and run Judge0**
   ```bash
   git clone https://github.com/judge0/judge0.git
   cd judge0
   docker-compose up -d
   ```

3. **Configure your app**
   ```bash
   # Add to .env file
   VITE_JUDGE0_URL=http://localhost:2358
   ```

4. **Update the executor**
   ```typescript
   // In judge0-executor.ts, use selfHostedUrl instead
   const url = JUDGE0_CONFIG.selfHostedUrl;
   ```

### Option 3: Piston API (Alternative)

Free alternative to Judge0:

1. **Use public instance** (limited)
   ```typescript
   const PISTON_URL = 'https://emkc.org/api/v2/piston';
   ```

2. **Or self-host**
   ```bash
   git clone https://github.com/engineer-man/piston.git
   cd piston
   docker-compose up -d
   ```

## Supported Languages

With Judge0/Piston, you can support:

- ✅ JavaScript (Node.js)
- ✅ Python 3
- ✅ Java
- ✅ C++
- ✅ C
- ✅ TypeScript
- ✅ Go
- ✅ Rust
- ✅ Ruby
- ✅ PHP
- ✅ And 50+ more!

## Usage in Your App

### Enable Judge0 Execution

Update `/src/lib/code-executor.ts`:

```typescript
import { executeCodeWithJudge0 } from './judge0-executor';

export async function executeCode(
    code: string,
    language: string,
    testCases: TestCase[]
): Promise<ExecutionResult> {
    // Use Judge0 for all languages except JavaScript
    if (language === 'javascript') {
        return executeJavaScript(code, testCases);
    } else {
        return executeCodeWithJudge0(code, language, testCases);
    }
}
```

### Test It

1. Start your dev server
2. Go to Coding Round
3. Select Python/Java/C++
4. Write code and click "Run"
5. See results in Test Results tab!

## Security Considerations

### For Production:

1. **Rate Limiting**: Implement rate limits per user
2. **Code Validation**: Sanitize code before execution
3. **Timeout Limits**: Set max execution time (2-5 seconds)
4. **Memory Limits**: Restrict memory usage (128-256 MB)
5. **Backend Proxy**: Don't expose API keys in frontend
   - Create a backend endpoint that proxies to Judge0
   - Validate user authentication before executing

### Example Backend Proxy (Node.js/Express)

```javascript
// backend/routes/execute.js
app.post('/api/execute', authenticateUser, async (req, res) => {
    const { code, language, testCases } = req.body;
    
    // Rate limit check
    if (await isRateLimited(req.user.id)) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    // Execute with Judge0
    const result = await executeWithJudge0(code, language, testCases);
    res.json(result);
});
```

## Cost Comparison

| Solution | Cost | Requests/Day | Best For |
|----------|------|--------------|----------|
| RapidAPI Free | $0 | 50 | Testing/Development |
| RapidAPI Basic | $10/mo | 1000 | Small apps |
| Self-Hosted | Server cost | Unlimited | Production |
| Piston Public | $0 | Limited | Testing |

## Recommended Setup

**For Development**: RapidAPI Free Tier
**For Production**: Self-hosted Judge0 on a VPS ($5-10/month)

## Next Steps

1. Choose your execution method
2. Get API key or set up self-hosted
3. Add to `.env` file
4. Update `code-executor.ts` to use Judge0
5. Test with different languages!

## Troubleshooting

### "API key not found"
- Make sure `.env` file has `VITE_RAPIDAPI_KEY`
- Restart dev server after adding env variables

### "Execution timeout"
- Increase polling attempts in `getSubmissionResult`
- Check if Judge0 service is running (self-hosted)

### "Language not supported"
- Check `JUDGE0_LANGUAGE_IDS` mapping
- Verify language ID at: https://ce.judge0.com/languages

## Resources

- Judge0 Docs: https://ce.judge0.com
- RapidAPI: https://rapidapi.com/judge0-official/api/judge0-ce
- Piston: https://github.com/engineer-man/piston
- Self-hosting guide: https://github.com/judge0/judge0/blob/master/CHANGELOG.md
