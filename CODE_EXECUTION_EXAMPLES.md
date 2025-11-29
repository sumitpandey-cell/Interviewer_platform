# Code Execution Examples

## How It Works

Your app now supports **two execution modes**:

### 1. **Local Execution (JavaScript Only)**
- Runs directly in the browser
- No API needed
- Fast and free
- ✅ Currently active

### 2. **Judge0 Execution (All Languages)**
- Runs on external server
- Supports 60+ languages
- Requires API key or self-hosting
- ⚙️ Configure to enable

## Example: Two Sum Problem

### JavaScript (Works Now!)

```javascript
var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};
```

**Test Case:**
- Input: `nums = [2,7,11,15], target = 9`
- Expected Output: `[0,1]`

### Python (Requires Judge0)

```python
def twoSum(nums, target):
    map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in map:
            return [map[complement], i]
        map[num] = i
    return []

# For Judge0, you need to read from stdin
import json
nums = json.loads(input())
target = int(input())
print(json.dumps(twoSum(nums, target)))
```

### C++ (Requires Judge0)

```cpp
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    // Read input and call function
    // Output result
    return 0;
}
```

## Testing Your Setup

### Step 1: Test JavaScript (Should work now)

1. Go to Coding Round
2. Select "Data Structures & Algorithms"
3. Choose any problem
4. Write JavaScript code
5. Click "Run" ✅

### Step 2: Enable Multi-Language Support

Run the setup script:
```bash
./setup-compiler.sh
```

Or manually add to `.env`:
```bash
# Option 1: RapidAPI
VITE_RAPIDAPI_KEY=your_key_here

# Option 2: Self-hosted
VITE_JUDGE0_URL=http://localhost:2358
```

### Step 3: Test Other Languages

1. Restart dev server: `npm run dev`
2. Go to Coding Round
3. Select Python/Java/C++
4. Write code
5. Click "Run" ✅

## Input/Output Format

### Current Format (DSA Problems)

**Input:** `nums = [2,7,11,15], target = 9`
**Output:** `[0,1]`

### For Judge0 (stdin/stdout)

The executor automatically converts:
- Input: `nums = [2,7,11,15], target = 9`
- To stdin: 
  ```
  [2,7,11,15]
  9
  ```

## Troubleshooting

### "Language not supported"
- JavaScript works locally
- Other languages need Judge0
- Run `./setup-compiler.sh`

### "Execution failed"
- Check `.env` file has API key
- Restart dev server
- Check console for errors

### "Runtime Error"
- Check your code syntax
- Verify input/output format
- Test with example cases first

## Next Steps

1. ✅ JavaScript execution is working
2. 🔧 Set up Judge0 for other languages
3. 📝 Add more DSA problems to database
4. 🎨 Customize test case formats
5. 🚀 Deploy to production

## Production Checklist

- [ ] Set up backend proxy for API keys
- [ ] Implement rate limiting
- [ ] Add user authentication
- [ ] Monitor execution costs
- [ ] Set up error logging
- [ ] Add execution analytics

## Resources

- **Judge0 Docs:** https://ce.judge0.com
- **RapidAPI:** https://rapidapi.com/judge0-official/api/judge0-ce
- **Setup Guide:** See `COMPILER_INTEGRATION.md`
