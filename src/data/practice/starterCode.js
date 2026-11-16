/**
 * Generates starter code for every problem in Java, C++ and Python from the
 * problem's signature.
 *
 * Each starter is a complete program:
 *   1. a Solution class with an empty method for the learner to fill in, and
 *   2. input/output handling that reads the test case from stdin (format in
 *      io.js), calls the method, and prints the result.
 *
 * Generated code targets the language versions in Judge0 CE's default set
 * (Java 13, GCC 9 / C++17, Python 3.8), so it avoids newer syntax.
 */

/** "isValidBST" → "is_valid_bst", "numCourses" → "num_courses" */
export function toSnakeCase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

const indent = (lines, spaces) => lines.map((l) => (l ? ' '.repeat(spaces) + l : l));

/* ===================================================================== Java */

const JAVA = {
  param: { int: 'int', string: 'String', 'int[]': 'int[]', 'string[]': 'String[]', 'int[][]': 'int[][]', ListNode: 'ListNode', TreeNode: 'TreeNode' },
  returns: {
    int: 'int', bool: 'boolean', string: 'String', 'int[]': 'int[]', 'string[]': 'List<String>',
    'int[][]': 'List<List<Integer>>', 'string[][]': 'List<List<String>>', ListNode: 'ListNode',
  },
  defaults: {
    int: '0', bool: 'false', string: '""', 'int[]': 'new int[0]', 'string[]': 'new ArrayList<>()',
    'int[][]': 'new ArrayList<>()', 'string[][]': 'new ArrayList<>()', ListNode: 'null',
  },
  readers: {
    int: 'readInt(in)', string: 'readLine(in)', 'int[]': 'readIntArray(in)', 'string[]': 'readStringArray(in)',
    'int[][]': 'readIntMatrix(in)', ListNode: 'readList(in)', TreeNode: 'readTree(in)',
  },
  helpers: {
    readLine: `static String readLine(BufferedReader in) throws IOException {
    String line = in.readLine();
    return line == null ? "" : line;
}`,
    readInt: `static int readInt(BufferedReader in) throws IOException {
    return Integer.parseInt(readLine(in).trim());
}`,
    readIntArray: `static int[] readIntArray(BufferedReader in) throws IOException {
    int n = readInt(in);
    int[] values = new int[n];
    StringTokenizer tokens = new StringTokenizer(readLine(in));
    for (int i = 0; i < n; i++) values[i] = Integer.parseInt(tokens.nextToken());
    return values;
}`,
    readStringArray: `static String[] readStringArray(BufferedReader in) throws IOException {
    int n = readInt(in);
    String[] values = new String[n];
    for (int i = 0; i < n; i++) values[i] = readLine(in);
    return values;
}`,
    readIntMatrix: `static int[][] readIntMatrix(BufferedReader in) throws IOException {
    StringTokenizer size = new StringTokenizer(readLine(in));
    int rows = Integer.parseInt(size.nextToken()), cols = Integer.parseInt(size.nextToken());
    int[][] matrix = new int[rows][cols];
    for (int r = 0; r < rows; r++) {
        StringTokenizer tokens = new StringTokenizer(readLine(in));
        for (int c = 0; c < cols; c++) matrix[r][c] = Integer.parseInt(tokens.nextToken());
    }
    return matrix;
}`,
    readList: `static ListNode readList(BufferedReader in) throws IOException {
    ListNode dummy = new ListNode(0), tail = dummy;
    for (int value : readIntArray(in)) {
        tail.next = new ListNode(value);
        tail = tail.next;
    }
    return dummy.next;
}`,
    readTree: `static TreeNode readTree(BufferedReader in) throws IOException {
    int n = readInt(in);
    StringTokenizer tokens = new StringTokenizer(readLine(in));
    String[] values = new String[n];
    for (int i = 0; i < n; i++) values[i] = tokens.nextToken();
    if (n == 0 || values[0].equals("null")) return null;
    TreeNode root = new TreeNode(Integer.parseInt(values[0]));
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.add(root);
    int i = 1;
    while (!queue.isEmpty() && i < n) {
        TreeNode node = queue.poll();
        if (i < n && !values[i].equals("null")) {
            node.left = new TreeNode(Integer.parseInt(values[i]));
            queue.add(node.left);
        }
        i++;
        if (i < n && !values[i].equals("null")) {
            node.right = new TreeNode(Integer.parseInt(values[i]));
            queue.add(node.right);
        }
        i++;
    }
    return root;
}`,
    printIntArray: `static void printIntArray(int[] values) {
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < values.length; i++) {
        if (i > 0) out.append(' ');
        out.append(values[i]);
    }
    System.out.println(out);
}`,
    printLines: `static void printLines(List<String> lines) {
    StringBuilder out = new StringBuilder();
    for (String line : lines) out.append(line).append('\\n');
    System.out.print(out);
}`,
    printRows: `static void printRows(List<? extends List<?>> rows) {
    StringBuilder out = new StringBuilder();
    for (List<?> row : rows) {
        for (int i = 0; i < row.size(); i++) {
            if (i > 0) out.append(' ');
            out.append(row.get(i));
        }
        out.append('\\n');
    }
    System.out.print(out);
}`,
    printList: `static void printList(ListNode head) {
    StringBuilder out = new StringBuilder();
    for (ListNode node = head; node != null; node = node.next) {
        if (out.length() > 0) out.append(' ');
        out.append(node.val);
    }
    System.out.println(out);
}`,
    sortRows: `static <T extends Comparable<T>> List<List<T>> sortRows(List<List<T>> rows, boolean sortEachRow) {
    List<List<T>> copy = new ArrayList<>();
    for (List<T> row : rows) {
        List<T> sortedRow = new ArrayList<>(row);
        if (sortEachRow) Collections.sort(sortedRow);
        copy.add(sortedRow);
    }
    copy.sort((a, b) -> {
        for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
            int c = a.get(i).compareTo(b.get(i));
            if (c != 0) return c;
        }
        return Integer.compare(a.size(), b.size());
    });
    return copy;
}`,
  },
  deps: {
    readInt: ['readLine'], readIntArray: ['readInt', 'readLine'], readStringArray: ['readInt', 'readLine'],
    readIntMatrix: ['readLine'], readList: ['readIntArray', 'readInt', 'readLine'], readTree: ['readInt', 'readLine'],
  },
  printers: {
    int: ['System.out.println(result);', []],
    bool: ['System.out.println(result ? "true" : "false");', []],
    string: ['System.out.println(result);', []],
    'int[]': ['printIntArray(result);', ['printIntArray']],
    'string[]': ['printLines(result);', ['printLines']],
    'int[][]': ['printRows(result);', ['printRows']],
    'string[][]': ['printRows(result);', ['printRows']],
    ListNode: ['printList(result);', ['printList']],
  },
  sorters: {
    'int[]': ['Arrays.sort(result);', []],
    'string[]': ['result = new ArrayList<>(result);', 'Collections.sort(result);', []],
    'int[][]': ['result = sortRows(result, false);', ['sortRows']],
    'string[][]': ['result = sortRows(result, true);', ['sortRows']],
  },
};

