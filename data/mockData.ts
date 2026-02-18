import { User, Question, Assessment, Notification, TestCase, SystemLog, SystemHealth, Backup, LeaderboardEntry, Submission, PlagiarismResult, ActiveSession } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    email: 'alex@university.edu',
    role: 'student',
    avatar: 'AJ',
    department: 'Computer Science',
    enrollmentId: 'CS2024001',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2026-01-12T08:30:00Z',
  },
  {
    id: 'user-2',
    name: 'Prof. Alan Turing',
    email: 'turing@university.edu',
    role: 'professor',
    avatar: 'AT',
    department: 'Computer Science',
    employeeId: 'EMP001',
    status: 'active',
    createdAt: '2023-08-01T10:00:00Z',
    lastLogin: '2026-01-12T09:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Admin Sarah',
    email: 'admin@university.edu',
    role: 'admin',
    avatar: 'AS',
    department: 'IT Department',
    employeeId: 'ADM001',
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
    lastLogin: '2026-01-12T07:00:00Z',
  },
  {
    id: 'user-4',
    name: 'Priya Sharma',
    email: 'priya@university.edu',
    role: 'student',
    avatar: 'PS',
    department: 'Computer Science',
    enrollmentId: 'CS2024002',
    status: 'active',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'user-5',
    name: 'David Kim',
    email: 'david@university.edu',
    role: 'student',
    avatar: 'DK',
    department: 'Information Technology',
    enrollmentId: 'IT2024001',
    status: 'active',
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 'user-6',
    name: 'Prof. Ada Lovelace',
    email: 'ada@university.edu',
    role: 'professor',
    avatar: 'AL',
    department: 'Computer Science',
    employeeId: 'EMP002',
    status: 'active',
    createdAt: '2023-08-15T10:00:00Z',
  },
  {
    id: 'user-7',
    name: 'Marcus Chen',
    email: 'marcus@university.edu',
    role: 'student',
    avatar: 'MC',
    department: 'Computer Science',
    enrollmentId: 'CS2024003',
    status: 'inactive',
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'user-8',
    name: 'Jessica Lee',
    email: 'jessica@university.edu',
    role: 'student',
    avatar: 'JL',
    department: 'Data Science',
    enrollmentId: 'DS2024001',
    status: 'active',
    createdAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'user-9',
    name: 'Sub Admin Mike',
    email: 'subadmin@university.edu',
    role: 'subadmin',
    avatar: 'SM',
    department: 'IT Department',
    employeeId: 'SADM001',
    status: 'active',
    createdAt: '2023-06-01T10:00:00Z',
    lastLogin: '2026-01-12T08:00:00Z',
  },
  {
    id: 'user-10',
    name: 'Super Admin Grace',
    email: 'superadmin@university.edu',
    role: 'superadmin',
    avatar: 'SG',
    department: 'IT Department',
    employeeId: 'SUPADM001',
    status: 'active',
    createdAt: '2022-01-01T10:00:00Z',
    lastLogin: '2026-01-12T06:00:00Z',
  },
];

const createTestCases = (count: number): TestCase[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `tc-${Date.now()}-${i}`,
    input: `test input ${i + 1}`,
    expectedOutput: `expected output ${i + 1}`,
    isHidden: i >= 2, // First 2 visible, rest hidden
    points: Math.floor(100 / count),
    timeLimit: 2000,
  }));
};

