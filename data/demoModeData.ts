import type { Assessment, Question, User } from '../types';

const now = new Date().toISOString();
const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

export const demoStudentUser: User = {
  id: 'demo-student-user',
  name: 'Demo Student',
  email: 'demo@student.codequest.app',
  role: 'student',
  avatar: 'DS',
  department: 'Computer Science',
  enrollmentId: 'DEMO-0001',
  status: 'active',
  createdAt: now,
  lastLogin: now,
};

export const demoQuestions: Question[] = [
  {
    id: 'demo-q-1',
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.

You may assume each input has exactly one valid answer, and you cannot use the same element twice.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: 0 1

Example 2:
Input: nums = [3,2,4], target = 6
Output: 1 2`,
    difficulty: 'easy',
    questionType: 'coding',
    topic: 'Arrays',
    tags: ['arrays', 'hash-table'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      { id: 'demo-q-1-tc-1', input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false, points: 10, timeLimit: 2000 },
      { id: 'demo-q-1-tc-2', input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: false, points: 10, timeLimit: 2000 },
      { id: 'demo-q-1-tc-3', input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true, points: 15, timeLimit: 2000 },
      { id: 'demo-q-1-tc-4', input: '4\n1 5 8 10\n13', expectedOutput: '1 2', isHidden: true, points: 15, timeLimit: 2000 },
    ],
    boilerplateCode: {
      python: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

n = int(input())
nums = list(map(int, input().split()))
target = int(input())
result = two_sum(nums, target)
print(result[0], result[1])
`,
      javascript: `function twoSum(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) return [seen[complement], i];
        seen[nums[i]] = i;
    }
    return [];
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);
    const result = twoSum(nums, target);
    console.log(result[0] + ' ' + result[1]);
});
`,
      java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) return new int[]{seen.get(complement), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        int[] result = twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) return {seen[complement], i};
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target; cin >> target;
    auto r = twoSum(nums, target);
    cout << r[0] << " " << r[1] << endl;
}
`,
    },
    hints: [
      'Use a hash map to remember numbers seen so far.',
      'For each number x, check if target - x has already appeared.',
      'You can solve this in O(n) time.',
    ],
    createdBy: 'demo-professor',
    createdAt: now,
    updatedAt: now,
    isVisible: true,
    usageCount: 0,
  },
  {
    id: 'demo-q-2',
    title: 'Valid Parentheses',
    description: `Given a string s containing only the characters '(', ')', '{', '}', '[' and ']', determine if the string is valid.

A string is valid if:
1) Open brackets are closed by the same type.
2) Open brackets are closed in the correct order.
3) Every closing bracket has a corresponding open bracket.

Example:
Input: s = "()[]{}"
Output: true`,
    difficulty: 'easy',
    questionType: 'coding',
    topic: 'Stacks',
    tags: ['stack', 'strings'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      { id: 'demo-q-2-tc-1', input: '()[]{}', expectedOutput: 'true', isHidden: false, points: 12, timeLimit: 2000 },
      { id: 'demo-q-2-tc-2', input: '(]', expectedOutput: 'false', isHidden: false, points: 12, timeLimit: 2000 },
      { id: 'demo-q-2-tc-3', input: '([)]', expectedOutput: 'false', isHidden: true, points: 13, timeLimit: 2000 },
      { id: 'demo-q-2-tc-4', input: '{[]}', expectedOutput: 'true', isHidden: true, points: 13, timeLimit: 2000 },
    ],
    boilerplateCode: {
      python: `def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in mapping:
            top = stack.pop() if stack else '#'
            if mapping[c] != top:
                return False
        else:
            stack.append(c)
    return not stack