const JAVA_NODES = {
  ListNode: `// Definition for a singly linked list node.
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}`,
  TreeNode: `// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}`,
};

function javaStarter({ fn, params, returns, sortOutput }) {
  const types = new Set([...params.map((p) => p.type), returns]);
  const needed = new Set(['readLine']);
  const addHelper = (name) => {
    needed.add(name);
    (JAVA.deps[name] ?? []).forEach((d) => needed.add(d));
  };

  const readLines = params.map((p) => {
    const reader = JAVA.readers[p.type];
    addHelper(reader.split('(')[0]);
    return `${JAVA.param[p.type]} ${p.name} = ${reader};`;
  });

  const sorter = sortOutput ? JAVA.sorters[returns] : null;
  const sortLines = sorter ? sorter.filter((x) => typeof x === 'string') : [];
  if (sorter) sorter[sorter.length - 1].forEach(addHelper);
  const [printLine, printHelpers] = JAVA.printers[returns];
  printHelpers.forEach(addHelper);

  const nodes = ['ListNode', 'TreeNode'].filter((t) => types.has(t)).map((t) => JAVA_NODES[t]);
  const order = Object.keys(JAVA.helpers).filter((h) => needed.has(h));

  return [
    'import java.io.*;',
    'import java.util.*;',
    '',
    ...nodes.flatMap((n) => [n, '']),
    'class Solution {',
    `    public ${JAVA.returns[returns]} ${fn}(${params.map((p) => `${JAVA.param[p.type]} ${p.name}`).join(', ')}) {`,
    '        // Write your solution here',
    `        return ${JAVA.defaults[returns]};`,
    '    }',
    '}',
    '',
    '// ---------------------------------------------------------------------------',
    '// Input and output handling: reads the test case from standard input, calls',
    "// your solution and prints the result. You don't need to change anything below.",
    '// ---------------------------------------------------------------------------',
    'public class Main {',
    '    public static void main(String[] args) throws IOException {',
    '        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));',
    ...indent(readLines, 8),
    `        ${JAVA.returns[returns]} result = new Solution().${fn}(${params.map((p) => p.name).join(', ')});`,
    ...(sortLines.length ? ['        // Any order is accepted, so sort the answer before printing it', ...indent(sortLines, 8)] : []),
    `        ${printLine}`,
    '    }',
    ...order.flatMap((h) => ['', ...indent(JAVA.helpers[h].split('\n'), 4)]),
    '}',
    '',
  ].join('\n');
}

