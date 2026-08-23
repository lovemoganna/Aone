import type { SnippetTemplate } from './types';

export const interpreterTemplates: SnippetTemplate[] = [
    {
        "id": "sicp-01-expressions",
        "title": "01. 表达式与求值 (Evaluation)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：计算机如何从最简单的基本元素（数字、符号、运算符）组合并计算出单一结果。",
        "tags": [
            "表达式",
            "求值规则",
            "组合式"
        ],
        "code": "# 【1. 一句话】\n# 解决计算机如何从“操作符”和“操作数”计算出单一确定结果的问题。\n\n# 【2. 最小例子】\na = 3\nb = 4\nhypotenuse_sq = (a * a) + (b * b)\nresult = hypotenuse_sq ** 0.5\n\n# 【3. 数据怎么变化】\n# 输入: a=3, b=4\n#   ↓\n# 执行: (3 * 3) -> 9, (4 * 4) -> 16, 9 + 16 -> 25, 25 ** 0.5 -> 5.0\n#   ↓\n# 输出: 5.0\n\n# 【4. SICP 在讲什么】\n# 组合式的求值规则（树形累积求值）：先求值子表达式，再将最外层操作符作用于子表达式的值。\n\n# 【5. 最小练习】\n# 将下方的 a 和 b 改为 6 和 8，验证输出是否为 10.0。\n[{\"step\": \"Sub-eval 1\", \"expr\": \"3 * 3\", \"val\": 3 * 3},\n {\"step\": \"Sub-eval 2\", \"expr\": \"4 * 4\", \"val\": 4 * 4},\n {\"step\": \"Add\", \"expr\": \"9 + 16\", \"val\": 25},\n {\"step\": \"Final\", \"expr\": \"sqrt(25)\", \"val\": result}]"
    },
    {
        "id": "sicp-02-procedures",
        "title": "02. 过程抽象 (Procedures)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：给一系列计算步骤起一个名字，封装为可重复调用的计算黑盒。",
        "tags": [
            "过程抽象",
            "黑盒抽象",
            "命名"
        ],
        "code": "# 【1. 一句话】\n# 解决如何将一串重复的计算步骤打包命名，隐藏细节，以便在更高层次复用。\n\n# 【2. 最小例子】\ndef square(x):\n    return x * x\n\ndef sum_of_squares(x, y):\n    return square(x) + square(y)\n\n# 【3. 数据怎么变化】\n# 输入: sum_of_squares(3, 4)\n#   ↓\n# 执行: square(3) -> 9, square(4) -> 16, 9 + 16 -> 25\n#   ↓\n# 输出: 25\n\n# 【4. SICP 在讲什么】\n# 过程抽象（Procedural Abstraction）：使用过程作为黑盒，调用者只关心输入输出契约，不关心内部如何算平方。\n\n# 【5. 换一种语言：DuckDB SQL 声明式宏】\n# CREATE OR REPLACE MACRO square(x) AS x * x;\n\n# 【6. 最小练习】\n# 编写一个 cube(x) 过程，利用 square(x) 计算 x 的立方。\n[{\"input_x\": 3, \"input_y\": 4, \"square_x\": square(3), \"square_y\": square(4), \"sum\": sum_of_squares(3, 4)}]"
    },
    {
        "id": "sicp-03-parameters",
        "title": "03. 参数绑定与代换模型 (Substitution)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：形参与实参如何对应绑定，计算结果如何通过表达式回传。",
        "tags": [
            "形参实参",
            "代换模型",
            "纯函数"
        ],
        "code": "# 【1. 一句话】\n# 解决过程调用时，外部实参如何代换过程体内的局部形参，并生成纯净返回值。\n\n# 【2. 最小例子】\ndef average(a, b):\n    return (a + b) / 2\n\ndef mean_square(x, y):\n    sq_x = x * x\n    sq_y = y * y\n    return average(sq_x, sq_y)\n\n# 【3. 数据怎么变化】\n# 输入: x=10, y=20\n#   ↓\n# 执行: sq_x=100, sq_y=400 -> average(100, 400) -> (100 + 400) / 2 -> 250.0\n#   ↓\n# 输出: 250.0\n\n# 【4. SICP 在讲什么】\n# 代换模型（Substitution Model）：理解过程求值的直觉方式——用实参直接代换过程体中的形式参数。\n\n# 【5. 最小练习】\n# 修改代码，增加第三个参数 z，计算三数的平方平均值。\n[{\"x\": 10, \"y\": 20, \"mean_square\": mean_square(10, 20)}]"
    },
    {
        "id": "sicp-04-conditions",
        "title": "04. 条件分支与谓词 (Conditions)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：让程序能根据不同的数据状态选择执行不同的计算路径。",
        "tags": [
            "条件分支",
            "谓词",
            "分段函数"
        ],
        "code": "# 【1. 一句话】\n# 解决计算逻辑中根据真假判断执行不同分支的问题（如绝对值、符号判断）。\n\n# 【2. 最小例子】\ndef abs_val(x):\n    if x > 0:\n        return x\n    elif x == 0:\n        return 0\n    else:\n        return -x\n\n# 【3. 数据怎么变化】\n# 输入: -15\n#   ↓\n# 执行: 判断 -15 > 0 (False) -> -15 == 0 (False) -> else 分支: -(-15) -> 15\n#   ↓\n# 输出: 15\n\n# 【4. SICP 在讲什么】\n# 条件表达式（cond / if）与谓词（Predicate）：构建非线性、具备自适应选择能力的计算过程。\n\n# 【5. 换一种语言：DuckDB SQL CASE 表达式】\n# SELECT x, CASE WHEN x >= 0 THEN x ELSE -x END AS abs_x FROM (VALUES (-5), (0), (12)) AS t(x);\n\n# 【6. 最小练习】\n# 编写 sign(x) 过程：x>0 返回 1，x==0 返回 0，x<0 返回 -1。\n[{\"x\": v, \"abs\": abs_val(v)} for v in [-25, 0, 42]]"
    },
    {
        "id": "sicp-05-recursion",
        "title": "05. 递归与计算过程形状 (Recursion)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：通过自我引用，将大规模问题自然分解为基准情况与更小规模的同类问题。",
        "tags": [
            "递归",
            "基准条件",
            "栈展开"
        ],
        "code": "# 【1. 一句话】\n# 解决无需显式循环变量，通过“基准情况 + 缩减规模”完成重复计算的问题。\n\n# 【2. 最小例子】\ndef factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\n# 【3. 数据怎么变化】\n# 输入: factorial(4)\n#   ↓\n# 执行展开: 4 * factorial(3) -> 4 * (3 * factorial(2)) -> 4 * (3 * (2 * 1))\n# 收缩归约: 2 * 1 = 2 -> 3 * 2 = 6 -> 4 * 6 = 24\n#   ↓\n# 输出: 24\n\n# 【4. SICP 在讲什么】\n# 线性递归过程（Linear Recursive Process）：计算轨迹呈现“先膨胀（推迟操作）后收缩（收集结果）”的形状。\n\n# 【5. 换一种语言：DuckDB 递归 CTE】\n# WITH RECURSIVE fact(n, val) AS (\n#   SELECT 1, 1\n#   UNION ALL\n#   SELECT n + 1, val * (n + 1) FROM fact WHERE n < 5\n# ) SELECT * FROM fact;\n\n# 【6. 最小练习】\n# 编写 sum_range(n)：计算从 1 加到 n 的和（如 n=5 输出 15）。\n[{\"n\": i, \"factorial\": factorial(i)} for i in range(1, 6)]"
    },
    {
        "id": "sicp-06-composition",
        "title": "06. 过程组合与流水线 (Composition)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：将一个过程的输出作为下一个过程的输入，拼接成清晰的数据处理管道。",
        "tags": [
            "组合",
            "管道",
            "模块化"
        ],
        "code": "# 【1. 一句话】\n# 解决将多个简单独立的过程串联成复合管道、避免写成大单体函数的问题。\n\n# 【2. 最小例子】\ndef increment(x):\n    return x + 1\n\ndef double(x):\n    return x * 2\n\ndef compose(f, g):\n    return lambda x: f(g(x))\n\n# 组合：先翻倍，再加一\ndouble_then_inc = compose(increment, double)\n\n# 【3. 数据怎么变化】\n# 输入: 5\n#   ↓\n# 执行: g(5) = double(5) = 10 -> f(10) = increment(10) = 11\n#   ↓\n# 输出: 11\n\n# 【4. SICP 在讲什么】\n# 过程是头等公民（First-class procedures），过程可以像普通数据一样作为另一个过程的输入或返回值。\n\n# 【5. 最小练习】\n# 组合出一个 inc_then_double（先加一，再翻倍），对输入 5 验证输出是否为 12。\n[{\"input\": x, \"result\": double_then_inc(x)} for x in [1, 2, 3, 5, 10]]"
    },
    {
        "id": "sicp-07-higher-order",
        "title": "07. 高阶函数与模式抽象 (Higher-Order)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：把重复的“循环与求和结构”提炼出来，将具体的“项计算公式”作为参数传入。",
        "tags": [
            "高阶函数",
            "抽象公共模式",
            "Sigma求和"
        ],
        "code": "# 【1. 一句话】\n# 解决累加、映射等算法结构高度相同、只有细微计算规则不同的代码重复问题。\n\n# 【2. 最小例子】\ndef summation(term, a, next_val, b):\n    if a > b:\n        return 0\n    return term(a) + summation(term, next_val(a), next_val, b)\n\n# 计算 1^2 + 2^2 + 3^2 + 4^2\nsum_squares = summation(lambda x: x * x, 1, lambda x: x + 1, 4)\n\n# 计算 1^3 + 2^3 + 3^3 + 4^3\nsum_cubes = summation(lambda x: x ** 3, 1, lambda x: x + 1, 4)\n\n# 【3. 数据怎么变化】\n# 输入: term=square, a=1, b=4\n#   ↓\n# 执行: 1*1 + 2*2 + 3*3 + 4*4 -> 1 + 4 + 9 + 16 -> 30\n#   ↓\n# 输出: 30\n\n# 【4. SICP 在讲什么】\n# 高阶过程抽象（Higher-Order Procedures）：过程接受过程作为参数，从而创造更高维度的概念抽象（如数学中的 ∑）。\n\n# 【5. 最小练习】\n# 用 summation 计算 1 + 2 + 3 + ... + 10 的纯自然数求和。\n[{\"type\": \"Sum of Squares (1..4)\", \"result\": sum_squares},\n {\"type\": \"Sum of Cubes (1..4)\", \"result\": sum_cubes}]"
    },
    {
        "id": "sicp-08-data-abstraction",
        "title": "08. 数据抽象与对子 (Pairs & Cons)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：把多个相关联的数据粘合为一个复合单元，通过构造函数与选择函数隔离实现。",
        "tags": [
            "对子",
            "数据抽象",
            "Cons/Car/Cdr"
        ],
        "code": "# 【1. 一句话】\n# 解决如何将多个离散数据打包为单一结构化对象（如分子与分母、坐标点），并提供干净的选择接口。\n\n# 【2. 最小例子】\ndef make_rat(n, d):\n    return (n, d)\n\ndef numer(r):\n    return r[0]\n\ndef denom(r):\n    return r[1]\n\ndef add_rat(x, y):\n    return make_rat(numer(x) * denom(y) + numer(y) * denom(x),\n                    denom(x) * denom(y))\n\n# 1/2 + 1/3 = 5/6\nr1 = make_rat(1, 2)\nr2 = make_rat(1, 3)\nr3 = add_rat(r1, r2)\n\n# 【3. 数据怎么变化】\n# 输入: (1, 2) 与 (1, 3)\n#   ↓\n# 执行: (1*3 + 1*2) / (2*3) -> 5 / 6 -> (5, 6)\n#   ↓\n# 输出: numer=5, denom=6\n\n# 【4. SICP 在讲什么】\n# 抽象屏障（Abstraction Barrier）：使用数据的一方完全不知道底层的元组/列表表示，只需通过构造器与选择器交互。\n\n# 【5. 最小练习】\n# 编写 mul_rat(x, y) 实现两个有理数的乘法。\n[{\"rat1\": str(numer(r1)) + \"/\" + str(denom(r1)),\n  \"rat2\": str(numer(r2)) + \"/\" + str(denom(r2)),\n  \"sum\": str(numer(r3)) + \"/\" + str(denom(r3))}]"
    },
    {
        "id": "sicp-09-closures",
        "title": "09. 闭包与词法作用域 (Closures)",
        "language": "javascript",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：函数在诞生时能捕获并记住外部环境中的变量，离开定义域后依然能访问。",
        "tags": [
            "闭包",
            "作用域",
            "函数工厂"
        ],
        "code": "// 【1. 一句话】\n// 解决如何让内部函数长久记住外部创建时刻的局部变量，实现定制化专用函数。\n\n// 【2. 最小例子】\nfunction makeMultiplier(factor) {\n    return function (x) {\n        return x * factor;\n    };\n}\n\nconst double = makeMultiplier(2);\nconst triple = makeMultiplier(3);\n\n// 【3. 数据怎么变化】\n// 输入: makeMultiplier(2) 生成 double 函数，内部绑定 factor=2\n//   ↓\n// 执行: double(10) -> 10 * 2 -> 20; triple(10) -> 10 * 3 -> 30\n//   ↓\n// 输出: 20 和 30\n\n// 【4. SICP 在讲什么】\n// 闭包（Closure）是函数与其引用的词法环境的集合体。代码本身不仅是逻辑，还附带了它诞生时的私有环境。\n\n// 【5. 最小练习】\n// 编写 makeAdder(n) 函数工厂，生成一个 add5 函数。\n[\n    { input: 10, multiplier: 2, result: double(10) },\n    { input: 10, multiplier: 3, result: triple(10) },\n    { input: 25, multiplier: 2, result: double(25) }\n];"
    },
    {
        "id": "sicp-10-state-mutation",
        "title": "10. 状态与局部可变性 (State & Mutation)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：让对象拥有“随时间推移而演变的历史记忆”，摆脱无状态纯函数的局限。",
        "tags": [
            "局部状态",
            "赋值",
            "非纯函数"
        ],
        "code": "# 【1. 一句话】\n# 解决如何模拟现实世界具有“记忆”和“余额变化”的实体对象。\n\n# 【2. 最小例子】\ndef make_withdraw(balance):\n    def withdraw(amount):\n        nonlocal balance\n        if amount <= balance:\n            balance -= amount\n            return balance\n        return \"余额不足\"\n    return withdraw\n\nacc1 = make_withdraw(100)\nop1 = acc1(30)  # 剩余 70\nop2 = acc1(50)  # 剩余 20\nop3 = acc1(40)  # 余额不足\n\n# 【3. 数据怎么变化】\n# 输入: 初始余额 100\n#   ↓\n# 执行: 取 30 (余 70) -> 取 50 (余 20) -> 取 40 (超支)\n#   ↓\n# 输出: 70 -> 20 -> 余额不足\n\n# 【4. SICP 在讲什么】\n# 赋值引入了时间与状态（State）：代换模型在此失效，同一个表达式在不同时刻调用会返回不同值。\n\n# 【5. 最小练习】\n# 给 make_withdraw 增加一个 deposit 充值功能。\n[{\"action\": \"取款 30\", \"balance_after\": op1},\n {\"action\": \"取款 50\", \"balance_after\": op2},\n {\"action\": \"取款 40\", \"balance_after\": op3}]"
    },
    {
        "id": "sicp-11-environment-model",
        "title": "11. 环境模型与作用域查找 (Environment Model)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：环境由多个帧（Frame）串联而成，变量查找沿着父环境指针向外逐层追溯。",
        "tags": [
            "环境模型",
            "作用域链",
            "帧链表"
        ],
        "code": "# 【1. 一句话】\n# 解决带状态的语言中，变量到底在哪个上下文帧（Frame）中被定义和遮蔽的机制。\n\n# 【2. 最小例子】\nclass Frame(dict):\n    def __init__(self, bindings=None, parent=None):\n        super().__init__(bindings or {})\n        self.parent = parent\n\n    def lookup(self, var):\n        if var in self:\n            return self[var]\n        if self.parent:\n            return self.parent.lookup(var)\n        raise NameError(f\"未找到变量: {var}\")\n\n# 构建两层环境：全局帧 -> 局部帧\nglobal_frame = Frame({\"x\": 10, \"y\": 20})\nlocal_frame = Frame({\"x\": 99}, parent=global_frame)\n\nval_x = local_frame.lookup(\"x\")  # 局部遮蔽: 99\nval_y = local_frame.lookup(\"y\")  # 向上查找: 20\n\n# 【3. 数据怎么变化】\n# 输入: 查找 \"x\" 和 \"y\"\n#   ↓\n# 执行: 查 \"x\" 命中局部帧 -> 99; 查 \"y\" 局部无，沿 parent 到 global 帧命中 -> 20\n#   ↓\n# 输出: x=99, y=20\n\n# 【4. SICP 在讲什么】\n# 求值的环境模型（Environment Model）：环境是一系列帧的链条，决定了符号的意义与生命周期。\n\n# 【5. 最小练习】\n# 在 local_frame 下再建一层 inner_frame，添加 \"z\": 300，验证是否能查到 x, y, z。\n[{\"query\": \"x (局部覆盖)\", \"found_value\": val_x},\n {\"query\": \"y (外层继承)\", \"found_value\": val_y}]"
    },
    {
        "id": "sicp-12-data-directed",
        "title": "12. 数据驱动程序与分派表 (Data-Directed)",
        "language": "javascript",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：把操作与类型的对应关系存进二维查表，彻底消除冗长的 if/else 逻辑。",
        "tags": [
            "数据驱动",
            "分派表",
            "多态设计"
        ],
        "code": "// 【1. 一句话】\n// 解决新增数据类型或新增操作时，无需修改原有业务代码的模块化扩展问题。\n\n// 【2. 最小例子】\nconst operationTable = {};\n\nfunction put(op, type, item) {\n    operationTable[op + ':' + type] = item;\n}\n\nfunction get(op, type) {\n    return operationTable[op + ':' + type];\n}\n\n// 注册矩形与圆形的面积计算过程\nput('area', 'rect', (shape) => shape.w * shape.h);\nput('area', 'circle', (shape) => Math.PI * shape.r * shape.r);\n\nfunction calculate(op, shape) {\n    const proc = get(op, shape.type);\n    if (!proc) throw new Error(\"未知操作\");\n    return proc(shape);\n}\n\n// 【3. 数据怎么变化】\n// 输入: { type: 'rect', w: 4, h: 5 } 与 { type: 'circle', r: 3 }\n//   ↓\n// 执行: calculate('area', rect) -> 查表得到 rect 算法 -> 20\n//   ↓\n// 输出: 20 与 28.274\n\n// 【4. SICP 在讲什么】\n// 数据驱动编程（Data-Directed Programming）：面向对象与多态体系的原型，实现开闭原则。\n\n// 【5. 最小练习】\n// 为 'perimeter'（周长）注册 rect 和 circle 的计算方法。\n[\n    { shape: 'rect 4x5', area: calculate('area', { type: 'rect', w: 4, h: 5 }) },\n    { shape: 'circle r=3', area: Number(calculate('area', { type: 'circle', r: 3 }).toFixed(2)) }\n];"
    },
    {
        "id": "sicp-13-interpreter",
        "title": "13. 元循环解释器：Eval 与 Apply (Interpreter)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：用自身语言实现自己的求值器，理解程序即数据、求值即应用的终极闭环。",
        "tags": [
            "元循环",
            "Eval-Apply",
            "SICP终极思想"
        ],
        "code": "# 【1. 一句话】\n# 解决计算机语言如何理解自身语法、执行任意用户定义的表达式与过程。\n\n# 【2. 最小例子】\nglobal_env = {\n    '+': lambda a, b: a + b,\n    '*': lambda a, b: a * b,\n    '-': lambda a, b: a - b,\n}\n\ndef evaluate(exp, env):\n    # 1. 自求值数字\n    if isinstance(exp, (int, float)):\n        return exp\n    # 2. 变量符号查找\n    if isinstance(exp, str):\n        return env[exp]\n    # 3. 组合式应用: (op, arg1, arg2...)\n    op = evaluate(exp[0], env)\n    args = [evaluate(arg, env) for arg in exp[1:]]\n    return op(*args)\n\n# 求解复合表达式: (* (+ 2 3) (- 10 4)) => 5 * 6 = 30\nexpr = ['*', ['+', 2, 3], ['-', 10, 4]]\nres = evaluate(expr, global_env)\n\n# 【3. 数据怎么变化】\n# 输入: ['*', ['+', 2, 3], ['-', 10, 4]]\n#   ↓\n# 执行: evaluate(['+', 2, 3]) -> 5; evaluate(['-', 10, 4]) -> 6; 5 * 6 -> 30\n#   ↓\n# 输出: 30\n\n# 【4. SICP 在讲什么】\n# Eval 与 Apply 互相递归调用构成了所有计算系统的心脏。程序本身就是可被遍历求值的数据结构。\n\n# 【5. 最小练习】\n# 在 global_env 中增加 '/' 除法支持，并计算 ['/', 100, 4]。\n[{\"expression\": \"(* (+ 2 3) (- 10 4))\", \"ast\": str(expr), \"evaluated_result\": res}]"
    },
    {
        "id": "sql-01-window-moving-avg",
        "title": "14. 窗口函数与移动平均 (Window & Moving Avg)",
        "language": "sql",
        "category": "现代 SQL 关系与分析计算",
        "description": "解决在不破坏数据行原有颗粒度的前提下，对局部滑动窗口进行累加和均值计算的问题。",
        "tags": ["窗口函数", "移动平均", "分析型SQL"],
        "code": "-- 【1. 一句话】\n-- 在不使用 GROUP BY 折叠行的情况下，计算时序连续数据的局部滑动统计指标。\n\n-- 【2. 最小例子】\nWITH sales_data AS (\n    SELECT 1 AS day_id, 120.0 AS amount UNION ALL\n    SELECT 2, 150.0 UNION ALL\n    SELECT 3, 200.0 UNION ALL\n    SELECT 4, 180.0 UNION ALL\n    SELECT 5, 240.0 UNION ALL\n    SELECT 6, 310.0 UNION ALL\n    SELECT 7, 280.0\n)\nSELECT \n    day_id,\n    amount,\n    -- 累加总计\n    SUM(amount) OVER (ORDER BY day_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,\n    -- 3天移动平均 (前2天 + 当天)\n    ROUND(AVG(amount) OVER (ORDER BY day_id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3d,\n    -- 当日相对前一日的环比增量\n    amount - LAG(amount, 1, amount) OVER (ORDER BY day_id) AS daily_diff\nFROM sales_data\nORDER BY day_id;"
    },
    {
        "id": "sql-02-recursive-cte",
        "title": "15. 递归 CTE：组织架构树形展开 (Recursive Hierarchy)",
        "language": "sql",
        "category": "现代 SQL 关系与分析计算",
        "description": "解决关系型数据库中父子递归层级与多层树状图的遍历溯源问题。",
        "tags": ["递归CTE", "树遍历", "层级路径"],
        "code": "-- 【1. 一句话】\n-- 解决树形/图数据在 SQL 中的遍历展开与层级深度路径追踪。\n\n-- 【2. 最小例子】\nWITH RECURSIVE org_chart AS (\n    -- 初始员工数据\n    SELECT 1 AS emp_id, 'CEO Alice' AS name, NULL::INTEGER AS manager_id UNION ALL\n    SELECT 2, 'VP Bob', 1 UNION ALL\n    SELECT 3, 'VP Charlie', 1 UNION ALL\n    SELECT 4, 'Lead David', 2 UNION ALL\n    SELECT 5, 'Engineer Eve', 4 UNION ALL\n    SELECT 6, 'Designer Frank', 3\n),\nhierarchy AS (\n    -- 基准条件：根节点 (CEO)\n    SELECT \n        emp_id, \n        name, \n        manager_id, \n        1 AS level, \n        name::VARCHAR AS path\n    FROM org_chart\n    WHERE manager_id IS NULL\n    \n    UNION ALL\n    \n    -- 递归展开：子节点连接父节点\n    SELECT \n        e.emp_id, \n        e.name, \n        e.manager_id, \n        h.level + 1 AS level, \n        (h.path || ' -> ' || e.name)::VARCHAR AS path\n    FROM org_chart e\n    JOIN hierarchy h ON e.manager_id = h.emp_id\n)\nSELECT \n    emp_id,\n    REPEAT('  ', level - 1) || '└─ ' || name AS visual_tree,\n    level AS hierarchy_depth,\n    path AS full_reporting_chain\nFROM hierarchy\nORDER BY path;"
    },
    {
        "id": "sql-03-nested-unnest",
        "title": "16. 结构体与动态数组展开 (UNNEST & Struct)",
        "language": "sql",
        "category": "现代 SQL 关系与分析计算",
        "description": "解决半结构化数据嵌套字段解析与一对多数组平铺的关系化计算。",
        "tags": ["UNNEST", "Struct", "半结构化"],
        "code": "-- 【1. 一句话】\n-- 解决嵌套 JSON/数组在一行中平铺展开为标准关系表进行精细化聚合的问题。\n\n-- 【2. 最小例子】\nWITH order_events AS (\n    SELECT 101 AS order_id, 'Alice' AS customer, [{'item': 'MacBook', 'qty': 1, 'price': 12999}, {'item': 'Mouse', 'qty': 2, 'price': 299}] AS items UNION ALL\n    SELECT 102, 'Bob', [{'item': 'Monitor', 'qty': 1, 'price': 2499}, {'item': 'Keyboard', 'qty': 1, 'price': 699}, {'item': 'USB Cable', 'qty': 3, 'price': 49}] UNION ALL\n    SELECT 103, 'Charlie', [{'item': 'Desk', 'qty': 1, 'price': 1899}]\n)\nSELECT \n    order_id,\n    customer,\n    item_detail.item AS product_name,\n    item_detail.qty AS quantity,\n    item_detail.price AS unit_price,\n    (item_detail.qty * item_detail.price) AS line_total\nFROM order_events,\nUNNEST(items) AS t(item_detail)\nORDER BY order_id, line_total DESC;"
    },
    {
        "id": "sql-04-pivot-aggregation",
        "title": "17. 聚合过滤与行转列旋转 (PIVOT & Filtered Agg)",
        "language": "sql",
        "category": "现代 SQL 关系与分析计算",
        "description": "解决动态维度数据交叉报表生成与条件聚合归类统计的问题。",
        "tags": ["PIVOT", "交叉报表", "条件聚合"],
        "code": "-- 【1. 一句话】\n-- 解决按维度进行多列行转列（Pivot）与条件过滤聚合的精简表达。\n\n-- 【2. 最小例子】\nWITH raw_metrics AS (\n    SELECT 'North' AS region, 'Q1' AS quarter, 4200 AS revenue UNION ALL\n    SELECT 'North', 'Q2', 5100 UNION ALL\n    SELECT 'North', 'Q3', 6300 UNION ALL\n    SELECT 'South', 'Q1', 3800 UNION ALL\n    SELECT 'South', 'Q2', 4100 UNION ALL\n    SELECT 'South', 'Q3', 4900 UNION ALL\n    SELECT 'West',  'Q1', 2900 UNION ALL\n    SELECT 'West',  'Q2', 3400 UNION ALL\n    SELECT 'West',  'Q3', 3900\n)\nSELECT \n    region,\n    SUM(revenue) FILTER (WHERE quarter = 'Q1') AS q1_revenue,\n    SUM(revenue) FILTER (WHERE quarter = 'Q2') AS q2_revenue,\n    SUM(revenue) FILTER (WHERE quarter = 'Q3') AS q3_revenue,\n    SUM(revenue) AS total_revenue,\n    ROUND(AVG(revenue), 2) AS quarterly_avg\nFROM raw_metrics\nGROUP BY region\nORDER BY total_revenue DESC;"
    },
    {
        "id": "sicp-14-streams-lazy",
        "title": "18. 惰性求值与生成器流 (Streams & Lazy Evaluation)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：按需生成数据而非一次性装载，表示无限序列与极大规数据集。",
        "tags": ["惰性求值", "生成器", "无限流"],
        "code": "# 【1. 一句话】\n# 解决如何用有限内存表示并处理潜在无限规模的数据序列（按需消费）。\n\n# 【2. 最小例子】\ndef fibonacci_stream():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\ndef take(stream, n):\n    result = []\n    for _ in range(n):\n        result.append(next(stream))\n    return result\n\n# 创建无限斐波那契流并按需索取前 10 个\nfib_gen = fibonacci_stream()\nfirst_10 = take(fib_gen, 10)\n\n# 【3. 数据怎么变化】\n# 产生式: 0 -> 1 -> 1 -> 2 -> 3 -> 5 -> 8 -> 13 -> 21 -> 34\n# 输出: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n\n# 【4. SICP 在讲什么】\n# 流（Stream）是推迟计算（Delayed Evaluation）的表。流将“计算的时间序列”与“程序的循环控制”彻底解耦。\n\n# 【5. 最小练习】\n# 编写一个 primes_stream() 无限质数生成器流。\n[{\"index\": i, \"fib_value\": val, \"ratio\": round(val / first_10[i-1], 4) if i > 1 else 1.0} for i, val in enumerate(first_10)]"
    },
    {
        "id": "sicp-15-memoization-dp",
        "title": "19. 记忆化与动态规划 (Memoization & DP)",
        "language": "python",
        "category": "SICP 渐进学习 Loop",
        "description": "1.一句话：用空间换时间，缓存重叠子问题的解，消除树形递归中的指数级冗余计算。",
        "tags": ["记忆化", "动态规划", "时间复杂度优化"],
        "code": "# 【1. 一句话】\n# 解决经典递归中大量重复计算相同子问题导致性能爆炸的问题。\n\n# 【2. 最小例子】\ndef memoize(f):\n    cache = {}\n    def memoized_fn(*args):\n        if args not in cache:\n            cache[args] = f(memoized_fn, *args)\n        return cache[args]\n    return memoized_fn\n\n# 零钱兑换硬币计数 (Coin Change)\ndef count_change_impl(recurse, amount, coins):\n    if amount == 0:\n        return 1\n    if amount < 0 or len(coins) == 0:\n        return 0\n    # 分解为: 使用最大面值硬币 + 完全不使用该面值硬币\n    return recurse(amount - coins[0], coins) + recurse(amount, coins[1:])\n\nfast_change = memoize(count_change_impl)\nways_100 = fast_change(100, (50, 25, 10, 5, 1))\n\n# 【3. 数据怎么变化】\n# 将 100 美分兑换为 50/25/10/5/1 美分的所有可能组合数 -> 292 种\n\n# 【4. SICP 在讲什么】\n# 记忆化（Memoization）：将普通纯函数包装为具有自我查表记忆能力的函数，是自顶向下动态规划的核心。\n\n# 【5. 最小练习】\n# 验证换 50 美分共有多少种组合。\n[{\"target_amount\": 100, \"available_coins\": \"50, 25, 10, 5, 1\", \"combination_ways\": ways_100},\n {\"target_amount\": 50, \"available_coins\": \"25, 10, 5, 1\", \"combination_ways\": fast_change(50, (25, 10, 5, 1))}]"
    },
    {
        "id": "js-01-async-pipeline",
        "title": "20. 异步流水线与并发池控制 (Async Pipeline & Pool)",
        "language": "javascript",
        "category": "现代 JavaScript 并发与函数式",
        "description": "解决多任务异步 I/O 的并发限流、失败隔离与链式变换管道计算。",
        "tags": ["异步并发", "Promise池", "函数组合"],
        "code": "// 【1. 一句话】\n// 解决批量网络请求或高负载 I/O 时的并发并发窗口控制与流水线聚合。\n\n// 【2. 最小例子】\nasync function asyncPool(limit, tasks) {\n    const results = [];\n    const executing = new Set();\n\n    for (const [idx, task] of tasks.entries()) {\n        const p = Promise.resolve().then(() => task(idx)).then(res => {\n            executing.delete(p);\n            return res;\n        });\n        results.push(p);\n        executing.add(p);\n\n        if (executing.size >= limit) {\n            await Promise.race(executing);\n        }\n    }\n    return Promise.all(results);\n}\n\n// 模拟 6 个不同延迟的异步数据抓取任务\nconst tasks = [100, 150, 80, 200, 120, 90].map((delay, i) => async () => {\n    return {\n        taskId: `JOB-00${i + 1}`,\n        durationMs: delay,\n        status: 'SUCCESS',\n        processedAt: new Date().toISOString()\n    };\n});\n\nconst pooledResults = await asyncPool(2, tasks);\npooledResults;"
    },
    {
        "id": "js-02-curry-compose",
        "title": "21. 柯里化与类型化管道组合 (Currying & Pipe)",
        "language": "javascript",
        "category": "现代 JavaScript 并发与函数式",
        "description": "解决将一元纯函数无缝拼接为左到右连续数据流动管道的优雅编程模式。",
        "tags": ["柯里化", "管道组合", "Point-free"],
        "code": "// 【1. 一句话】\n// 解决将复杂多步数据清洗逻辑拆解为单一职责纯函数并通过管道线性组合的问题。\n\n// 【2. 最小例子】\nconst pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);\n\n// 柯里化工具\nconst map = (fn) => (arr) => arr.map(fn);\nconst filter = (predicate) => (arr) => arr.filter(predicate);\nconst sortBy = (key) => (arr) => [...arr].sort((a, b) => (a[key] > b[key] ? 1 : -1));\n\n// 原始数据集\nconst rawUsers = [\n    { id: 1, name: 'alice smith', age: 28, role: 'developer', score: 88 },\n    { id: 2, name: 'bob jones', age: 17, role: 'student', score: 92 },\n    { id: 3, name: 'charlie brown', age: 34, role: 'designer', score: 95 },\n    { id: 4, name: 'david lee', age: 16, role: 'student', score: 65 },\n    { id: 5, name: 'eva green', age: 24, role: 'developer', score: 91 }\n];\n\n// 构建数据清洗流水线\nconst processAdultDevelopers = pipe(\n    filter(u => u.age >= 18),\n    map(u => ({\n        ...u,\n        name: u.name.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),\n        level: u.score >= 90 ? 'Senior' : 'Intermediate'\n    })),\n    sortBy('score')\n);\n\nconst transformed = processAdultDevelopers(rawUsers);\ntransformed;"
    }
];
