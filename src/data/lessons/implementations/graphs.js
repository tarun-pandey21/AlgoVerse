import { cpp, python } from '../helpers.js';

export default {
  cpp: [
    {
      code: cpp`
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

vector<int> bfs(const vector<vector<int>>& adj, int start) {
    vector<int> order;
    vector<bool> visited(adj.size(), false);
    queue<int> q;
    visited[start] = true;               // mark when enqueued, not when dequeued
    q.push(start);
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        order.push_back(node);
        for (int next : adj[node]) {
            if (!visited[next]) {
                visited[next] = true;
                q.push(next);
            }
        }
    }
    return order;
}

void dfs(const vector<vector<int>>& adj, int node, vector<bool>& visited, vector<int>& order) {
    visited[node] = true;
    order.push_back(node);
    for (int next : adj[node]) {
        if (!visited[next]) dfs(adj, next, visited, order);
    }
}

void print(const string& label, const vector<int>& v) {
    cout << label << "[";
    for (size_t i = 0; i < v.size(); i++) cout << v[i] << (i + 1 < v.size() ? ", " : "");
    cout << "]\n";
}

int main() {
    int n = 6;
    vector<vector<int>> adj(n);
    vector<pair<int, int>> edges = {{0, 1}, {0, 2}, {1, 3}, {2, 4}, {3, 5}, {4, 5}};
    for (auto [u, v] : edges) {          // undirected: add both directions
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    print("BFS from 0: ", bfs(adj, 0));
    vector<bool> visited(n, false);
    vector<int> dfsOrder;
    dfs(adj, 0, visited, dfsOrder);
    print("DFS from 0: ", dfsOrder);
}`,
      notes: [
        { match: 'adj[v].push_back(u);', text: 'For an undirected graph, store each edge in both directions.' },
        { match: 'visited[start] = true;               // mark when enqueued', text: 'Marking on enqueue prevents the same vertex being added to the queue twice.' },
        { match: 'if (!visited[next]) dfs(adj, next, visited, order);', text: 'DFS dives into the first unvisited neighbour before trying the others.' },
      ],
    },
    {
      code: cpp`
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n = 5;
    vector<vector<pair<int, int>>> adj(n);          // {neighbor, weight}
    int edges[][3] = {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}, {2, 3, 5}, {3, 4, 3}};
    for (auto& e : edges) {                          // directed edges
        adj[e[0]].push_back({e[1], e[2]});
    }

    vector<int> dist(n, INT_MAX);
    dist[0] = 0;
    // Min-heap of {distance, node}: pairs compare by their first element
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    pq.push({0, 0});

    while (!pq.empty()) {
        auto [d, node] = pq.top();
        pq.pop();
        if (d > dist[node]) continue;               // stale entry: skip it
        for (auto [next, weight] : adj[node]) {
            int newDist = d + weight;
            if (newDist < dist[next]) {              // found a shorter path
                dist[next] = newDist;
                pq.push({newDist, next});
            }
        }
    }
    cout << "Shortest distances from 0: [";
    for (int i = 0; i < n; i++) cout << dist[i] << (i + 1 < n ? ", " : "");
    cout << "]\n";
}`,
      notes: [
        { match: 'vector<int> dist(n, INT_MAX);', text: 'Every vertex starts “infinitely” far away, except the source.' },
        { match: 'greater<pair<int, int>>> pq;', text: 'Putting the distance first in each pair makes the min-heap order by distance.' },
        { match: 'if (d > dist[node]) continue;', text: 'A vertex can be in the heap several times; skip entries that are out of date.' },
        { match: 'if (newDist < dist[next])', text: 'Relaxation: keep the shorter of the known path and the path through `node`.' },
      ],
    },
  ],

  python: [
    {
      code: python`
from collections import deque


def bfs(adj, start):
    order = []
    visited = {start}                    # mark when enqueued, not when dequeued
    queue = deque([start])
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in adj[node]:
            if nxt not in visited:
                visited.add(nxt)
                queue.append(nxt)
    return order


def dfs(adj, node, visited, order):
    visited.add(node)
    order.append(node)
    for nxt in adj[node]:
        if nxt not in visited:
            dfs(adj, nxt, visited, order)
    return order


n = 6
adj = [[] for _ in range(n)]
edges = [(0, 1), (0, 2), (1, 3), (2, 4), (3, 5), (4, 5)]
for u, v in edges:                       # undirected: add both directions
    adj[u].append(v)
    adj[v].append(u)

print("BFS from 0:", bfs(adj, 0))
print("DFS from 0:", dfs(adj, 0, set(), []))`,
      notes: [
        { match: 'adj[v].append(u)', text: 'For an undirected graph, store each edge in both directions.' },
        { match: 'visited = {start}', text: 'A set gives O(1) membership checks. Marking on enqueue prevents duplicate queue entries.' },
        { match: 'dfs(adj, nxt, visited, order)', text: 'DFS dives into the first unvisited neighbour before trying the others.' },
      ],
    },
    {
      code: python`
import heapq

n = 5
adj = [[] for _ in range(n)]                     # (neighbor, weight)
edges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1), (2, 3, 5), (3, 4, 3)]
for u, v, w in edges:                            # directed edges
    adj[u].append((v, w))

dist = [float("inf")] * n
dist[0] = 0
pq = [(0, 0)]                                    # min-heap of (distance, node)

while pq:
    d, node = heapq.heappop(pq)
    if d > dist[node]:                           # stale entry: skip it
        continue
    for nxt, weight in adj[node]:
        new_dist = d + weight
        if new_dist < dist[nxt]:                 # found a shorter path
            dist[nxt] = new_dist
            heapq.heappush(pq, (new_dist, nxt))

print("Shortest distances from 0:", dist)`,
      notes: [
        { match: 'dist = [float("inf")] * n', text: 'Every vertex starts infinitely far away, except the source.' },
        { match: 'pq = [(0, 0)]', text: 'Tuples compare element by element, so putting the distance first orders the heap by distance.' },
        { match: 'if d > dist[node]:', text: 'A vertex can be in the heap several times; skip entries that are out of date.' },
        { match: 'if new_dist < dist[nxt]:', text: 'Relaxation: keep the shorter of the known path and the path through `node`.' },
      ],
    },
  ],
};