/* ====================================================================== C++ */

const CPP = {
  param: { int: 'int', string: 'string', 'int[]': 'vector<int>&', 'string[]': 'vector<string>&', 'int[][]': 'vector<vector<int>>&', ListNode: 'ListNode*', TreeNode: 'TreeNode*' },
  local: { int: 'int', string: 'string', 'int[]': 'vector<int>', 'string[]': 'vector<string>', 'int[][]': 'vector<vector<int>>', ListNode: 'ListNode*', TreeNode: 'TreeNode*' },
  returns: {
    int: 'int', bool: 'bool', string: 'string', 'int[]': 'vector<int>', 'string[]': 'vector<string>',
    'int[][]': 'vector<vector<int>>', 'string[][]': 'vector<vector<string>>', ListNode: 'ListNode*',
  },
  defaults: { int: '0', bool: 'false', string: '""', 'int[]': '{}', 'string[]': '{}', 'int[][]': '{}', 'string[][]': '{}', ListNode: 'nullptr' },
  readers: {
    int: 'readInt()', string: 'readLine()', 'int[]': 'readIntArray()', 'string[]': 'readStringArray()',
    'int[][]': 'readIntMatrix()', ListNode: 'readList()', TreeNode: 'readTree()',
  },
  helpers: {
    readLine: `string readLine() {
    string line;
    if (!getline(cin, line)) return "";
    if (!line.empty() && line.back() == '\\r') line.pop_back();
    return line;
}`,
    readInt: `int readInt() {
    return stoi(readLine());
}`,
    readIntArray: `vector<int> readIntArray() {
    int n = readInt();
    vector<int> values(n);
    istringstream tokens(readLine());
    for (int i = 0; i < n; i++) tokens >> values[i];
    return values;
}`,
    readStringArray: `vector<string> readStringArray() {
    int n = readInt();
    vector<string> values(n);
    for (int i = 0; i < n; i++) values[i] = readLine();
    return values;
}`,
    readIntMatrix: `vector<vector<int>> readIntMatrix() {
    int rows = 0, cols = 0;
    istringstream size(readLine());
    size >> rows >> cols;
    vector<vector<int>> matrix(rows, vector<int>(cols));
    for (int r = 0; r < rows; r++) {
        istringstream tokens(readLine());
        for (int c = 0; c < cols; c++) tokens >> matrix[r][c];
    }
    return matrix;
}`,
    readList: `ListNode* readList() {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    for (int value : readIntArray()) {
        tail->next = new ListNode(value);
        tail = tail->next;
    }
    return dummy.next;
}`,
    readTree: `TreeNode* readTree() {
    int n = readInt();
    istringstream tokens(readLine());
    vector<string> values(n);
    for (int i = 0; i < n; i++) tokens >> values[i];
    if (n == 0 || values[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(stoi(values[0]));
    queue<TreeNode*> pending;
    pending.push(root);
    int i = 1;
    while (!pending.empty() && i < n) {
        TreeNode* node = pending.front();
        pending.pop();
        if (i < n && values[i] != "null") {
            node->left = new TreeNode(stoi(values[i]));
            pending.push(node->left);
        }
        i++;
        if (i < n && values[i] != "null") {
            node->right = new TreeNode(stoi(values[i]));
            pending.push(node->right);
        }
        i++;
    }
    return root;
}`,
    printRow: `template <typename T>
void printRow(const vector<T>& values) {
    for (size_t i = 0; i < values.size(); i++) {
        if (i > 0) cout << ' ';
        cout << values[i];
    }
    cout << '\\n';
}`,
  },
  deps: {
    readInt: ['readLine'], readIntArray: ['readInt', 'readLine'], readStringArray: ['readInt', 'readLine'],
    readIntMatrix: ['readLine'], readList: ['readIntArray', 'readInt', 'readLine'], readTree: ['readInt', 'readLine'],
  },
  printers: {
    int: [['cout << result << \'\\n\';'], []],
    bool: [['cout << (result ? "true" : "false") << \'\\n\';'], []],
    string: [['cout << result << \'\\n\';'], []],
    'int[]': [['printRow(result);'], ['printRow']],
    'string[]': [['for (const string& line : result) cout << line << \'\\n\';'], []],
    'int[][]': [['for (const auto& row : result) printRow(row);'], ['printRow']],
    'string[][]': [['for (const auto& row : result) printRow(row);'], ['printRow']],
    ListNode: [['vector<int> values;', 'for (ListNode* node = result; node != nullptr; node = node->next) values.push_back(node->val);', 'printRow(values);'], ['printRow']],
  },
  sorters: {
    'int[]': ['sort(result.begin(), result.end());'],
    'string[]': ['sort(result.begin(), result.end());'],
    'int[][]': ['sort(result.begin(), result.end());'],
    'string[][]': ['for (auto& row : result) sort(row.begin(), row.end());', 'sort(result.begin(), result.end());'],
  },
};

