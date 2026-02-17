# Orchestration Patterns

## 1. Chain (Sequential)

- **Flow**: `Input -> Planner -> Coder -> Reviewer -> Output`.
- **Use Case**: Code generation (Plan, Write, Test).
- **Pros**: Clear linear path.
- **Cons**: Slow, accumulates errors.

## 2. Router (Manager)

- **Flow**: `Input -> Manager -> (Choice: Coder | Designer | Researcher)`.
- **Use Case**: Help desks, general assistants.
- **Pros**: Flexible, efficient.
- **Cons**: Manager bottleneck.

## 3. Parallel (Map-Reduce)

- **Flow**: `Input -> Split -> (Agent 1, Agent 2, Agent 3) -> Merge -> Output`.
- **Use Case**: Researching multiple topics, writing separate module files.
- **Pros**: Fastest.
- **Cons**: Merging logic is complex.

## 4. Debate (Adversarial)

- **Flow**: `Proposer <-> Critic`.
- **Use Case**: Refining a plan, finding security flaws.
- **Pros**: Higher quality output.
- **Cons**: Expensive (tokens), can get stuck.