s = input().strip()
print(str(is_valid(s)).lower())
`,
      javascript: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (map[c]) {
            if (stack.pop() !== map[c]) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.length === 0;
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(isValid(line.trim()).toString());
    rl.close();
});
`,
      java: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;
            }
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        System.out.println(isValid(s));
    }
}
`,
      cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;
        }
    }
    return st.empty();
}

int main() {
    string s; cin >> s;
    cout << (isValid(s) ? "true" : "false") << endl;
}
`,
    },
    hints: [
      'A stack is ideal for matching opening and closing pairs.',
      'Push opening brackets, pop and compare when you see a closing bracket.',
      'At the end, the stack should be empty.',
    ],
    createdBy: 'demo-professor',
    createdAt: now,
    updatedAt: now,
    isVisible: true,
    usageCount: 0,
  },
  {
    id: 'demo-q-3',
    title: 'Binary Search',
    description: `Given a sorted array of integers nums and an integer target, return the index of target if it exists, otherwise return -1.

You must write an algorithm with O(log n) runtime complexity.

Example:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4`,
    difficulty: 'medium',
    questionType: 'coding',
    topic: 'Binary Search',
    tags: ['binary-search', 'arrays'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      { id: 'demo-q-3-tc-1', input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isHidden: false, points: 12, timeLimit: 2000 },
      { id: 'demo-q-3-tc-2', input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', isHidden: false, points: 12, timeLimit: 2000 },
      { id: 'demo-q-3-tc-3', input: '1\n5\n5', expectedOutput: '0', isHidden: true, points: 13, timeLimit: 2000 },
      { id: 'demo-q-3-tc-4', input: '5\n1 3 5 7 9\n1', expectedOutput: '0', isHidden: true, points: 13, timeLimit: 2000 },
    ],
    boilerplateCode: {
      python: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

n = int(input())
nums = list(map(int, input().split()))
target = int(input())
print(binary_search(nums, target))
`,
      javascript: `function binarySearch(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);
    console.log(binarySearch(nums, target));
});
`,
      java: `import java.util.*;

public class Main {
    public static int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        System.out.println(search(nums, target));
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int search(vector<int>& nums, int target) {
    int left = 0, right = (int)nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target; cin >> target;
    cout << search(nums, target) << endl;
}
`,
    },
    hints: [
      'Keep left and right pointers and shrink the search space each step.',
      'Compute mid safely and compare nums[mid] with target.',
      'Move only one side each iteration to preserve O(log n).',
    ],
    createdBy: 'demo-professor',
    createdAt: now,
    updatedAt: now,
    isVisible: true,
    usageCount: 0,
  },
  {
    id: 'demo-q-4',
    title: 'Maximum Subarray',
    description: `Given an integer array nums, find the contiguous subarray with the largest sum and return that sum.

Example:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6.`,
    difficulty: 'medium',
    questionType: 'coding',
    topic: 'Dynamic Programming',
    tags: ['dp', 'greedy', 'arrays'],
    points: 50,
    timeLimit: 2,
    memoryLimit: 256,
    testCases: [
      { id: 'demo-q-4-tc-1', input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false, points: 12, timeLimit: 2000 },
      { id: 'demo-q-4-tc-2', input: '1\n1', expectedOutput: '1', isHidden: false, points: 12, timeLimit: 2000 },
      { id: 'demo-q-4-tc-3', input: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: true, points: 13, timeLimit: 2000 },
      { id: 'demo-q-4-tc-4', input: '3\n-1 -2 -3', expectedOutput: '-1', isHidden: true, points: 13, timeLimit: 2000 },
    ],
    boilerplateCode: {
      python: `def max_subarray(nums):
    max_sum = current_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum

n = int(input())
nums = list(map(int, input().split()))
print(max_subarray(nums))
`,
      javascript: `function maxSubArray(nums) {
    let maxSum = nums[0], curSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curSum = Math.max(nums[i], curSum + nums[i]);
        maxSum = Math.max(maxSum, curSum);
    }
    return maxSum;
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    console.log(maxSubArray(nums));
});
`,
      java: `import java.util.*;

public class Main {
    public static int maxSubArray(int[] nums) {
        int maxSum = nums[0], curSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            curSum = Math.max(nums[i], curSum + nums[i]);
            maxSum = Math.max(maxSum, curSum);
        }
        return maxSum;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        System.out.println(maxSubArray(nums));
    }
}
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int maxSubArray(vector<int>& nums) {
    int maxSum = nums[0], curSum = nums[0];
    for (int i = 1; i < (int)nums.size(); i++) {
        curSum = max(nums[i], curSum + nums[i]);
        maxSum = max(maxSum, curSum);
    }
    return maxSum;
}

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << maxSubArray(nums) << endl;
}
`,
    },
    hints: [
      'Track best ending at current index and best overall.',
      'At each step, decide to extend previous subarray or start fresh.',
      "This is Kadane's algorithm in O(n).",
    ],
    createdBy: 'demo-professor',
    createdAt: now,
    updatedAt: now,
    isVisible: true,
    usageCount: 0,
  },
];

export const demoAssessment: Assessment = {
  id: 'demo-assessment-1',
  title: 'CodeQuest Demo Assessment',
  description: 'A guided, interview-style coding assessment with multiple questions, hints, visible and hidden test cases, and secure fullscreen monitoring.',
  type: 'practice',
  difficulty: 'intermediate',
  duration: 60,
  passingScore: 60,
  totalPoints: demoQuestions.reduce((sum, q) => sum + q.points, 0),
  questions: demoQuestions,
  startDate: now,
  endDate: weekFromNow,
  status: 'active',
  settings: {
    randomizeQuestions: false,
    showCorrectAnswers: false,
    showScoreImmediately: true,
    allowRetakes: true,
    maxAttempts: 50,
    ipRestriction: false,
    allowedIPs: [],
    plagiarismSensitivity: 'medium',
    proctoring: true,
  },
  createdBy: 'demo-professor',
  createdAt: now,
  courseCode: 'DEMO-101',
  courseName: 'Interactive Coding Demo',
  professorName: 'CodeQuest Team',
};