const CPP_NODES = {
  ListNode: `// Definition for a singly linked list node.
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int val) : val(val), next(nullptr) {}
};`,
  TreeNode: `// Definition for a binary tree node.
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int val) : val(val), left(nullptr), right(nullptr) {}
};`,
};

function cppStarter({ fn, params, returns, sortOutput }) {
  const types = new Set([...params.map((p) => p.type), returns]);
  const needed = new Set(['readLine']);
  const addHelper = (name) => {
    needed.add(name);
    (CPP.deps[name] ?? []).forEach((d) => needed.add(d));
  };

  const readLines = params.map((p) => {
    const reader = CPP.readers[p.type];
    addHelper(reader.split('(')[0]);
    return `${CPP.local[p.type]} ${p.name} = ${reader};`;
  });
  const [printLines, printHelpers] = CPP.printers[returns];
  printHelpers.forEach(addHelper);
  const sortLines = sortOutput ? CPP.sorters[returns] ?? [] : [];

  const nodes = ['ListNode', 'TreeNode'].filter((t) => types.has(t)).map((t) => CPP_NODES[t]);
  const order = Object.keys(CPP.helpers).filter((h) => needed.has(h));

  return [
    '#include <bits/stdc++.h>',
    'using namespace std;',
    '',
    ...nodes.flatMap((n) => [n, '']),
    'class Solution {',
    'public:',
    `    ${CPP.returns[returns]} ${fn}(${params.map((p) => `${CPP.param[p.type]} ${p.name}`).join(', ')}) {`,
    '        // Write your solution here',
    `        return ${CPP.defaults[returns]};`,
    '    }',
    '};',
    '',
    '// ---------------------------------------------------------------------------',
    '// Input and output handling: reads the test case from standard input, calls',
    "// your solution and prints the result. You don't need to change anything below.",
    '// ---------------------------------------------------------------------------',
    ...order.flatMap((h) => [CPP.helpers[h], '']),
    'int main() {',
    '    ios::sync_with_stdio(false);',
    '    cin.tie(nullptr);',
    ...indent(readLines, 4),
    '    Solution solution;',
    `    ${CPP.returns[returns]} result = solution.${fn}(${params.map((p) => p.name).join(', ')});`,
    ...(sortLines.length ? ['    // Any order is accepted, so sort the answer before printing it', ...indent(sortLines, 4)] : []),
    ...indent(printLines, 4),
    '    return 0;',
    '}',
    '',
  ].join('\n');
}

