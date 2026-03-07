-- ═══════════════════════════════════════════════════════════════════════
-- CodeQuest Demo Seed — 4 questions + 1 practice assessment
-- All UUIDs are deterministic so this is idempotent (ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════════════════

-- ── Demo Questions ────────────────────────────────────────────────────

INSERT INTO questions (id, title, description, difficulty, topic, tags, points, time_limit, test_cases, boilerplate_code, created_by)
VALUES

-- Q1: Two Sum
('d0000000-0001-4000-a000-000000000001',
 'Two Sum',
 'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the answer as two space-separated integers.',
 'easy', 'Arrays', ARRAY['arrays','hash-map','easy'],
 25, 30,
 '[
   {"input":"2 7 11 15\n9","expectedOutput":"0 1","isHidden":false},
   {"input":"3 2 4\n6","expectedOutput":"1 2","isHidden":false},
   {"input":"3 3\n6","expectedOutput":"0 1","isHidden":true},
   {"input":"1 5 3 7 2 8\n9","expectedOutput":"1 4","isHidden":true}
 ]'::jsonb,
 '{
   "python":"import sys\n\ndef two_sum(nums, target):\n    # Write your solution here\n    pass\n\ndata = sys.stdin.read().split(''\\n'')\nnums = list(map(int, data[0].split()))\ntarget = int(data[1])\nresult = two_sum(nums, target)\nprint(result[0], result[1])",
   "javascript":"const readline = require(''readline'');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on(''line'', l => lines.push(l));\nrl.on(''close'', () => {\n  const nums = lines[0].split('' '').map(Number);\n  const target = Number(lines[1]);\n  // Write your solution here\n});",
   "java":"import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String[] parts = sc.nextLine().split(\" \");\n    int target = sc.nextInt();\n    int[] nums = new int[parts.length];\n    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n    // Write your solution here\n  }\n}",
   "cpp":"#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n  string line; getline(cin, line);\n  istringstream iss(line);\n  vector<int> nums; int x;\n  while (iss >> x) nums.push_back(x);\n  int target; cin >> target;\n  // Write your solution here\n  return 0;\n}"
 }'::jsonb,
 NULL),

-- Q2: Valid Parentheses
('d0000000-0002-4000-a000-000000000002',
 'Valid Parentheses',
 'Given a string s containing characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets are closed by the same type, and open brackets are closed in the correct order. Print "true" or "false".',
 'easy', 'Stacks', ARRAY['stack','string','easy'],
 25, 30,
 '[
   {"input":"()","expectedOutput":"true","isHidden":false},
   {"input":"()[]{}","expectedOutput":"true","isHidden":false},
   {"input":"(]","expectedOutput":"false","isHidden":true},
   {"input":"([{}])","expectedOutput":"true","isHidden":true}
 ]'::jsonb,
 '{
   "python":"import sys\n\ndef is_valid(s):\n    # Write your solution here\n    pass\n\ns = sys.stdin.read().strip()\nprint(str(is_valid(s)).lower())",
   "javascript":"const readline = require(''readline'');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on(''line'', (s) => {\n  // Write your solution here\n  rl.close();\n});",
   "java":"import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String s = sc.nextLine().trim();\n    // Write your solution here\n  }\n}",
   "cpp":"#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\nint main() {\n  string s; getline(cin, s);\n  // Write your solution here\n  return 0;\n}"
 }'::jsonb,
 NULL),

