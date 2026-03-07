/**
 * Seed DSA Questions & Assessments for Bennett University CodeQuest
 *
 * Usage:
 *   cd bennett-backend
 *   npx tsx scripts/seed-dsa.ts
 *
 * Requires .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find an admin user to use as created_by
async function getAdminUserId(): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .single();
  if (!data) throw new Error("No admin user found. Create an admin first.");
  return data.user_id;
}

interface QuestionSeed {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  tags: string[];
  points: number;
  timeLimit: number;
  memoryLimit: number;
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    points: number;
    timeLimit: number;
  }[];
  boilerplateCode: { cpp: string };
  solution: string;
  hints: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// DSA Questions — 32 questions across 8 topics, C++ only
// ═══════════════════════════════════════════════════════════════════════

const questions: QuestionSeed[] = [
  // ── Topic 1: Arrays (4 questions) ──────────────────────────────────
  {
    title: "Two Sum",
    description:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\n**Input:** First line contains n (size of array) and target. Second line contains n space-separated integers.\n**Output:** Two space-separated indices (0-indexed).",
    difficulty: "easy",
    topic: "Arrays",
    tags: ["arrays", "hash-map", "two-pointer"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "4 9\n2 7 11 15", expectedOutput: "0 1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "3 6\n3 2 4", expectedOutput: "1 2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "2 6\n3 3", expectedOutput: "0 1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "5 10\n1 2 3 4 6", expectedOutput: "3 4", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    unordered_map<int,int> mp;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (mp.count(comp)) { cout << mp[comp] << " " << i; return 0; }
        mp[nums[i]] = i;
    }
    return 0;
}`,
    hints: ["Use a hash map to store values you've seen so far."],
  },
  {
    title: "Maximum Subarray (Kadane's Algorithm)",
    description:
      "Given an integer array `nums`, find the subarray with the largest sum and return its sum.\n\n**Input:** First line: n. Second line: n space-separated integers.\n**Output:** Maximum subarray sum.",
    difficulty: "medium",
    topic: "Arrays",
    tags: ["arrays", "dynamic-programming", "kadane"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "5\n5 4 -1 7 8", expectedOutput: "23", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "3\n-1 -2 -3", expectedOutput: "-1", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int maxSum = nums[0], cur = nums[0];
    for (int i = 1; i < n; i++) {
        cur = max(nums[i], cur + nums[i]);
        maxSum = max(maxSum, cur);
    }
    cout << maxSum;
}`,
    hints: ["Kadane's algorithm: track current sum and max sum."],
  },
  {
    title: "Rotate Array",
    description:
      "Given an integer array `nums`, rotate the array to the right by `k` steps.\n\n**Input:** First line: n k. Second line: n space-separated integers.\n**Output:** The rotated array, space-separated.",
    difficulty: "easy",
    topic: "Arrays",
    tags: ["arrays", "rotation"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "7 3\n1 2 3 4 5 6 7", expectedOutput: "5 6 7 1 2 3 4", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "3 1\n1 2 3", expectedOutput: "3 1 2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "4 4\n1 2 3 4", expectedOutput: "1 2 3 4", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "2 5\n1 2", expectedOutput: "2 1", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, k; cin >> n >> k;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    k %= n;
    reverse(nums.begin(), nums.end());
    reverse(nums.begin(), nums.begin()+k);
    reverse(nums.begin()+k, nums.end());
    for (int i = 0; i < n; i++) cout << nums[i] << (i<n-1?" ":"");
}`,
    hints: ["Reverse the whole array, then reverse first k and last n-k elements."],
  },
  {
    title: "Find Missing Number",
    description:
      "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.\n\n**Input:** First line: n. Second line: n space-separated integers.\n**Output:** The missing number.",
    difficulty: "easy",
    topic: "Arrays",
    tags: ["arrays", "math", "xor"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3\n3 0 1", expectedOutput: "2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "2\n0 1", expectedOutput: "2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "9\n9 6 4 2 3 5 7 0 1", expectedOutput: "8", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "1\n0", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    int sum = n*(n+1)/2;
    for (int i = 0; i < n; i++) { int x; cin >> x; sum -= x; }
    cout << sum;
}`,
    hints: ["Sum of 0..n is n*(n+1)/2. Subtract actual sum."],
  },

  // ── Topic 2: Strings (4 questions) ─────────────────────────────────
  {
    title: "Valid Palindrome",
    description:
      "Given a string s, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.\n\n**Input:** A single string.\n**Output:** `true` or `false`.",
    difficulty: "easy",
    topic: "Strings",
    tags: ["strings", "two-pointer"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "race a car", expectedOutput: "false", isHidden: false, points: 2, timeLimit: 2000 },
      { input: " ", expectedOutput: "true", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "0P", expectedOutput: "false", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    string t;
    for (char c : s) if (isalnum(c)) t += tolower(c);
    string r = t; reverse(r.begin(), r.end());
    cout << (t == r ? "true" : "false");
}`,
    hints: ["Filter to alphanumeric, convert to lowercase, then check."],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description:
      "Given a string `s`, find the length of the longest substring without repeating characters.\n\n**Input:** A single string.\n**Output:** An integer.",
    difficulty: "medium",
    topic: "Strings",
    tags: ["strings", "sliding-window", "hash-set"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "bbbbb", expectedOutput: "1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "pwwkew", expectedOutput: "3", isHidden: true, points: 5, timeLimit: 2000 },
      { input: " ", expectedOutput: "1", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    getline(cin, s);

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; getline(cin, s);
    unordered_map<char,int> mp;
    int ans = 0, l = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        if (mp.count(s[r])) l = max(l, mp[s[r]]+1);
        mp[s[r]] = r;
        ans = max(ans, r-l+1);
    }
    cout << ans;
}`,
    hints: ["Sliding window with a hash map tracking last index of each char."],
  },
  {
    title: "Valid Anagram",
    description:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\n**Input:** Two lines, each containing a string.\n**Output:** `true` or `false`.",
    difficulty: "easy",
    topic: "Strings",
    tags: ["strings", "hash-map", "sorting"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "anagram\nnagaram", expectedOutput: "true", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "rat\ncar", expectedOutput: "false", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "a\na", expectedOutput: "true", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "ab\nba", expectedOutput: "true", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s, t;
    cin >> s >> t;

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s, t; cin >> s >> t;
    if (s.size() != t.size()) { cout << "false"; return 0; }
    int cnt[26] = {};
    for (int i = 0; i < (int)s.size(); i++) { cnt[s[i]-'a']++; cnt[t[i]-'a']--; }
    for (int i = 0; i < 26; i++) if (cnt[i]) { cout << "false"; return 0; }
    cout << "true";
}`,
    hints: ["Count character frequencies."],
  },
  {
    title: "Longest Common Prefix",
    description:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string \"\".\n\n**Input:** First line: n. Next n lines: one string each.\n**Output:** The longest common prefix.",
    difficulty: "easy",
    topic: "Strings",
    tags: ["strings"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3\nflower\nflow\nflight", expectedOutput: "fl", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "3\ndog\nracecar\ncar", expectedOutput: "", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\nalone", expectedOutput: "alone", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "2\nab\na", expectedOutput: "a", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<string> strs(n);
    for (int i = 0; i < n; i++) cin >> strs[i];
    if (n == 0) { cout << ""; return 0; }
    string prefix = strs[0];
    for (int i = 1; i < n; i++) {
        while (strs[i].find(prefix) != 0) prefix = prefix.substr(0, prefix.size()-1);
        if (prefix.empty()) break;
    }
    cout << prefix;
}`,
    hints: ["Start with the first string as prefix, then shrink."],
  },

  // ── Topic 3: Linked Lists (4 questions) ────────────────────────────
  {
    title: "Reverse a Linked List",
    description:
      "Given the head of a singly linked list, reverse the list, and print the reversed list.\n\n**Input:** First line: n. Second line: n space-separated integers (node values).\n**Output:** The reversed list, space-separated.",
    difficulty: "easy",
    topic: "Linked Lists",
    tags: ["linked-list", "pointers"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "2\n1 2", expectedOutput: "2 1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "4\n10 20 30 40", expectedOutput: "40 30 20 10", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

int main() {
    int n;
    cin >> n;
    ListNode* head = nullptr;
    ListNode* tail = nullptr;
    for (int i = 0; i < n; i++) {
        int v; cin >> v;
        ListNode* node = new ListNode(v);
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    // Reverse the linked list here

    // Print result
    ListNode* cur = head;
    while (cur) {
        cout << cur->val;
        if (cur->next) cout << " ";
        cur = cur->next;
    }
    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
struct ListNode { int val; ListNode* next; ListNode(int x):val(x),next(nullptr){} };
int main() {
    int n; cin >> n;
    ListNode *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) { int v; cin >> v; ListNode* nd = new ListNode(v); if(!head) head=tail=nd; else{tail->next=nd;tail=nd;} }
    ListNode *prev=nullptr, *cur=head;
    while(cur){ListNode*nxt=cur->next;cur->next=prev;prev=cur;cur=nxt;}
    head=prev;
    cur=head;
    while(cur){cout<<cur->val;if(cur->next)cout<<" ";cur=cur->next;}
}`,
    hints: ["Use three pointers: prev, current, next."],
  },
  {
    title: "Detect Cycle in Linked List",
    description:
      "Given an array representing a linked list where each element points to the next index, determine if there is a cycle. The last valid node points to -1 (no cycle) or to some previous index (cycle).\n\n**Input:** First line: n. Second line: n space-separated integers (next pointers, -1 for null).\n**Output:** `true` if cycle exists, `false` otherwise.",
    difficulty: "medium",
    topic: "Linked Lists",
    tags: ["linked-list", "two-pointer", "floyd"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "4\n1 2 3 1", expectedOutput: "true", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "4\n1 2 3 -1", expectedOutput: "false", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n-1", expectedOutput: "false", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "2\n1 0", expectedOutput: "true", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> next_ptr(n);
    for (int i = 0; i < n; i++) cin >> next_ptr[i];

    // Use Floyd's cycle detection

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nxt(n);
    for (int i = 0; i < n; i++) cin >> nxt[i];
    int slow = 0, fast = 0;
    while (true) {
        if (nxt[slow] == -1) { cout << "false"; return 0; }
        slow = nxt[slow];
        if (nxt[fast] == -1 || nxt[nxt[fast]] == -1) { cout << "false"; return 0; }
        fast = nxt[nxt[fast]];
        if (slow == fast) { cout << "true"; return 0; }
    }
}`,
    hints: ["Floyd's tortoise and hare: slow moves 1 step, fast moves 2 steps."],
  },
  {
    title: "Merge Two Sorted Lists",
    description:
      "Merge two sorted arrays into one sorted array.\n\n**Input:** First line: n m. Second line: n sorted integers. Third line: m sorted integers.\n**Output:** Merged sorted array, space-separated.",
    difficulty: "easy",
    topic: "Linked Lists",
    tags: ["linked-list", "merge", "two-pointer"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3 3\n1 2 4\n1 3 4", expectedOutput: "1 1 2 3 4 4", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "0 1\n\n0", expectedOutput: "0", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 1\n5\n3", expectedOutput: "3 5", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "3 2\n1 3 5\n2 4", expectedOutput: "1 2 3 4 5", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<int> a(n), b(m);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = 0; i < m; i++) cin >> b[i];

    // Merge the two sorted arrays

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m; cin >> n >> m;
    vector<int> a(n), b(m);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = 0; i < m; i++) cin >> b[i];
    vector<int> res;
    int i=0,j=0;
    while(i<n&&j<m){if(a[i]<=b[j])res.push_back(a[i++]);else res.push_back(b[j++]);}
    while(i<n)res.push_back(a[i++]);
    while(j<m)res.push_back(b[j++]);
    for(int k=0;k<(int)res.size();k++){cout<<res[k];if(k<(int)res.size()-1)cout<<" ";}
}`,
    hints: ["Two-pointer merge technique."],
  },
  {
    title: "Middle of Linked List",
    description:
      "Given a list of integers (representing a linked list), find the middle element. If there are two middle nodes, return the second one.\n\n**Input:** First line: n. Second line: n space-separated integers.\n**Output:** The middle value.",
    difficulty: "easy",
    topic: "Linked Lists",
    tags: ["linked-list", "two-pointer"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "3", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "6\n1 2 3 4 5 6", expectedOutput: "4", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "2\n1 2", expectedOutput: "2", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Find the middle element

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << nums[n/2];
}`,
    hints: ["Slow/fast pointer or simply index n/2."],
  },

  // ── Topic 4: Stacks & Queues (4 questions) ─────────────────────────
  {
    title: "Valid Parentheses",
    description:
      "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\n**Input:** A single string.\n**Output:** `true` or `false`.",
    difficulty: "easy",
    topic: "Stacks & Queues",
    tags: ["stack", "parentheses"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "()", expectedOutput: "true", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "()[]{}", expectedOutput: "true", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "(]", expectedOutput: "false", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "([)]", expectedOutput: "false", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string s; cin >> s;
    stack<char> st;
    for (char c : s) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else {
            if (st.empty()) { cout<<"false"; return 0; }
            char t = st.top(); st.pop();
            if ((c==')'&&t!='(') || (c==']'&&t!='[') || (c=='}'&&t!='{')) { cout<<"false"; return 0; }
        }
    }
    cout << (st.empty()?"true":"false");
}`,
    hints: ["Use a stack. Push opening brackets, pop and match for closing."],
  },
  {
    title: "Next Greater Element",
    description:
      "Given an array, print the next greater element for every element. The next greater element for an element x is the first greater element on the right side. Print -1 if none exists.\n\n**Input:** First line: n. Second line: n integers.\n**Output:** n space-separated integers representing next greater elements.",
    difficulty: "medium",
    topic: "Stacks & Queues",
    tags: ["stack", "monotonic-stack"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "4\n4 5 2 25", expectedOutput: "5 25 25 -1", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "4\n13 7 6 12", expectedOutput: "-1 12 12 -1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n5", expectedOutput: "-1", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "5\n1 2 3 4 5", expectedOutput: "2 3 4 5 -1", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> arr(n), res(n, -1);
    for (int i = 0; i < n; i++) cin >> arr[i];
    stack<int> st;
    for (int i = n-1; i >= 0; i--) {
        while(!st.empty()&&st.top()<=arr[i]) st.pop();
        if(!st.empty()) res[i]=st.top();
        st.push(arr[i]);
    }
    for(int i=0;i<n;i++){cout<<res[i];if(i<n-1)cout<<" ";}
}`,
    hints: ["Use a monotonic stack traversing from right to left."],
  },
  {
    title: "Implement Queue Using Stacks",
    description:
      "Implement a queue using two stacks. Process operations:\n- `push x` — enqueue x\n- `pop` — dequeue and print the front element\n- `peek` — print the front element without removing\n\n**Input:** First line: q (number of operations). Next q lines: operations.\n**Output:** One line per pop/peek operation.",
    difficulty: "medium",
    topic: "Stacks & Queues",
    tags: ["stack", "queue", "design"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5\npush 1\npush 2\npeek\npop\npeek", expectedOutput: "1\n1\n2", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "4\npush 10\npush 20\npop\npop", expectedOutput: "10\n20", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "3\npush 5\npeek\npop", expectedOutput: "5\n5", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "6\npush 1\npush 2\npush 3\npop\npop\npop", expectedOutput: "1\n2\n3", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int q;
    cin >> q;

    // Implement queue using two stacks

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int q; cin >> q;
    stack<int> s1, s2;
    while (q--) {
        string op; cin >> op;
        if (op == "push") { int x; cin >> x; s1.push(x); }
        else {
            if (s2.empty()) while(!s1.empty()){s2.push(s1.top());s1.pop();}
            if (op == "pop") { cout << s2.top() << "\\n"; s2.pop(); }
            else cout << s2.top() << "\\n";
        }
    }
}`,
    hints: ["Use two stacks: one for pushing, transfer to second for popping."],
  },
  {
    title: "Circular Queue Implementation",
    description:
      "Implement a circular queue of fixed size k. Support operations:\n- `enqueue x` — add element (print `true`/`false`)\n- `dequeue` — remove front (print value or `-1` if empty)\n- `front` — print front element or `-1`\n\n**Input:** First line: k q. Next q lines: operations.\n**Output:** One line per operation.",
    difficulty: "medium",
    topic: "Stacks & Queues",
    tags: ["queue", "circular-queue", "design"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3 6\nenqueue 1\nenqueue 2\nenqueue 3\nenqueue 4\ndequeue\nenqueue 4", expectedOutput: "true\ntrue\ntrue\nfalse\n1\ntrue", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "2 4\nenqueue 5\nfront\ndequeue\nfront", expectedOutput: "true\n5\n5\n-1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 3\nenqueue 1\nenqueue 2\ndequeue", expectedOutput: "true\nfalse\n1", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "3 5\ndequeue\nenqueue 1\nenqueue 2\nfront\ndequeue", expectedOutput: "-1\ntrue\ntrue\n1\n1", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int k, q;
    cin >> k >> q;

    // Implement circular queue of size k

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int k, q; cin >> k >> q;
    vector<int> buf(k);
    int head=0,tail=0,cnt=0;
    while(q--){
        string op; cin >> op;
        if(op=="enqueue"){int x;cin>>x;if(cnt==k){cout<<"false\\n";}else{buf[tail]=x;tail=(tail+1)%k;cnt++;cout<<"true\\n";}}
        else if(op=="dequeue"){if(cnt==0){cout<<"-1\\n";}else{cout<<buf[head]<<"\\n";head=(head+1)%k;cnt--;}}
        else{cout<<(cnt==0?-1:buf[head])<<"\\n";}
    }
}`,
    hints: ["Use an array with head and tail pointers, modulo k."],
  },

  // ── Topic 5: Sorting & Searching (4 questions) ─────────────────────
  {
    title: "Binary Search",
    description:
      "Given a sorted array of integers and a target value, return the index if found, otherwise return -1.\n\n**Input:** First line: n target. Second line: n sorted integers.\n**Output:** Index (0-based) or -1.",
    difficulty: "easy",
    topic: "Sorting & Searching",
    tags: ["binary-search"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "6 9\n-1 0 3 5 9 12", expectedOutput: "4", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "6 2\n-1 0 3 5 9 12", expectedOutput: "-1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 5\n5", expectedOutput: "0", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "3 1\n1 2 3", expectedOutput: "0", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write binary search here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, target; cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int lo=0, hi=n-1;
    while(lo<=hi){int mid=(lo+hi)/2;if(nums[mid]==target){cout<<mid;return 0;}if(nums[mid]<target)lo=mid+1;else hi=mid-1;}
    cout << -1;
}`,
    hints: ["Standard binary search with lo, hi, mid."],
  },
  {
    title: "Merge Sort",
    description:
      "Sort an array using merge sort algorithm.\n\n**Input:** First line: n. Second line: n integers.\n**Output:** Sorted array, space-separated.",
    difficulty: "medium",
    topic: "Sorting & Searching",
    tags: ["sorting", "merge-sort", "divide-and-conquer"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5\n5 2 3 1 4", expectedOutput: "1 2 3 4 5", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "4\n4 3 2 1", expectedOutput: "1 2 3 4", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "6\n10 -1 3 3 0 7", expectedOutput: "-1 0 3 3 7 10", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

void mergeSort(vector<int>& arr, int l, int r) {
    // Implement merge sort
}

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    mergeSort(arr, 0, n - 1);

    for (int i = 0; i < n; i++) {
        cout << arr[i];
        if (i < n - 1) cout << " ";
    }
    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
void mergeSort(vector<int>& a, int l, int r) {
    if (l >= r) return;
    int m = (l+r)/2;
    mergeSort(a,l,m); mergeSort(a,m+1,r);
    vector<int> tmp;
    int i=l,j=m+1;
    while(i<=m&&j<=r){if(a[i]<=a[j])tmp.push_back(a[i++]);else tmp.push_back(a[j++]);}
    while(i<=m)tmp.push_back(a[i++]);
    while(j<=r)tmp.push_back(a[j++]);
    for(int k=l;k<=r;k++)a[k]=tmp[k-l];
}
int main(){int n;cin>>n;vector<int>a(n);for(int i=0;i<n;i++)cin>>a[i];mergeSort(a,0,n-1);for(int i=0;i<n;i++){cout<<a[i];if(i<n-1)cout<<" ";}}`,
    hints: ["Divide, recursively sort, then merge."],
  },
  {
    title: "Quick Sort",
    description:
      "Sort an array using quick sort algorithm.\n\n**Input:** First line: n. Second line: n integers.\n**Output:** Sorted array, space-separated.",
    difficulty: "medium",
    topic: "Sorting & Searching",
    tags: ["sorting", "quick-sort", "divide-and-conquer"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5\n10 7 8 9 1", expectedOutput: "1 7 8 9 10", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "3\n3 2 1", expectedOutput: "1 2 3", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n42", expectedOutput: "42", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "6\n5 5 5 5 5 5", expectedOutput: "5 5 5 5 5 5", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

void quickSort(vector<int>& arr, int low, int high) {
    // Implement quick sort
}

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    quickSort(arr, 0, n - 1);

    for (int i = 0; i < n; i++) {
        cout << arr[i];
        if (i < n - 1) cout << " ";
    }
    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int partition(vector<int>&a,int lo,int hi){int p=a[hi],i=lo-1;for(int j=lo;j<hi;j++)if(a[j]<=p)swap(a[++i],a[j]);swap(a[i+1],a[hi]);return i+1;}
void quickSort(vector<int>&a,int lo,int hi){if(lo<hi){int p=partition(a,lo,hi);quickSort(a,lo,p-1);quickSort(a,p+1,hi);}}
int main(){int n;cin>>n;vector<int>a(n);for(int i=0;i<n;i++)cin>>a[i];quickSort(a,0,n-1);for(int i=0;i<n;i++){cout<<a[i];if(i<n-1)cout<<" ";}}`,
    hints: ["Choose pivot (e.g. last element), partition around it, recurse."],
  },
  {
    title: "Search in Rotated Sorted Array",
    description:
      "Given a rotated sorted array (no duplicates) and a target, find the index of the target or return -1.\n\n**Input:** First line: n target. Second line: n integers.\n**Output:** Index or -1.",
    difficulty: "hard",
    topic: "Sorting & Searching",
    tags: ["binary-search", "rotated-array"],
    points: 20,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "7 0\n4 5 6 7 0 1 2", expectedOutput: "4", isHidden: false, points: 4, timeLimit: 2000 },
      { input: "7 3\n4 5 6 7 0 1 2", expectedOutput: "-1", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "1 0\n1", expectedOutput: "-1", isHidden: true, points: 6, timeLimit: 2000 },
      { input: "5 5\n3 4 5 1 2", expectedOutput: "2", isHidden: true, points: 7, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    // Write your solution here

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n,target; cin>>n>>target;
    vector<int> a(n);
    for(int i=0;i<n;i++)cin>>a[i];
    int lo=0,hi=n-1;
    while(lo<=hi){
        int mid=(lo+hi)/2;
        if(a[mid]==target){cout<<mid;return 0;}
        if(a[lo]<=a[mid]){if(a[lo]<=target&&target<a[mid])hi=mid-1;else lo=mid+1;}
        else{if(a[mid]<target&&target<=a[hi])lo=mid+1;else hi=mid-1;}
    }
    cout<<-1;
}`,
    hints: ["Modified binary search: determine which half is sorted."],
  },

  // ── Topic 6: Trees (4 questions) ────────────────────────────────────
  {
    title: "Binary Tree Inorder Traversal",
    description:
      "Given a binary tree represented as a level-order array (use -1 for null nodes), print its inorder traversal.\n\n**Input:** First line: n. Second line: n values (-1 = null).\n**Output:** Inorder traversal, space-separated.",
    difficulty: "easy",
    topic: "Trees",
    tags: ["tree", "traversal", "inorder"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3\n1 -1 2", expectedOutput: "1 2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "7\n1 2 3 4 5 -1 -1", expectedOutput: "4 2 5 1 3", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "7\n3 1 4 -1 2 -1 -1", expectedOutput: "1 2 3 4", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* buildTree(vector<int>& vals) {
    if (vals.empty() || vals[0] == -1) return nullptr;
    TreeNode* root = new TreeNode(vals[0]);
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < (int)vals.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < (int)vals.size() && vals[i] != -1) { cur->left = new TreeNode(vals[i]); q.push(cur->left); }
        i++;
        if (i < (int)vals.size() && vals[i] != -1) { cur->right = new TreeNode(vals[i]); q.push(cur->right); }
        i++;
    }
    return root;
}

int main() {
    int n; cin >> n;
    vector<int> vals(n);
    for (int i = 0; i < n; i++) cin >> vals[i];
    TreeNode* root = buildTree(vals);

    // Print inorder traversal

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
struct TreeNode{int val;TreeNode*left,*right;TreeNode(int x):val(x),left(nullptr),right(nullptr){}};
TreeNode*buildTree(vector<int>&v){if(v.empty()||v[0]==-1)return nullptr;TreeNode*r=new TreeNode(v[0]);queue<TreeNode*>q;q.push(r);int i=1;while(!q.empty()&&i<(int)v.size()){TreeNode*c=q.front();q.pop();if(i<(int)v.size()&&v[i]!=-1){c->left=new TreeNode(v[i]);q.push(c->left);}i++;if(i<(int)v.size()&&v[i]!=-1){c->right=new TreeNode(v[i]);q.push(c->right);}i++;}return r;}
void inorder(TreeNode*n,vector<int>&res){if(!n)return;inorder(n->left,res);res.push_back(n->val);inorder(n->right,res);}
int main(){int n;cin>>n;vector<int>v(n);for(int i=0;i<n;i++)cin>>v[i];TreeNode*root=buildTree(v);vector<int>res;inorder(root,res);for(int i=0;i<(int)res.size();i++){cout<<res[i];if(i<(int)res.size()-1)cout<<" ";}}`,
    hints: ["Recursive: left, node, right."],
  },
  {
    title: "Maximum Depth of Binary Tree",
    description:
      "Given a binary tree (level-order array, -1 for null), return its maximum depth.\n\n**Input:** First line: n. Second line: n values.\n**Output:** Maximum depth.",
    difficulty: "easy",
    topic: "Trees",
    tags: ["tree", "recursion", "dfs"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5\n3 9 20 -1 -1", expectedOutput: "2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "7\n3 9 20 -1 -1 15 7", expectedOutput: "3", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "0\n", expectedOutput: "0", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* buildTree(vector<int>& vals) {
    if (vals.empty() || vals[0] == -1) return nullptr;
    TreeNode* root = new TreeNode(vals[0]);
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < (int)vals.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < (int)vals.size() && vals[i] != -1) { cur->left = new TreeNode(vals[i]); q.push(cur->left); }
        i++;
        if (i < (int)vals.size() && vals[i] != -1) { cur->right = new TreeNode(vals[i]); q.push(cur->right); }
        i++;
    }
    return root;
}

int main() {
    int n; cin >> n;
    vector<int> vals(n);
    for (int i = 0; i < n; i++) cin >> vals[i];
    TreeNode* root = buildTree(vals);

    // Find maximum depth

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
struct TreeNode{int val;TreeNode*left,*right;TreeNode(int x):val(x),left(nullptr),right(nullptr){}};
TreeNode*buildTree(vector<int>&v){if(v.empty()||v[0]==-1)return nullptr;TreeNode*r=new TreeNode(v[0]);queue<TreeNode*>q;q.push(r);int i=1;while(!q.empty()&&i<(int)v.size()){TreeNode*c=q.front();q.pop();if(i<(int)v.size()&&v[i]!=-1){c->left=new TreeNode(v[i]);q.push(c->left);}i++;if(i<(int)v.size()&&v[i]!=-1){c->right=new TreeNode(v[i]);q.push(c->right);}i++;}return r;}
int depth(TreeNode*n){if(!n)return 0;return 1+max(depth(n->left),depth(n->right));}
int main(){int n;cin>>n;vector<int>v(n);for(int i=0;i<n;i++)cin>>v[i];TreeNode*root=buildTree(v);cout<<depth(root);}`,
    hints: ["Recursive: 1 + max(depth(left), depth(right))."],
  },
  {
    title: "Level Order Traversal (BFS)",
    description:
      "Given a binary tree (level-order array, -1 for null), print each level on a separate line.\n\n**Input:** First line: n. Second line: n values.\n**Output:** Each level on its own line, values space-separated.",
    difficulty: "medium",
    topic: "Trees",
    tags: ["tree", "bfs", "level-order"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "7\n3 9 20 -1 -1 15 7", expectedOutput: "3\n9 20\n15 7", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "3\n1 2 3", expectedOutput: "1\n2 3", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "5\n1 2 -1 3 -1", expectedOutput: "1\n2\n3", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* buildTree(vector<int>& vals) {
    if (vals.empty() || vals[0] == -1) return nullptr;
    TreeNode* root = new TreeNode(vals[0]);
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < (int)vals.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < (int)vals.size() && vals[i] != -1) { cur->left = new TreeNode(vals[i]); q.push(cur->left); }
        i++;
        if (i < (int)vals.size() && vals[i] != -1) { cur->right = new TreeNode(vals[i]); q.push(cur->right); }
        i++;
    }
    return root;
}

int main() {
    int n; cin >> n;
    vector<int> vals(n);
    for (int i = 0; i < n; i++) cin >> vals[i];
    TreeNode* root = buildTree(vals);

    // Print level order traversal

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
struct TreeNode{int val;TreeNode*left,*right;TreeNode(int x):val(x),left(nullptr),right(nullptr){}};
TreeNode*buildTree(vector<int>&v){if(v.empty()||v[0]==-1)return nullptr;TreeNode*r=new TreeNode(v[0]);queue<TreeNode*>q;q.push(r);int i=1;while(!q.empty()&&i<(int)v.size()){TreeNode*c=q.front();q.pop();if(i<(int)v.size()&&v[i]!=-1){c->left=new TreeNode(v[i]);q.push(c->left);}i++;if(i<(int)v.size()&&v[i]!=-1){c->right=new TreeNode(v[i]);q.push(c->right);}i++;}return r;}
int main(){int n;cin>>n;vector<int>v(n);for(int i=0;i<n;i++)cin>>v[i];TreeNode*root=buildTree(v);if(!root)return 0;queue<TreeNode*>q;q.push(root);bool first=true;while(!q.empty()){int sz=q.size();if(!first)cout<<"\\n";first=false;for(int i=0;i<sz;i++){TreeNode*c=q.front();q.pop();if(i)cout<<" ";cout<<c->val;if(c->left)q.push(c->left);if(c->right)q.push(c->right);}}}`,
    hints: ["BFS with queue; process level-by-level using size."],
  },
  {
    title: "Validate Binary Search Tree",
    description:
      "Given a binary tree (level-order array, -1 for null), determine if it is a valid BST.\n\n**Input:** First line: n. Second line: n values.\n**Output:** `true` or `false`.",
    difficulty: "medium",
    topic: "Trees",
    tags: ["tree", "bst", "validation"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3\n2 1 3", expectedOutput: "true", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "5\n5 1 4 -1 -1", expectedOutput: "false", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1\n1", expectedOutput: "true", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "7\n5 3 7 2 4 6 8", expectedOutput: "true", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* buildTree(vector<int>& vals) {
    if (vals.empty() || vals[0] == -1) return nullptr;
    TreeNode* root = new TreeNode(vals[0]);
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < (int)vals.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < (int)vals.size() && vals[i] != -1) { cur->left = new TreeNode(vals[i]); q.push(cur->left); }
        i++;
        if (i < (int)vals.size() && vals[i] != -1) { cur->right = new TreeNode(vals[i]); q.push(cur->right); }
        i++;
    }
    return root;
}

int main() {
    int n; cin >> n;
    vector<int> vals(n);
    for (int i = 0; i < n; i++) cin >> vals[i];
    TreeNode* root = buildTree(vals);

    // Validate BST

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
struct TreeNode{int val;TreeNode*left,*right;TreeNode(int x):val(x),left(nullptr),right(nullptr){}};
TreeNode*buildTree(vector<int>&v){if(v.empty()||v[0]==-1)return nullptr;TreeNode*r=new TreeNode(v[0]);queue<TreeNode*>q;q.push(r);int i=1;while(!q.empty()&&i<(int)v.size()){TreeNode*c=q.front();q.pop();if(i<(int)v.size()&&v[i]!=-1){c->left=new TreeNode(v[i]);q.push(c->left);}i++;if(i<(int)v.size()&&v[i]!=-1){c->right=new TreeNode(v[i]);q.push(c->right);}i++;}return r;}
bool valid(TreeNode*n,long lo,long hi){if(!n)return true;if(n->val<=lo||n->val>=hi)return false;return valid(n->left,lo,n->val)&&valid(n->right,n->val,hi);}
int main(){int n;cin>>n;vector<int>v(n);for(int i=0;i<n;i++)cin>>v[i];TreeNode*root=buildTree(v);cout<<(valid(root,LONG_MIN,LONG_MAX)?"true":"false");}`,
    hints: ["Pass min/max bounds recursively."],
  },

  // ── Topic 7: Graphs (4 questions) ───────────────────────────────────
  {
    title: "BFS of Graph",
    description:
      "Given an undirected graph with V vertices (0-indexed) and E edges, print the BFS traversal starting from vertex 0.\n\n**Input:** First line: V E. Next E lines: two integers u v (edge).\n**Output:** BFS order, space-separated.",
    difficulty: "medium",
    topic: "Graphs",
    tags: ["graph", "bfs"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5 4\n0 1\n0 2\n1 3\n2 4", expectedOutput: "0 1 2 3 4", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "3 2\n0 1\n1 2", expectedOutput: "0 1 2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 0", expectedOutput: "0", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "4 3\n0 1\n0 2\n0 3", expectedOutput: "0 1 2 3", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int V, E;
    cin >> V >> E;
    vector<vector<int>> adj(V);
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // BFS from vertex 0

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main(){int V,E;cin>>V>>E;vector<vector<int>>adj(V);for(int i=0;i<E;i++){int u,v;cin>>u>>v;adj[u].push_back(v);adj[v].push_back(u);}
vector<bool>vis(V,false);queue<int>q;q.push(0);vis[0]=true;bool first=true;
while(!q.empty()){int u=q.front();q.pop();if(!first)cout<<" ";first=false;cout<<u;sort(adj[u].begin(),adj[u].end());for(int v:adj[u])if(!vis[v]){vis[v]=true;q.push(v);}}}`,
    hints: ["Standard BFS with visited array and queue."],
  },
  {
    title: "DFS of Graph",
    description:
      "Given an undirected graph with V vertices (0-indexed) and E edges, print the DFS traversal starting from vertex 0.\n\n**Input:** First line: V E. Next E lines: two integers u v.\n**Output:** DFS order, space-separated.",
    difficulty: "medium",
    topic: "Graphs",
    tags: ["graph", "dfs"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5 4\n0 1\n0 2\n1 3\n2 4", expectedOutput: "0 1 3 2 4", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "3 2\n0 1\n1 2", expectedOutput: "0 1 2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 0", expectedOutput: "0", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "4 3\n0 1\n0 2\n0 3", expectedOutput: "0 1 2 3", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

void dfs(int u, vector<vector<int>>& adj, vector<bool>& visited, vector<int>& result) {
    // Implement DFS
}

int main() {
    int V, E;
    cin >> V >> E;
    vector<vector<int>> adj(V);
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    vector<bool> visited(V, false);
    vector<int> result;
    dfs(0, adj, visited, result);

    for (int i = 0; i < (int)result.size(); i++) {
        cout << result[i];
        if (i < (int)result.size() - 1) cout << " ";
    }
    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
void dfs(int u,vector<vector<int>>&adj,vector<bool>&vis,vector<int>&res){vis[u]=true;res.push_back(u);sort(adj[u].begin(),adj[u].end());for(int v:adj[u])if(!vis[v])dfs(v,adj,vis,res);}
int main(){int V,E;cin>>V>>E;vector<vector<int>>adj(V);for(int i=0;i<E;i++){int u,v;cin>>u>>v;adj[u].push_back(v);adj[v].push_back(u);}vector<bool>vis(V,false);vector<int>res;dfs(0,adj,vis,res);for(int i=0;i<(int)res.size();i++){cout<<res[i];if(i<(int)res.size()-1)cout<<" ";}}`,
    hints: ["Recursive DFS: mark visited, explore neighbors."],
  },
  {
    title: "Detect Cycle in Undirected Graph",
    description:
      "Given an undirected graph, determine if it contains a cycle.\n\n**Input:** First line: V E. Next E lines: u v.\n**Output:** `true` or `false`.",
    difficulty: "medium",
    topic: "Graphs",
    tags: ["graph", "cycle-detection", "dfs"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "4 4\n0 1\n1 2\n2 3\n3 0", expectedOutput: "true", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "3 2\n0 1\n1 2", expectedOutput: "false", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 0", expectedOutput: "false", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "4 5\n0 1\n1 2\n2 0\n2 3\n3 1", expectedOutput: "true", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int V, E;
    cin >> V >> E;
    vector<vector<int>> adj(V);
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // Detect cycle

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
bool dfs(int u,int par,vector<vector<int>>&adj,vector<bool>&vis){vis[u]=true;for(int v:adj[u]){if(!vis[v]){if(dfs(v,u,adj,vis))return true;}else if(v!=par)return true;}return false;}
int main(){int V,E;cin>>V>>E;vector<vector<int>>adj(V);for(int i=0;i<E;i++){int u,v;cin>>u>>v;adj[u].push_back(v);adj[v].push_back(u);}
vector<bool>vis(V,false);bool cycle=false;for(int i=0;i<V;i++)if(!vis[i]&&dfs(i,-1,adj,vis)){cycle=true;break;}cout<<(cycle?"true":"false");}`,
    hints: ["DFS with parent tracking: if you visit a node that's visited and not parent, cycle exists."],
  },
  {
    title: "Shortest Path in Unweighted Graph",
    description:
      "Given an unweighted, undirected graph and a source vertex, find shortest distances from source to all vertices.\n\n**Input:** First line: V E src. Next E lines: u v.\n**Output:** V space-separated distances (-1 if unreachable).",
    difficulty: "medium",
    topic: "Graphs",
    tags: ["graph", "bfs", "shortest-path"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "5 4 0\n0 1\n0 2\n1 3\n3 4", expectedOutput: "0 1 1 2 3", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "3 1 0\n0 1", expectedOutput: "0 1 -1", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1 0 0", expectedOutput: "0", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "4 4 2\n0 1\n1 2\n2 3\n0 3", expectedOutput: "2 1 0 1", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int V, E, src;
    cin >> V >> E >> src;
    vector<vector<int>> adj(V);
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // Find shortest distances from src

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main(){int V,E,src;cin>>V>>E>>src;vector<vector<int>>adj(V);for(int i=0;i<E;i++){int u,v;cin>>u>>v;adj[u].push_back(v);adj[v].push_back(u);}
vector<int>dist(V,-1);dist[src]=0;queue<int>q;q.push(src);while(!q.empty()){int u=q.front();q.pop();for(int v:adj[u])if(dist[v]==-1){dist[v]=dist[u]+1;q.push(v);}}
for(int i=0;i<V;i++){cout<<dist[i];if(i<V-1)cout<<" ";}}`,
    hints: ["BFS from source gives shortest distances in unweighted graphs."],
  },

  // ── Topic 8: Dynamic Programming (4 questions) ─────────────────────
  {
    title: "Fibonacci Number",
    description:
      "Given n, compute the n-th Fibonacci number (0-indexed: F(0)=0, F(1)=1).\n\n**Input:** A single integer n (0 ≤ n ≤ 45).\n**Output:** F(n).",
    difficulty: "easy",
    topic: "Dynamic Programming",
    tags: ["dp", "fibonacci"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "10", expectedOutput: "55", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "0", expectedOutput: "0", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "30", expectedOutput: "832040", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    // Compute Fibonacci(n)

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;if(n<=1){cout<<n;return 0;}int a=0,b=1;for(int i=2;i<=n;i++){int t=a+b;a=b;b=t;}cout<<b;}`,
    hints: ["Iterative with two variables, or DP array."],
  },
  {
    title: "Climbing Stairs",
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top?\n\n**Input:** A single integer n.\n**Output:** Number of distinct ways.",
    difficulty: "easy",
    topic: "Dynamic Programming",
    tags: ["dp", "fibonacci"],
    points: 10,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "2", expectedOutput: "2", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "3", expectedOutput: "3", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "1", expectedOutput: "1", isHidden: true, points: 3, timeLimit: 2000 },
      { input: "10", expectedOutput: "89", isHidden: true, points: 3, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    // Count ways to climb n stairs

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;if(n<=2){cout<<n;return 0;}int a=1,b=2;for(int i=3;i<=n;i++){int t=a+b;a=b;b=t;}cout<<b;}`,
    hints: ["dp[i] = dp[i-1] + dp[i-2], similar to Fibonacci."],
  },
  {
    title: "Longest Common Subsequence",
    description:
      "Given two strings, find the length of the longest common subsequence (LCS).\n\n**Input:** Two lines, each containing a string.\n**Output:** Length of LCS.",
    difficulty: "medium",
    topic: "Dynamic Programming",
    tags: ["dp", "lcs", "strings"],
    points: 15,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "abcde\nace", expectedOutput: "3", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "abc\nabc", expectedOutput: "3", isHidden: false, points: 2, timeLimit: 2000 },
      { input: "abc\ndef", expectedOutput: "0", isHidden: true, points: 5, timeLimit: 2000 },
      { input: "aggtab\ngxtxayb", expectedOutput: "4", isHidden: true, points: 5, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s1, s2;
    cin >> s1 >> s2;

    // Compute LCS length

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main(){string s1,s2;cin>>s1>>s2;int m=s1.size(),n=s2.size();vector<vector<int>>dp(m+1,vector<int>(n+1,0));
for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){if(s1[i-1]==s2[j-1])dp[i][j]=dp[i-1][j-1]+1;else dp[i][j]=max(dp[i-1][j],dp[i][j-1]);}cout<<dp[m][n];}`,
    hints: ["Classic 2D DP: if chars match, dp[i][j] = dp[i-1][j-1]+1."],
  },
  {
    title: "0/1 Knapsack Problem",
    description:
      "Given n items, each with a weight and value, and a knapsack capacity W, find the maximum value you can carry.\n\n**Input:** First line: n W. Next n lines: weight value.\n**Output:** Maximum value.",
    difficulty: "hard",
    topic: "Dynamic Programming",
    tags: ["dp", "knapsack"],
    points: 20,
    timeLimit: 30,
    memoryLimit: 256,
    testCases: [
      { input: "3 50\n10 60\n20 100\n30 120", expectedOutput: "220", isHidden: false, points: 4, timeLimit: 2000 },
      { input: "4 7\n1 1\n3 4\n4 5\n5 7", expectedOutput: "9", isHidden: false, points: 3, timeLimit: 2000 },
      { input: "1 10\n5 100", expectedOutput: "100", isHidden: true, points: 6, timeLimit: 2000 },
      { input: "3 6\n3 5\n4 8\n2 3", expectedOutput: "8", isHidden: true, points: 7, timeLimit: 2000 },
    ],
    boilerplateCode: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, W;
    cin >> n >> W;
    vector<int> wt(n), val(n);
    for (int i = 0; i < n; i++) cin >> wt[i] >> val[i];

    // Solve 0/1 Knapsack

    return 0;
}`,
    },
    solution: `#include <bits/stdc++.h>
using namespace std;
int main(){int n,W;cin>>n>>W;vector<int>wt(n),val(n);for(int i=0;i<n;i++)cin>>wt[i]>>val[i];
vector<int>dp(W+1,0);for(int i=0;i<n;i++)for(int w=W;w>=wt[i];w--)dp[w]=max(dp[w],dp[w-wt[i]]+val[i]);cout<<dp[W];}`,
    hints: ["1D DP: iterate items, then capacity in reverse."],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Assessments — 4 assessments grouping the 32 questions
// ═══════════════════════════════════════════════════════════════════════

interface AssessmentSeed {
  title: string;
  description: string;
  type: "assignment" | "practice" | "exam";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // minutes
  passingScore: number;
  totalPoints: number;
  courseCode: string;
  courseName: string;
  questionTopics: string[]; // topics to include
}

const assessments: AssessmentSeed[] = [
  {
    title: "DSA Fundamentals — Arrays, Strings & Linked Lists",
    description:
      "Practice assessment covering fundamental DSA topics: Arrays, Strings, and Linked Lists. Covers two sum, max subarray, palindromes, anagrams, list reversal, cycle detection, and more.",
    type: "assignment",
    difficulty: "beginner",
    duration: 90,
    passingScore: 60,
    totalPoints: 130,
    courseCode: "CS201",
    courseName: "Data Structures & Algorithms",
    questionTopics: ["Arrays", "Strings", "Linked Lists"],
  },
  {
    title: "DSA — Stacks, Queues & Sorting",
    description:
      "Assessment covering Stacks & Queues implementations and Sorting & Searching algorithms. Includes valid parentheses, next greater element, queue via stacks, binary search, merge sort, quick sort, and rotated array search.",
    type: "assignment",
    difficulty: "intermediate",
    duration: 90,
    passingScore: 60,
    totalPoints: 130,
    courseCode: "CS201",
    courseName: "Data Structures & Algorithms",
    questionTopics: ["Stacks & Queues", "Sorting & Searching"],
  },
  {
    title: "DSA — Trees & Graphs",
    description:
      "Assessment covering Tree and Graph algorithms. Topics include inorder traversal, tree depth, level-order traversal, BST validation, BFS, DFS, cycle detection in graphs, and shortest paths.",
    type: "assignment",
    difficulty: "intermediate",
    duration: 90,
    passingScore: 60,
    totalPoints: 120,
    courseCode: "CS201",
    courseName: "Data Structures & Algorithms",
    questionTopics: ["Trees", "Graphs"],
  },
  {
    title: "DSA — Dynamic Programming",
    description:
      "Assessment focused on Dynamic Programming. Covers Fibonacci, climbing stairs, longest common subsequence, and 0/1 knapsack problem.",
    type: "assignment",
    difficulty: "advanced",
    duration: 60,
    passingScore: 60,
    totalPoints: 55,
    courseCode: "CS201",
    courseName: "Data Structures & Algorithms",
    questionTopics: ["Dynamic Programming"],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Main seed function
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🌱 Seeding DSA questions and assessments...\n");

  const adminId = await getAdminUserId();
  console.log(`Using admin user: ${adminId}\n`);

  // 1. Insert all questions
  const questionIds: Map<string, string[]> = new Map(); // topic → [question_ids]

  for (const q of questions) {
    const { data, error } = await supabase
      .from("questions")
      .insert({
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        topic: q.topic,
        tags: q.tags,
        points: q.points,
        time_limit: q.timeLimit,
        memory_limit: q.memoryLimit,
        test_cases: q.testCases,
        boilerplate_code: q.boilerplateCode,
        solution: q.solution,
        hints: q.hints,
        is_visible: true,
        created_by: adminId,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ Failed to insert "${q.title}": ${error.message}`);
      continue;
    }

    console.log(`  ✓ ${q.topic} / ${q.title} (${q.difficulty}) → ${data.id}`);

    const topicIds = questionIds.get(q.topic) || [];
    topicIds.push(data.id);
    questionIds.set(q.topic, topicIds);
  }

  console.log(`\n✓ Inserted ${Array.from(questionIds.values()).flat().length} questions\n`);

  // 2. Insert assessments
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months

  for (const a of assessments) {
    // Collect question IDs for this assessment
    const qIds: string[] = [];
    for (const topic of a.questionTopics) {
      const ids = questionIds.get(topic) || [];
      qIds.push(...ids);
    }

    if (qIds.length === 0) {
      console.error(`  ✗ No questions for assessment "${a.title}"`);
      continue;
    }

    // Recalculate total points from actual questions
    const actualPoints = questions
      .filter(q => a.questionTopics.includes(q.topic))
      .reduce((sum, q) => sum + q.points, 0);

    const { data: assessment, error } = await supabase
      .from("assessments")
      .insert({
        title: a.title,
        description: a.description,
        type: a.type,
        difficulty: a.difficulty,
        duration: a.duration,
        passing_score: a.passingScore,
        total_points: actualPoints,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        settings: {
          randomizeQuestions: false,
          showCorrectAnswers: false,
          showScoreImmediately: true,
          allowRetakes: true,
          maxAttempts: 5,
          ipRestriction: false,
          allowedIPs: [],
          plagiarismSensitivity: "medium",
          proctoring: false,
        },
        status: "published",
        created_by: adminId,
        course_code: a.courseCode,
        course_name: a.courseName,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ Failed to create assessment "${a.title}": ${error.message}`);
      continue;
    }

    // Link questions
    const links = qIds.map((qId, idx) => ({
      assessment_id: assessment.id,
      question_id: qId,
      order: idx + 1,
      points: 0,
    }));

    const { error: linkErr } = await supabase
      .from("assessment_questions")
      .insert(links);

    if (linkErr) {
      console.error(`  ✗ Failed to link questions for "${a.title}": ${linkErr.message}`);
    } else {
      console.log(`  ✓ Assessment: "${a.title}" (${qIds.length} questions, ${actualPoints} pts) → ${assessment.id}`);
    }
  }

  console.log("\n🎉 Seeding complete!");
}

main().catch(console.error);