/* =================================================================== Python */

const PY = {
  hint: {
    int: 'int', string: 'str', bool: 'bool', 'int[]': 'List[int]', 'string[]': 'List[str]', 'int[][]': 'List[List[int]]',
    'string[][]': 'List[List[str]]', ListNode: 'Optional[ListNode]', TreeNode: 'Optional[TreeNode]',
  },
  defaults: { int: '0', bool: 'False', string: '""', 'int[]': '[]', 'string[]': '[]', 'int[][]': '[]', 'string[][]': '[]', ListNode: 'None' },
  readers: {
    int: 'read_int', string: 'read_line', 'int[]': 'read_int_array', 'string[]': 'read_string_array',
    'int[][]': 'read_int_matrix', ListNode: 'read_list', TreeNode: 'read_tree',
  },
  methods: {
    read_line: `def read_line(self) -> str:
    value = self.lines[self.pos] if self.pos < len(self.lines) else ""
    self.pos += 1
    return value.rstrip("\\r")`,
    read_int: `def read_int(self) -> int:
    return int(self.read_line())`,
    read_int_array: `def read_int_array(self) -> List[int]:
    n = self.read_int()
    return [int(x) for x in self.read_line().split()][:n]`,
    read_string_array: `def read_string_array(self) -> List[str]:
    n = self.read_int()
    return [self.read_line() for _ in range(n)]`,
    read_int_matrix: `def read_int_matrix(self) -> List[List[int]]:
    rows, _cols = map(int, self.read_line().split())
    return [[int(x) for x in self.read_line().split()] for _ in range(rows)]`,
    read_list: `def read_list(self) -> Optional[ListNode]:
    dummy = tail = ListNode(0)
    for value in self.read_int_array():
        tail.next = ListNode(value)
        tail = tail.next
    return dummy.next`,
    read_tree: `def read_tree(self) -> Optional[TreeNode]:
    n = self.read_int()
    values = self.read_line().split()[:n]
    if not values or values[0] == "null":
        return None
    root = TreeNode(int(values[0]))
    queue, i = deque([root]), 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] != "null":
            node.left = TreeNode(int(values[i]))
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] != "null":
            node.right = TreeNode(int(values[i]))
            queue.append(node.right)
        i += 1
    return root`,
  },
  deps: {
    read_int: ['read_line'], read_int_array: ['read_int', 'read_line'], read_string_array: ['read_int', 'read_line'],
    read_int_matrix: ['read_line'], read_list: ['read_int_array', 'read_int', 'read_line'], read_tree: ['read_int', 'read_line'],
  },
  printers: {
    int: ['print(result)'],
    bool: ['print("true" if result else "false")'],
    string: ['print(result)'],
    'int[]': ['print(" ".join(map(str, result)))'],
    'string[]': ['print("\\n".join(result))'],
    'int[][]': ['for row in result:', '    print(" ".join(map(str, row)))'],
    'string[][]': ['for row in result:', '    print(" ".join(row))'],
    ListNode: ['values = []', 'while result is not None:', '    values.append(str(result.val))', '    result = result.next', 'print(" ".join(values))'],
  },
  sorters: {
    'int[]': ['result = sorted(result)'],
    'string[]': ['result = sorted(result)'],
    'int[][]': ['result = sorted(list(row) for row in result)'],
    'string[][]': ['result = sorted(sorted(row) for row in result)'],
  },
};