-- Q3: Binary Search
('d0000000-0003-4000-a000-000000000003',
 'Binary Search',
 'Given a sorted array of integers and a target value, return the index of the target if it is found. If not, return -1. You must write an algorithm with O(log n) runtime complexity.',
 'medium', 'Searching', ARRAY['binary-search','arrays','medium'],
 50, 45,
 '[
   {"input":"-1 0 3 5 9 12\n9","expectedOutput":"4","isHidden":false},
   {"input":"-1 0 3 5 9 12\n2","expectedOutput":"-1","isHidden":false},
   {"input":"1\n1","expectedOutput":"0","isHidden":true},
   {"input":"1 2 3 4 5 6 7 8 9 10\n7","expectedOutput":"6","isHidden":true}
 ]'::jsonb,
 '{
   "python":"import sys\n\ndef binary_search(nums, target):\n    # Write your solution here\n    pass\n\ndata = sys.stdin.read().split(''\\n'')\nnums = list(map(int, data[0].split()))\ntarget = int(data[1])\nprint(binary_search(nums, target))",
   "javascript":"const readline = require(''readline'');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on(''line'', l => lines.push(l));\nrl.on(''close'', () => {\n  const nums = lines[0].split('' '').map(Number);\n  const target = Number(lines[1]);\n  // Write your solution here\n});",
   "java":"import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String[] parts = sc.nextLine().split(\" \");\n    int target = sc.nextInt();\n    int[] nums = new int[parts.length];\n    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n    // Write your solution here\n  }\n}",
   "cpp":"#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n  string line; getline(cin, line);\n  istringstream iss(line);\n  vector<int> nums; int x;\n  while (iss >> x) nums.push_back(x);\n  int target; cin >> target;\n  // Write your solution here\n  return 0;\n}"
 }'::jsonb,
 NULL),

-- Q4: Maximum Subarray
('d0000000-0004-4000-a000-000000000004',
 'Maximum Subarray',
 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
 'medium', 'Dynamic Programming', ARRAY['dp','arrays','kadane','medium'],
 50, 45,
 '[
   {"input":"-2 1 -3 4 -1 2 1 -5 4","expectedOutput":"6","isHidden":false},
   {"input":"1","expectedOutput":"1","isHidden":false},
   {"input":"5 4 -1 7 8","expectedOutput":"23","isHidden":true},
   {"input":"-1 -2 -3 -4","expectedOutput":"-1","isHidden":true}
 ]'::jsonb,
 '{
   "python":"import sys\n\ndef max_subarray(nums):\n    # Write your solution here\n    pass\n\nnums = list(map(int, sys.stdin.read().split()))\nprint(max_subarray(nums))",
   "javascript":"const readline = require(''readline'');\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on(''line'', (line) => {\n  const nums = line.split('' '').map(Number);\n  // Write your solution here\n  rl.close();\n});",
   "java":"import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String[] parts = sc.nextLine().split(\" \");\n    int[] nums = new int[parts.length];\n    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n    // Write your solution here\n  }\n}",
   "cpp":"#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n  string line; getline(cin, line);\n  istringstream iss(line);\n  vector<int> nums; int x;\n  while (iss >> x) nums.push_back(x);\n  // Write your solution here\n  return 0;\n}"
 }'::jsonb,
 NULL)

ON CONFLICT (id) DO NOTHING;


-- ── Demo Assessment ───────────────────────────────────────────────────

INSERT INTO assessments (id, title, description, type, difficulty, duration, passing_score, total_points, start_date, end_date, settings, status, created_by, course_code, course_name)
VALUES (
  'd0000000-a000-4000-a000-000000000001',
  'CodeQuest Demo Practice',
  'A practice assessment with sample coding problems. Available to all students for practice — no grade impact.',
  'practice',
  'beginner',
  120,
  0,
  150,
  '2024-01-01T00:00:00Z',
  '2099-12-31T23:59:59Z',
  '{"randomizeQuestions":false,"showCorrectAnswers":true,"showScoreImmediately":true,"allowRetakes":true,"maxAttempts":50,"ipRestriction":false,"allowedIPs":[],"plagiarismSensitivity":"low","proctoring":false}'::jsonb,
  'published',
  NULL,
  'DEMO-101',
  'Demo Practice Course'
)
ON CONFLICT (id) DO NOTHING;


-- ── Link questions to demo assessment ─────────────────────────────────

INSERT INTO assessment_questions (assessment_id, question_id, "order", points)
VALUES
  ('d0000000-a000-4000-a000-000000000001', 'd0000000-0001-4000-a000-000000000001', 1, 25),
  ('d0000000-a000-4000-a000-000000000001', 'd0000000-0002-4000-a000-000000000002', 2, 25),
  ('d0000000-a000-4000-a000-000000000001', 'd0000000-0003-4000-a000-000000000003', 3, 50),
  ('d0000000-a000-4000-a000-000000000001', 'd0000000-0004-4000-a000-000000000004', 4, 50)
ON CONFLICT DO NOTHING;