export const mockQuestions: Question[] = [
  {
    id: 'q-1',
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
    difficulty: 'easy',
    topic: 'Arrays',
    tags: ['arrays', 'hash-table', 'two-pointers'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      { id: 'tc-1-1', input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false, points: 10, timeLimit: 2000 },
      { id: 'tc-1-2', input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false, points: 10, timeLimit: 2000 },
      { id: 'tc-1-3', input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true, points: 15, timeLimit: 2000 },
      { id: 'tc-1-4', input: '[1,2,3,4,5]\n9', expectedOutput: '[3,4]', isHidden: true, points: 15, timeLimit: 2000 },
    ],
    boilerplateCode: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function twoSum(nums, target) {
    // Write your solution here
}`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
    }
}`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
    isVisible: true,
    usageCount: 156,
  },
  {
    id: 'q-2',
    title: 'Reverse Linked List',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

**Example 1:**
\`\`\`
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

**Example 2:**
\`\`\`
Input: head = [1,2]
Output: [2,1]
\`\`\`

**Constraints:**
- The number of nodes in the list is the range [0, 5000].
- -5000 <= Node.val <= 5000`,
    difficulty: 'easy',
    topic: 'Linked Lists',
    tags: ['linked-list', 'recursion'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: createTestCases(5),
    boilerplateCode: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head: ListNode) -> ListNode:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-02T10:00:00Z',
    updatedAt: '2025-06-02T10:00:00Z',
    isVisible: true,
    usageCount: 134,
  },
  {
    id: 'q-3',
    title: 'Valid Parentheses',
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
\`\`\`
Input: s = "()"
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

**Constraints:**
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
    difficulty: 'easy',
    topic: 'Stacks',
    tags: ['stack', 'string'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: createTestCases(4),
    boilerplateCode: {
      python: `def isValid(s: str) -> bool:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-03T10:00:00Z',
    updatedAt: '2025-06-03T10:00:00Z',
    isVisible: true,
    usageCount: 189,
  },
  {
    id: 'q-4',
    title: 'Merge Two Sorted Lists',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

**Example 1:**
\`\`\`
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
\`\`\`

**Constraints:**
- The number of nodes in both lists is in the range [0, 50].
- -100 <= Node.val <= 100`,
    difficulty: 'easy',
    topic: 'Linked Lists',
    tags: ['linked-list', 'recursion'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: createTestCases(4),
    boilerplateCode: {
      python: `def mergeTwoLists(list1, list2):
    # Write your solution here
    pass`,
    },
    createdBy: 'user-6',
    createdAt: '2025-06-04T10:00:00Z',
    updatedAt: '2025-06-04T10:00:00Z',
    isVisible: true,
    usageCount: 112,
  },
  {
    id: 'q-5',
    title: 'Binary Search',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

**Example 1:**
\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4
\`\`\`

**Constraints:**
- 1 <= nums.length <= 10^4
- All the integers in nums are unique.
- nums is sorted in ascending order.`,
    difficulty: 'easy',
    topic: 'Binary Search',
    tags: ['binary-search', 'arrays'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: createTestCases(5),
    boilerplateCode: {
      python: `def search(nums: list[int], target: int) -> int:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-05T10:00:00Z',
    updatedAt: '2025-06-05T10:00:00Z',
    isVisible: true,
    usageCount: 98,
  },
  {
    id: 'q-6',
    title: 'Maximum Subarray',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

**Example 1:**
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

**Constraints:**
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    difficulty: 'medium',
    topic: 'Dynamic Programming',
    tags: ['dynamic-programming', 'arrays', 'divide-and-conquer'],
    points: 75,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: createTestCases(5),
    boilerplateCode: {
      python: `def maxSubArray(nums: list[int]) -> int:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-06T10:00:00Z',
    updatedAt: '2025-06-06T10:00:00Z',
    isVisible: true,
    usageCount: 145,
  },
  {
    id: 'q-7',
    title: 'Climbing Stairs',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

**Example 1:**
\`\`\`
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top.
1. 1 step + 1 step
2. 2 steps
\`\`\`

**Constraints:**
- 1 <= n <= 45`,
    difficulty: 'easy',
    topic: 'Dynamic Programming',
    tags: ['dynamic-programming', 'math', 'memoization'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: createTestCases(4),
    boilerplateCode: {
      python: `def climbStairs(n: int) -> int:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-6',
    createdAt: '2025-06-07T10:00:00Z',
    updatedAt: '2025-06-07T10:00:00Z',
    isVisible: true,
    usageCount: 167,
  },
  {
    id: 'q-8',
    title: 'Longest Common Subsequence',
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return 0.

A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

**Example 1:**
\`\`\`
Input: text1 = "abcde", text2 = "ace" 
Output: 3  
Explanation: The longest common subsequence is "ace" and its length is 3.
\`\`\`

**Constraints:**
- 1 <= text1.length, text2.length <= 1000
- text1 and text2 consist of only lowercase English characters.`,
    difficulty: 'medium',
    topic: 'Dynamic Programming',
    tags: ['dynamic-programming', 'string'],
    points: 100,
    timeLimit: 3,
    memoryLimit: 512,
    testCases: createTestCases(5),
    boilerplateCode: {
      python: `def longestCommonSubsequence(text1: str, text2: str) -> int:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-08T10:00:00Z',
    updatedAt: '2025-06-08T10:00:00Z',
    isVisible: true,
    usageCount: 89,
  },
  {
    id: 'q-9',
    title: 'Graph DFS Traversal',
    description: `Given a graph represented as an adjacency list and a starting node, perform a Depth-First Search (DFS) traversal and return the order of visited nodes.

**Example 1:**
\`\`\`
Input: 
graph = {0: [1, 2], 1: [2], 2: [0, 3], 3: [3]}
start = 2
Output: [2, 0, 1, 3]
\`\`\`

**Constraints:**
- Number of nodes: 1 <= n <= 1000
- Nodes are labeled from 0 to n-1`,
    difficulty: 'hard',
    topic: 'Graphs',
    tags: ['graph', 'dfs', 'recursion'],
    points: 150,
    timeLimit: 3,
    memoryLimit: 512,
    testCases: createTestCases(5),
    boilerplateCode: {
      python: `def dfs(graph: dict, start: int) -> list[int]:
    # Write your solution here
    pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-09T10:00:00Z',
    updatedAt: '2025-06-09T10:00:00Z',
    isVisible: true,
    usageCount: 56,
  },
  {
    id: 'q-10',
    title: 'Implement LRU Cache',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if the key exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache.

**Example:**
\`\`\`
Input:
["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
Output:
[null, null, null, 1, null, -1, null, -1, 3, 4]
\`\`\`

**Constraints:**
- 1 <= capacity <= 3000
- 0 <= key <= 10^4
- 0 <= value <= 10^5`,
    difficulty: 'hard',
    topic: 'Design',
    tags: ['hash-table', 'linked-list', 'design'],
    points: 200,
    timeLimit: 3,
    memoryLimit: 512,
    testCases: createTestCases(5),
    boilerplateCode: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        # Initialize your data structure here
        pass
        
    def get(self, key: int) -> int:
        # Return the value of the key
        pass
        
    def put(self, key: int, value: int) -> None:
        # Update or add the key-value pair
        pass`,
    },
    createdBy: 'user-2',
    createdAt: '2025-06-10T10:00:00Z',
    updatedAt: '2025-06-10T10:00:00Z',
    isVisible: true,
    usageCount: 78,
  },
];

export const mockAssessments: Assessment[] = [
  {
    id: 'assess-1',
    title: 'Data Structures Midterm',
    description: 'Comprehensive assessment covering arrays, linked lists, stacks, and queues.',
    type: 'exam',
    difficulty: 'intermediate',
    duration: 90,
    passingScore: 70,
    totalPoints: 250,
    questions: [mockQuestions[0], mockQuestions[1], mockQuestions[2], mockQuestions[3], mockQuestions[4]],
    startDate: '2026-01-15T10:00:00Z',
    endDate: '2026-01-15T12:00:00Z',
    status: 'published',
    settings: {
      randomizeQuestions: true,
      showCorrectAnswers: false,
      showScoreImmediately: true,
      allowRetakes: false,
      maxAttempts: 1,
      ipRestriction: false,
      allowedIPs: [],
      plagiarismSensitivity: 'high',
      proctoring: true,
    },
    createdBy: 'user-2',
    createdAt: '2026-01-01T10:00:00Z',
    courseCode: 'CS-201',
    courseName: 'Data Structures',
    professorName: 'Prof. Alan Turing',
  },
  {
    id: 'assess-2',
    title: 'Python Basics II',
    description: 'Practice quiz on Python fundamentals including functions and data types.',
    type: 'quiz',
    difficulty: 'beginner',
    duration: 45,
    passingScore: 60,
    totalPoints: 150,
    questions: [mockQuestions[0], mockQuestions[4], mockQuestions[6]],
    startDate: '2026-01-10T14:00:00Z',
    endDate: '2026-01-20T23:59:00Z',
    status: 'active',
    settings: {
      randomizeQuestions: false,
      showCorrectAnswers: true,
      showScoreImmediately: true,
      allowRetakes: true,
      maxAttempts: 3,
      ipRestriction: false,
      allowedIPs: [],
      plagiarismSensitivity: 'medium',
      proctoring: false,
    },
    createdBy: 'user-6',
    createdAt: '2026-01-05T10:00:00Z',
    courseCode: 'CS-101',
    courseName: 'Introduction to Programming',
    professorName: 'Prof. Ada Lovelace',
  },
  {
    id: 'assess-3',
    title: 'Algorithm Design Final',
    description: 'Final examination covering advanced algorithms, dynamic programming, and graphs.',
    type: 'exam',
    difficulty: 'advanced',
    duration: 120,
    passingScore: 65,
    totalPoints: 400,
    questions: [mockQuestions[5], mockQuestions[7], mockQuestions[8], mockQuestions[9]],
    startDate: '2026-01-25T09:00:00Z',
    endDate: '2026-01-25T11:00:00Z',
    status: 'draft',
    settings: {
      randomizeQuestions: true,
      showCorrectAnswers: false,
      showScoreImmediately: false,
      allowRetakes: false,
      maxAttempts: 1,
      ipRestriction: true,
      allowedIPs: ['192.168.1.0/24'],
      plagiarismSensitivity: 'high',
      proctoring: true,
    },
    createdBy: 'user-2',
    createdAt: '2026-01-08T10:00:00Z',
    courseCode: 'CS-301',
    courseName: 'Algorithm Design',
    professorName: 'Prof. Alan Turing',
  },
  {
    id: 'assess-4',
    title: 'Practice: Dynamic Programming',
    description: 'Self-paced practice problems for dynamic programming concepts.',
    type: 'practice',
    difficulty: 'intermediate',
    duration: 0, // Unlimited
    passingScore: 0,
    totalPoints: 225,
    questions: [mockQuestions[5], mockQuestions[6], mockQuestions[7]],
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:00Z',
    status: 'active',
    settings: {
      randomizeQuestions: false,
      showCorrectAnswers: true,
      showScoreImmediately: true,
      allowRetakes: true,
      maxAttempts: 999,
      ipRestriction: false,
      allowedIPs: [],
      plagiarismSensitivity: 'low',
      proctoring: false,
    },
    createdBy: 'user-6',
    createdAt: '2025-12-15T10:00:00Z',
    courseCode: 'CS-201',
    courseName: 'Data Structures',
    professorName: 'Prof. Ada Lovelace',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'info',
    title: 'New Assessment Available',
    message: 'Data Structures Midterm has been published and is now available.',
    read: false,
    createdAt: '2026-01-12T08:00:00Z',
    link: 'assess-1',
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: 'Assessment Deadline Approaching',
    message: 'Python Basics II is due in 2 days. Don\'t forget to submit!',
    read: false,
    createdAt: '2026-01-11T10:00:00Z',
    link: 'assess-2',
  },
  {
    id: 'notif-3',
    type: 'success',
    title: 'Submission Graded',
    message: 'Your submission for "Two Sum" has been graded. Score: 45/50',
    read: true,
    createdAt: '2026-01-10T15:00:00Z',
  },
  {
    id: 'notif-4',
    type: 'error',
    title: 'Plagiarism Alert',
    message: 'High similarity detected in your recent submission. Please review.',
    read: false,
    createdAt: '2026-01-09T12:00:00Z',
  },
  {
    id: 'notif-5',
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Jan 20th from 2-4 AM. Platform may be unavailable.',
    read: true,
    createdAt: '2026-01-08T09:00:00Z',
  },
];

// Mock System Logs
export const mockSystemLogs: SystemLog[] = [
  {
    id: 'log-1',
    level: 'info',
    category: 'auth',
    message: 'User logged in successfully',
    userId: 'user-1',
    userName: 'Alex Johnson',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    timestamp: '2026-01-16T08:30:00Z',
  },
  {
    id: 'log-2',
    level: 'info',
    category: 'submission',
    message: 'Code submitted for question "Two Sum"',
    userId: 'user-1',
    userName: 'Alex Johnson',
    ipAddress: '192.168.1.105',
    metadata: { questionId: 'q-1', language: 'python', score: 45 },
    timestamp: '2026-01-16T09:15:00Z',
  },
  {
    id: 'log-3',
    level: 'warning',
    category: 'security',
    message: 'Multiple failed login attempts detected',
    userId: 'user-4',
    userName: 'Priya Sharma',
    ipAddress: '192.168.1.110',
    metadata: { attempts: 3 },
    timestamp: '2026-01-16T09:20:00Z',
  },
  {
    id: 'log-4',
    level: 'error',
    category: 'system',
    message: 'Database connection timeout',
    ipAddress: 'localhost',
    metadata: { service: 'PostgreSQL', timeout: 30000 },
    timestamp: '2026-01-16T09:25:00Z',
  },
  {
    id: 'log-5',
    level: 'info',
    category: 'assessment',
    message: 'New assessment created: "Data Structures Final"',
    userId: 'user-2',
    userName: 'Prof. Alan Turing',
    ipAddress: '192.168.1.50',
    metadata: { assessmentId: 'assess-5', type: 'exam' },
    timestamp: '2026-01-16T10:00:00Z',
  },
  {
    id: 'log-6',
    level: 'info',
    category: 'user',
    message: 'New user registered',
    userId: 'user-8',
    userName: 'Jessica Lee',
    ipAddress: '192.168.1.120',
    timestamp: '2026-01-16T10:30:00Z',
  },
  {
    id: 'log-7',
    level: 'warning',
    category: 'submission',
    message: 'High plagiarism score detected',
    userId: 'user-5',
    userName: 'David Kim',
    ipAddress: '192.168.1.115',
    metadata: { submissionId: 'sub-123', similarity: 78 },
    timestamp: '2026-01-16T11:00:00Z',
  },
  {
    id: 'log-8',
    level: 'debug',
    category: 'system',
    message: 'Cache cleared successfully',
    ipAddress: 'localhost',
    metadata: { service: 'Redis', clearedKeys: 156 },
    timestamp: '2026-01-16T11:30:00Z',
  },
  {
    id: 'log-9',
    level: 'error',
    category: 'submission',
    message: 'Code execution timeout',
    userId: 'user-4',
    userName: 'Priya Sharma',
    ipAddress: '192.168.1.110',
    metadata: { questionId: 'q-9', timeLimit: 3000, actualTime: 5000 },
    timestamp: '2026-01-16T12:00:00Z',
  },
  {
    id: 'log-10',
    level: 'info',
    category: 'auth',
    message: 'Password reset requested',
    userId: 'user-7',
    userName: 'Marcus Chen',
    ipAddress: '192.168.1.130',
    timestamp: '2026-01-16T12:30:00Z',
  },
];

// Mock System Health
export const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  uptime: 864000, // 10 days in seconds
  lastChecked: new Date().toISOString(),
  services: [
    { name: 'API Server', status: 'up', responseTime: 45, lastChecked: new Date().toISOString() },
    { name: 'Database', status: 'up', responseTime: 12, lastChecked: new Date().toISOString() },
    { name: 'Redis Cache', status: 'up', responseTime: 3, lastChecked: new Date().toISOString() },
    { name: 'Code Executor', status: 'up', responseTime: 150, lastChecked: new Date().toISOString() },
    { name: 'Email Service', status: 'up', responseTime: 230, lastChecked: new Date().toISOString() },
  ],
  metrics: {
    cpuUsage: 42.5,
    memoryUsage: 68.3,
    diskUsage: 45.2,
    activeConnections: 127,
    requestsPerMinute: 450,
    averageResponseTime: 85,
  },
  recentErrors: [
    {
      id: 'err-1',
      level: 'error',
      category: 'system',
      message: 'Database connection timeout - recovered automatically',
      ipAddress: 'localhost',
      timestamp: '2026-01-15T14:30:00Z',
    },
  ],
};

// Mock Backups
export const mockBackups: Backup[] = [
  {
    id: 'backup-1',
    name: 'Full Backup - January 2026',
    type: 'full',
    size: 1024 * 1024 * 512, // 512 MB
    status: 'completed',
    createdAt: '2026-01-15T03:00:00Z',
    completedAt: '2026-01-15T03:45:00Z',
    createdBy: 'system',
    includes: ['users', 'assessments', 'questions', 'submissions', 'logs'],
    downloadUrl: '/backups/full-jan-2026.zip',
  },
  {
    id: 'backup-2',
    name: 'Daily Incremental - Jan 16',
    type: 'incremental',
    size: 1024 * 1024 * 45, // 45 MB
    status: 'completed',
    createdAt: '2026-01-16T02:00:00Z',
    completedAt: '2026-01-16T02:05:00Z',
    createdBy: 'system',
    includes: ['submissions', 'logs'],
    downloadUrl: '/backups/incr-jan-16.zip',
  },
  {
    id: 'backup-3',
    name: 'Pre-Exam Backup',
    type: 'full',
    size: 1024 * 1024 * 480, // 480 MB
    status: 'completed',
    createdAt: '2026-01-14T22:00:00Z',
    completedAt: '2026-01-14T22:40:00Z',
    createdBy: 'user-3',
    includes: ['users', 'assessments', 'questions', 'submissions'],
    downloadUrl: '/backups/pre-exam-jan-14.zip',
  },
  {
    id: 'backup-4',
    name: 'Weekly Full Backup',
    type: 'full',
    size: 1024 * 1024 * 520, // 520 MB
    status: 'scheduled',
    createdAt: '2026-01-19T03:00:00Z',
    createdBy: 'system',
    includes: ['users', 'assessments', 'questions', 'submissions', 'logs'],
  },
];

// Mock Leaderboard Entries
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    id: 'user-1',
    name: 'Alex Johnson',
    avatar: 'AJ',
    department: 'Computer Science',
    totalScore: 2450,
    problemsSolved: 48,
    averageTime: 245,
    streak: 12,
    badges: ['top_scorer', 'streak_master', 'fast_solver'],
  },
  {
    rank: 2,
    id: 'user-4',
    name: 'Priya Sharma',
    avatar: 'PS',
    department: 'Computer Science',
    totalScore: 2280,
    problemsSolved: 45,
    averageTime: 280,
    streak: 8,
    badges: ['problem_crusher', 'consistent'],
  },
  {
    rank: 3,
    id: 'user-5',
    name: 'David Kim',
    avatar: 'DK',
    department: 'Information Technology',
    totalScore: 2150,
    problemsSolved: 42,
    averageTime: 310,
    streak: 5,
    badges: ['early_bird', 'consistent'],
  },
  {
    rank: 4,
    id: 'user-8',
    name: 'Jessica Lee',
    avatar: 'JL',
    department: 'Data Science',
    totalScore: 1980,
    problemsSolved: 38,
    averageTime: 295,
    streak: 7,
    badges: ['fast_solver'],
  },
  {
    rank: 5,
    id: 'user-9',
    name: 'Michael Brown',
    avatar: 'MB',
    department: 'Computer Science',
    totalScore: 1850,
    problemsSolved: 35,
    averageTime: 340,
    streak: 3,
    badges: [],
  },
  {
    rank: 6,
    id: 'user-10',
    name: 'Sarah Wilson',
    avatar: 'SW',
    department: 'Information Technology',
    totalScore: 1720,
    problemsSolved: 32,
    averageTime: 320,
    streak: 4,
    badges: ['consistent'],
  },
  {
    rank: 7,
    id: 'user-11',
    name: 'James Chen',
    avatar: 'JC',
    department: 'Computer Science',
    totalScore: 1650,
    problemsSolved: 30,
    averageTime: 355,
    streak: 2,
    badges: [],
  },
  {
    rank: 8,
    id: 'user-12',
    name: 'Emily Davis',
    avatar: 'ED',
    department: 'Data Science',
    totalScore: 1580,
    problemsSolved: 28,
    averageTime: 380,
    streak: 6,
    badges: ['streak_master'],
  },
];

// Mock Submissions for history
export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    assessmentId: 'assess-2',
    questionId: 'q-1',
    studentId: 'user-1',
    code: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    language: 'python',
    status: 'passed',
    score: 50,
    maxScore: 50,
    testResults: [
      { testCaseId: 'tc-1-1', passed: true, actualOutput: '[0,1]', expectedOutput: '[0,1]', executionTime: 12, memoryUsed: 8.5 },
      { testCaseId: 'tc-1-2', passed: true, actualOutput: '[1,2]', expectedOutput: '[1,2]', executionTime: 10, memoryUsed: 8.2 },
      { testCaseId: 'tc-1-3', passed: true, actualOutput: '[0,1]', expectedOutput: '[0,1]', executionTime: 11, memoryUsed: 8.4 },
      { testCaseId: 'tc-1-4', passed: true, actualOutput: '[3,4]', expectedOutput: '[3,4]', executionTime: 15, memoryUsed: 9.1 },
    ],
    executionTime: 48,
    memoryUsed: 8.5,
    submittedAt: '2026-01-15T14:30:00Z',
    plagiarismScore: 5,
  },
  {
    id: 'sub-2',
    assessmentId: 'assess-2',
    questionId: 'q-4',
    studentId: 'user-1',
    code: `def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    language: 'python',
    status: 'partial',
    score: 35,
    maxScore: 50,
    testResults: [
      { testCaseId: 'tc-5-1', passed: true, actualOutput: '4', expectedOutput: '4', executionTime: 8, memoryUsed: 7.2 },
      { testCaseId: 'tc-5-2', passed: true, actualOutput: '-1', expectedOutput: '-1', executionTime: 6, memoryUsed: 7.0 },
      { testCaseId: 'tc-5-3', passed: false, actualOutput: '-1', expectedOutput: '0', executionTime: 7, memoryUsed: 7.1, error: 'Wrong answer' },
      { testCaseId: 'tc-5-4', passed: true, actualOutput: '3', expectedOutput: '3', executionTime: 9, memoryUsed: 7.4 },
      { testCaseId: 'tc-5-5', passed: false, actualOutput: '2', expectedOutput: '4', executionTime: 8, memoryUsed: 7.3, error: 'Wrong answer' },
    ],
    executionTime: 38,
    memoryUsed: 7.2,
    submittedAt: '2026-01-15T15:00:00Z',
    plagiarismScore: 12,
  },
  {
    id: 'sub-3',
    assessmentId: 'assess-2',
    questionId: 'q-6',
    studentId: 'user-1',
    code: `def climbStairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]`,
    language: 'python',
    status: 'passed',
    score: 50,
    maxScore: 50,
    testResults: [
      { testCaseId: 'tc-7-1', passed: true, actualOutput: '2', expectedOutput: '2', executionTime: 5, memoryUsed: 6.8 },
      { testCaseId: 'tc-7-2', passed: true, actualOutput: '3', expectedOutput: '3', executionTime: 5, memoryUsed: 6.9 },
      { testCaseId: 'tc-7-3', passed: true, actualOutput: '8', expectedOutput: '8', executionTime: 6, memoryUsed: 7.0 },
      { testCaseId: 'tc-7-4', passed: true, actualOutput: '1134903170', expectedOutput: '1134903170', executionTime: 8, memoryUsed: 7.5 },
    ],
    executionTime: 24,
    memoryUsed: 7.0,
    submittedAt: '2026-01-15T15:45:00Z',
    plagiarismScore: 3,
  },
];

// Mock Plagiarism Results
export const mockPlagiarismResults: PlagiarismResult[] = [
  {
    id: 'plag-1',
    submissionId: 'sub-5',
    studentId: 'user-5',
    studentName: 'David Kim',
    similarityScore: 78,
    matchedSubmissions: [
      {
        submissionId: 'sub-6',
        studentId: 'user-4',
        studentName: 'Priya Sharma',
        similarity: 78,
        matchedLines: [{ start: 2, end: 8 }, { start: 12, end: 15 }],
      },
    ],
    flagged: true,
    status: 'pending',
  },
  {
    id: 'plag-2',
    submissionId: 'sub-7',
    studentId: 'user-8',
    studentName: 'Jessica Lee',
    similarityScore: 45,
    matchedSubmissions: [
      {
        submissionId: 'sub-8',
        studentId: 'user-1',
        studentName: 'Alex Johnson',
        similarity: 45,
        matchedLines: [{ start: 5, end: 10 }],
      },
    ],
    flagged: false,
    status: 'cleared',
    reviewedBy: 'user-2',
    reviewedAt: '2026-01-15T16:00:00Z',
  },
];

// Mock Active Sessions (for live monitoring)
export const mockActiveSessions: ActiveSession[] = [
  {
    id: 'session-1',
    assessmentId: 'assess-1',
    studentId: 'user-1',
    studentName: 'Alex Johnson',
    avatar: 'AJ',
    startedAt: '2026-01-16T10:00:00Z',
    currentQuestion: 3,
    totalQuestions: 5,
    submittedQuestions: 2,
    status: 'active',
    lastActivity: new Date().toISOString(),
    ipAddress: '192.168.1.105',
    tabSwitches: 0,
    copyPasteCount: 1,
  },
  {
    id: 'session-2',
    assessmentId: 'assess-1',
    studentId: 'user-4',
    studentName: 'Priya Sharma',
    avatar: 'PS',
    startedAt: '2026-01-16T10:05:00Z',
    currentQuestion: 2,
    totalQuestions: 5,
    submittedQuestions: 1,
    status: 'active',
    lastActivity: new Date().toISOString(),
    ipAddress: '192.168.1.110',
    tabSwitches: 1,
    copyPasteCount: 0,
  },
  {
    id: 'session-3',
    assessmentId: 'assess-1',
    studentId: 'user-5',
    studentName: 'David Kim',
    avatar: 'DK',
    startedAt: '2026-01-16T10:02:00Z',
    currentQuestion: 4,
    totalQuestions: 5,
    submittedQuestions: 3,
    status: 'suspicious',
    lastActivity: new Date().toISOString(),
    ipAddress: '192.168.1.115',
    tabSwitches: 4,
    copyPasteCount: 3,
  },
  {
    id: 'session-4',
    assessmentId: 'assess-1',
    studentId: 'user-8',
    studentName: 'Jessica Lee',
    avatar: 'JL',
    startedAt: '2026-01-16T10:10:00Z',
    currentQuestion: 1,
    totalQuestions: 5,
    submittedQuestions: 0,
    status: 'idle',
    lastActivity: '2026-01-16T10:15:00Z',
    ipAddress: '192.168.1.120',
    tabSwitches: 0,
    copyPasteCount: 0,
  },
];