const PY_NODES = {
  ListNode: `class ListNode:
    """Definition for a singly linked list node."""

    def __init__(self, val: int = 0, next: "Optional[ListNode]" = None):
        self.val = val
        self.next = next`,
  TreeNode: `class TreeNode:
    """Definition for a binary tree node."""

    def __init__(self, val: int = 0, left: "Optional[TreeNode]" = None, right: "Optional[TreeNode]" = None):
        self.val = val
        self.left = left
        self.right = right`,
};

function pythonStarter({ fn, params, returns, sortOutput }) {
  const types = new Set([...params.map((p) => p.type), returns]);
  const needed = new Set(['read_line']);
  const addHelper = (name) => {
    needed.add(name);
    (PY.deps[name] ?? []).forEach((d) => needed.add(d));
  };
  const names = params.map((p) => toSnakeCase(p.name));
  const readLines = params.map((p, i) => {
    addHelper(PY.readers[p.type]);
    return `${names[i]} = reader.${PY.readers[p.type]}()`;
  });
  const sortLines = sortOutput ? PY.sorters[returns] ?? [] : [];
  const nodes = ['ListNode', 'TreeNode'].filter((t) => types.has(t)).map((t) => PY_NODES[t]);
  const order = Object.keys(PY.methods).filter((m) => needed.has(m));
  const imports = ['import sys', ...(types.has('TreeNode') ? ['from collections import deque'] : []), 'from typing import List, Optional'];

  return [
    ...imports,
    '',
    '',
    ...nodes.flatMap((n) => [n, '', '']),
    'class Solution:',
    `    def ${toSnakeCase(fn)}(self, ${params.map((p, i) => `${names[i]}: ${PY.hint[p.type]}`).join(', ')}) -> ${PY.hint[returns]}:`,
    '        # Write your solution here',
    `        return ${PY.defaults[returns]}`,
    '',
    '',
    '# ---------------------------------------------------------------------------',
    '# Input and output handling: reads the test case from standard input, calls',
    "# your solution and prints the result. You don't need to change anything below.",
    '# ---------------------------------------------------------------------------',
    'class Reader:',
    '    def __init__(self, text: str):',
    '        self.lines = text.split("\\n")',
    '        self.pos = 0',
    ...order.flatMap((m) => ['', ...indent(PY.methods[m].split('\n'), 4)]),
    '',
    '',
    'def main() -> None:',
    '    sys.setrecursionlimit(20000)  # allow deeper recursion than the default 1000',
    '    reader = Reader(sys.stdin.read())',
    ...indent(readLines, 4),
    `    result = Solution().${toSnakeCase(fn)}(${names.join(', ')})`,
    ...(sortLines.length ? ['    # Any order is accepted, so sort the answer before printing it', ...indent(sortLines, 4)] : []),
    ...indent(PY.printers[returns], 4),
    '',
    '',
    'if __name__ == "__main__":',
    '    main()',
    '',
  ].join('\n');
}

/* ====================================================================== API */

const GENERATORS = { java: javaStarter, cpp: cppStarter, python: pythonStarter };

/** Starter code for a problem in 'java' | 'cpp' | 'python'. */
export function getStarterCode(problem, language) {
  return (GENERATORS[language] ?? javaStarter)(problem.signature);
}

/** The method name the learner implements, in the conventions of each language. */
export function functionName(problem, language) {
  return language === 'python' ? toSnakeCase(problem.signature.fn) : problem.signature.fn;
}
