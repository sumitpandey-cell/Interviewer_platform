
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nqbhyvnzpuezyqargqbn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYmh5dm56cHVlenlxYXJncWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4ODQ5MDEsImV4cCI6MjA3OTQ2MDkwMX0.kd2qsxEMJZXnfAxAptQNV8U8u2ceyWUru8sO1moyPXo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function seed() {
    console.log("Starting seed process...");

    // 1. Domains
    console.log("Seeding Domains...");
    const domainsData = [
        { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', name: 'Data Structures & Algorithms', icon: 'Code2', description: 'Arrays, Trees, Graphs, DP', companies: ['Google', 'Meta', 'Amazon'] },
        { id: 'd290f1ee-6c54-4b01-90e6-d701748f0852', name: 'Web Development', icon: 'Globe', description: 'React, Node.js, API Design', companies: ['Netflix', 'Airbnb', 'Uber'] },
        { id: 'd290f1ee-6c54-4b01-90e6-d701748f0853', name: 'Database / SQL', icon: 'Database', description: 'Queries, Normalization, Indexing', companies: ['Oracle', 'Stripe', 'Square'] },
        { id: 'd290f1ee-6c54-4b01-90e6-d701748f0854', name: 'Operating Systems', icon: 'Cpu', description: 'Threads, Processes, Memory', companies: ['Microsoft', 'Intel', 'Apple'] },
        { id: 'd290f1ee-6c54-4b01-90e6-d701748f0855', name: 'System Design', icon: 'Server', description: 'Scalability, Load Balancing', companies: ['Twitter', 'LinkedIn', 'Zoom'] },
        { id: 'd290f1ee-6c54-4b01-90e6-d701748f0856', name: 'Machine Learning', icon: 'BrainCircuit', description: 'Models, Neural Networks', companies: ['OpenAI', 'DeepMind', 'Tesla'] }
    ];

    const { error: domainError } = await supabase.from('domains').upsert(domainsData);
    if (domainError) console.error("Error seeding domains:", domainError);
    else console.log("Domains seeded.");

    // 2. Topics
    console.log("Seeding Topics...");
    const dsaId = 'd290f1ee-6c54-4b01-90e6-d701748f0851';
    const webId = 'd290f1ee-6c54-4b01-90e6-d701748f0852';

    const topicsData = [
        { domain_id: dsaId, name: 'Arrays', description: 'Fundamental array operations and techniques' },
        { domain_id: dsaId, name: 'Linked Lists', description: 'Singly and doubly linked list manipulation' },
        { domain_id: dsaId, name: 'Trees', description: 'Binary trees, BST, and traversals' },
        { domain_id: dsaId, name: 'Graphs', description: 'Graph traversal, shortest path, and cycles' },
        { domain_id: dsaId, name: 'Dynamic Programming', description: 'Optimization problems using subproblems' },
        { domain_id: dsaId, name: 'Strings', description: 'String manipulation and pattern matching' },
        { domain_id: webId, name: 'React', description: 'Component lifecycle, hooks, and state management' },
        { domain_id: webId, name: 'Node.js', description: 'Event loop, streams, and file system' },
        { domain_id: webId, name: 'API Design', description: 'REST, GraphQL, and API best practices' },
        { domain_id: webId, name: 'CSS', description: 'Layouts, flexbox, grid, and responsiveness' }
    ];

    // We need to fetch inserted topics to get their IDs for questions
    const { data: insertedTopics, error: topicError } = await supabase.from('topics').upsert(topicsData, { onConflict: 'name, domain_id' }).select();
    if (topicError) {
        console.error("Error seeding topics:", topicError);
        return;
    }
    console.log("Topics seeded.");

    const getTopicId = (name: string) => insertedTopics.find(t => t.name === name)?.id;

    // 3. Questions
    console.log("Seeding Questions...");
    const questionsData = [
        {
            title: 'Two Sum',
            difficulty: 'Easy',
            domain_id: dsaId,
            topic_id: getTopicId('Arrays'),
            topics: ['Arrays', 'Hash Table', 'Two Pointers'],
            description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would be **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
            constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
            examples: [
                { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
                { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
                { input: "nums = [3,3], target = 6", output: "[0,1]" }
            ],
            test_cases: [
                { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
                { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
                { input: "nums = [3,3], target = 6", output: "[0,1]" },
                { input: "nums = [1,2], target = 3", output: "[0,1]" },
                { input: "nums = [1,5,9], target = 10", output: "[0,2]" }
            ],
            hints: ['A brute force approach is O(n^2). Can you do better?', 'Use a hash map to store the complement.'],
            default_code: {
                javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your code here\n    \n};",
                python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        pass"
            }
        },
        {
            title: 'Maximum Depth of Binary Tree',
            difficulty: 'Easy',
            domain_id: dsaId,
            topic_id: getTopicId('Trees'),
            topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'],
            description: 'Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree\'s **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.',
            constraints: ['The number of nodes in the tree is in the range [0, 10^4].', '-100 <= Node.val <= 100'],
            examples: [
                { input: "root = [3,9,20,null,null,15,7]", output: "3" },
                { input: "root = [1,null,2]", output: "2" }
            ],
            test_cases: [
                { input: "root = [3,9,20,null,null,15,7]", output: "3" },
                { input: "root = [1,null,2]", output: "2" },
                { input: "root = []", output: "0" },
                { input: "root = [0]", output: "1" }
            ],
            hints: ['DFS is a common way to solve this.', 'Can you do it with BFS?'],
            default_code: {
                javascript: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    // Write your code here\n    \n};",
                python: "class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        # Write your code here\n        pass"
            }
        },
        {
            title: 'Invert Binary Tree',
            difficulty: 'Easy',
            domain_id: dsaId,
            topic_id: getTopicId('Trees'),
            topics: ['Tree', 'DFS', 'BFS', 'Binary Tree'],
            description: 'Given the `root` of a binary tree, invert the tree, and return its root.',
            constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 <= Node.val <= 100'],
            examples: [
                { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
                { input: "root = [2,1,3]", output: "[2,3,1]" }
            ],
            test_cases: [
                { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
                { input: "root = [2,1,3]", output: "[2,3,1]" },
                { input: "root = []", output: "[]" }
            ],
            hints: ['Think recursively.', 'Swap left and right children.'],
            default_code: {
                javascript: "/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    // Write your code here\n    \n};",
                python: "class Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        # Write your code here\n        pass"
            }
        },
        {
            title: 'Climbing Stairs',
            difficulty: 'Easy',
            domain_id: dsaId,
            topic_id: getTopicId('Dynamic Programming'),
            topics: ['Math', 'Dynamic Programming', 'Memoization'],
            description: 'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
            constraints: ['1 <= n <= 45'],
            examples: [
                { input: "n = 2", output: "2", explanation: "There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps" },
                { input: "n = 3", output: "3", explanation: "There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" }
            ],
            test_cases: [
                { input: "n = 2", output: "2" },
                { input: "n = 3", output: "3" },
                { input: "n = 4", output: "5" },
                { input: "n = 5", output: "8" }
            ],
            hints: ['This is a classic DP problem.', 'It looks like Fibonacci sequence.'],
            default_code: {
                javascript: "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    // Write your code here\n    \n};",
                python: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your code here\n        pass"
            }
        },
        {
            title: 'Number of Islands',
            difficulty: 'Medium',
            domain_id: dsaId,
            topic_id: getTopicId('Graphs'),
            topics: ['Array', 'DFS', 'BFS', 'Union Find', 'Matrix'],
            description: 'Given an `m x n` 2D binary grid `grid` which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
            constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is \'0\' or \'1\'.'],
            examples: [
                { input: "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", output: "1" },
                { input: "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", output: "3" }
            ],
            test_cases: [
                { input: "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", output: "1" },
                { input: "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", output: "3" }
            ],
            hints: ['Iterate through the grid.', 'When you see a 1, increment count and trigger BFS/DFS to mark all connected 1s as visited.'],
            default_code: {
                javascript: "/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    // Write your code here\n    \n};",
                python: "class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        # Write your code here\n        pass"
            }
        }
    ];

    const { error: questionError } = await supabase.from('questions').upsert(questionsData);
    if (questionError) console.error("Error seeding questions:", questionError);
    else console.log("Questions seeded.");
}

seed();
