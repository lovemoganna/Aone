import type { SnippetTemplate } from './types';

export const interpreterTemplates: SnippetTemplate[] = [
    // DuckDB SQL Templates
    {
        id: 'sql-orders-analytics',
        title: '电商订单多维聚合与窗口排名 (DuckDB)',
        language: 'sql',
        category: '数据分析',
        description: '生成内存模拟数据并执行窗口函数、分组聚合与排名分析。',
        tags: ['DuckDB', 'Window', 'Aggregation'],
        code: `-- 1. 内存生成模拟订单数据
WITH sample_orders AS (
    SELECT 
        unnest(range(1, 21)) AS order_id,
        unnest(['Electronics', 'Clothing', 'Home', 'Books', 'Toys', 'Electronics', 'Home', 'Books', 'Clothing', 'Electronics', 'Home', 'Toys', 'Clothing', 'Books', 'Electronics', 'Toys', 'Home', 'Books', 'Clothing', 'Electronics']) AS category,
        unnest(['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']) AS customer,
        round(random() * 400 + 50, 2) AS amount,
        DATE '2025-01-01' + CAST(unnest(range(1, 21)) * 3 AS INTEGER) AS order_date
)
-- 2. 统计每个类别的订单总额、平均客单价以及在所属类别的消费排名
SELECT 
    category,
    customer,
    amount,
    order_date,
    count(*) OVER (PARTITION BY category) AS category_order_count,
    round(avg(amount) OVER (PARTITION BY category), 2) AS category_avg_amount,
    dense_rank() OVER (PARTITION BY category ORDER BY amount DESC) AS category_spending_rank
FROM sample_orders
ORDER BY category ASC, category_spending_rank ASC;`
    },
    {
        id: 'sql-json-unnest',
        title: 'JSON 结构化解析与数组展开 (DuckDB)',
        language: 'sql',
        category: '数据清洗',
        description: '演示 DuckDB 原生强大的 JSON 查询、提取与展开能力。',
        tags: ['DuckDB', 'JSON', 'Unnest'],
        code: `-- 模拟日志或 API 产生的嵌套 JSON 数据
WITH raw_logs AS (
    SELECT 1 AS log_id, '{"user": {"id": 101, "name": "Sarah"}, "events": [{"action": "click", "ts": 100}, {"action": "purchase", "amount": 299}]}' AS payload
    UNION ALL
    SELECT 2 AS log_id, '{"user": {"id": 102, "name": "Michael"}, "events": [{"action": "view", "ts": 150}]}' AS payload
)
SELECT 
    log_id,
    json_extract_string(payload, '$.user.name') AS username,
    json_extract(payload, '$.user.id') AS user_id,
    json_transform(payload, '{"user": {"name": "VARCHAR"}}') AS parsed_user,
    json_extract(payload, '$.events') AS events_array
FROM raw_logs;`
    },
    {
        id: 'sql-timeseries-rolling',
        title: '时序数据滑动平均与趋势统计 (DuckDB)',
        language: 'sql',
        category: '时序分析',
        description: '计算近 3 天滑动平均值与环比涨跌幅。',
        tags: ['DuckDB', 'Timeseries', 'Rolling'],
        code: `WITH daily_metrics AS (
    SELECT 
        DATE '2025-03-01' + CAST(i AS INTEGER) AS metric_date,
        round(1000 + sin(i * 0.5) * 300 + random() * 100, 0) AS dau
    FROM range(0, 15) t(i)
)
SELECT 
    metric_date,
    dau,
    round(avg(dau) OVER (
        ORDER BY metric_date 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 1) AS rolling_3d_avg_dau,
    dau - LAG(dau, 1) OVER (ORDER BY metric_date) AS day_over_day_change
FROM daily_metrics
ORDER BY metric_date ASC;`
    },

    // Python Templates
    {
        id: 'py-data-wrangling',
        title: '结构化数据转换与统计分析 (Python)',
        language: 'python',
        category: '数据科学',
        description: '在原生 Python 环境中进行复杂多层结构拆解、求均值、方差与表格化输出。',
        tags: ['Python', 'Wrangling', 'Statistics'],
        code: `# 模拟各区域销售团队业绩
records = [
    {"dept": "AI Labs", "member": "Leo", "score": 94, "projects": 8},
    {"dept": "AI Labs", "member": "Maya", "score": 88, "projects": 6},
    {"dept": "Cloud Arch", "member": "Alex", "score": 91, "projects": 7},
    {"dept": "Cloud Arch", "member": "David", "score": 85, "projects": 5},
    {"dept": "Data Platform", "member": "Sophie", "score": 96, "projects": 9},
    {"dept": "Data Platform", "member": "Ethan", "score": 79, "projects": 4},
]

# 按部门统计总分、平均分与最高分
dept_stats = {}
for r in records:
    d = r["dept"]
    if d not in dept_stats:
        dept_stats[d] = {"scores": [], "projects": []}
    dept_stats[d]["scores"].append(r["score"])
    dept_stats[d]["projects"].append(r["projects"])

summary_table = []
for dept, data in dept_stats.items():
    scores = data["scores"]
    avg_score = round(sum(scores) / len(scores), 2)
    max_score = max(scores)
    total_proj = sum(data["projects"])
    
    summary_table.append({
        "department": dept,
        "headcount": len(scores),
        "avg_score": avg_score,
        "max_score": max_score,
        "total_projects": total_proj
    })
    print(f"部门 [{dept}] -> 人数: {len(scores)}, 均分: {avg_score}, 总项目数: {total_proj}")

# 返回列表将直接被 Aone 表格化展示！
summary_table`
    },
    {
        id: 'py-fibonacci-generator',
        title: '算法与性能计时：动态规划与生成器 (Python)',
        language: 'python',
        category: '算法研究',
        description: '对比递归备忘录与矩阵快速幂的耗时表现。',
        tags: ['Python', 'Algorithm', 'Memoization'],
        code: `import time

def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("=== 开始斐波那契数列计算 ===")
start = time.perf_counter()
results = []

for i in range(1, 31):
    val = fib_memo(i)
    results.append({"n": i, "fib_value": val})

elapsed_ms = (time.perf_counter() - start) * 1000
print(f"计算前 30 项耗时: {elapsed_ms:.3f} ms")
print(f"第 30 项值: {results[-1]['fib_value']}")

# 返回数据供表格与图表展示
results`
    },

    // JavaScript Templates
    {
        id: 'js-pipeline-transform',
        title: '数据流管道过滤与对象聚合 (JavaScript)',
        language: 'javascript',
        category: '数据处理',
        description: '使用现代 Array.prototype.reduce 与 groupBy 语法进行快速聚合。',
        tags: ['JavaScript', 'Pipeline', 'ESNext'],
        code: `// 模拟用户行为追踪流
const events = [
    { userId: 'U1', event: 'page_view', path: '/home', duration: 12 },
    { userId: 'U2', event: 'page_view', path: '/pricing', duration: 45 },
    { userId: 'U1', event: 'click', target: 'btn-checkout', duration: 2 },
    { userId: 'U3', event: 'page_view', path: '/home', duration: 8 },
    { userId: 'U2', event: 'submit', target: 'form-signup', duration: 15 },
    { userId: 'U1', event: 'purchase', amount: 99, duration: 30 },
    { userId: 'U3', event: 'click', target: 'btn-docs', duration: 5 }
];

console.log('原始事件流总数:', events.length);
console.time('数据聚合耗时');

// 按用户汇总统计
const userMetrics = Object.values(
    events.reduce((acc, curr) => {
        if (!acc[curr.userId]) {
            acc[curr.userId] = {
                userId: curr.userId,
                eventCount: 0,
                totalDuration: 0,
                hasPurchase: false,
                totalAmount: 0
            };
        }
        acc[curr.userId].eventCount += 1;
        acc[curr.userId].totalDuration += curr.duration || 0;
        if (curr.event === 'purchase') {
            acc[curr.userId].hasPurchase = true;
            acc[curr.userId].totalAmount += curr.amount || 0;
        }
        return acc;
    }, {})
);

console.timeEnd('数据聚合耗时');

console.log('用户维度统计结果:');
console.table(userMetrics);

// 最终返回值
return userMetrics;`
    },
    {
        id: 'js-tree-flattener',
        title: '树形层级结构扁平化与层级推导 (JavaScript)',
        language: 'javascript',
        category: '数据结构',
        description: '递归遍历嵌套组织架构/目录树并输出带有 depth 与 path 的一维表。',
        tags: ['JavaScript', 'Tree', 'Recursion'],
        code: `const organizationTree = {
    id: "root",
    name: "Aone Technology",
    children: [
        {
            id: "eng",
            name: "Engineering",
            children: [
                { id: "ai", name: "AI & Agents", children: [] },
                { id: "infra", name: "Cloud & WASM", children: [] }
            ]
        },
        {
            id: "prod",
            name: "Product & Design",
            children: [
                { id: "ux", name: "UX Research", children: [] }
            ]
        }
    ]
};

function flattenTree(node, depth = 0, parentPath = "") {
    const currentPath = parentPath ? \`\${parentPath} / \${node.name}\` : node.name;
    const currentItem = {
        id: node.id,
        name: node.name,
        depth: depth,
        path: currentPath,
        childCount: node.children?.length || 0
    };

    const childrenItems = (node.children || []).flatMap(child => 
        flattenTree(child, depth + 1, currentPath)
    );

    return [currentItem, ...childrenItems];
}

const flatList = flattenTree(organizationTree);
console.log(\`扁平化完成，共解析 \${flatList.length} 个组织节点\`);
console.table(flatList);

return flatList;`
    }
];
