---
description: Rules to execute a task and its sub-tasks using Agent OS
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Task Execution Rules

## Overview

Execute a specific task along with its sub-tasks systematically following a TDD development workflow.

## MCP-First Guidance (Development)
- Subagents should prefer MCP tools automatically:
  - Docs/research (context-fetcher): leverage `Exa MCP` → `Ref MCP`
  - Repo interactions (git-workflow): prefer `GitHub MCP` for PRs/reviews
  - Dev diagnostics (external-delegator): use `DigitalOcean MCP` (dev/staging)
  - UI verification (test-runner): coordinate `Playwright MCP` as needed
  - Error investigation (validator/sentry-integrator): query `Sentry MCP`

Do not use MCP for production deployments during task execution.

## Codex-First (Micro‑plans & Checklists)
- For subtask sequencing and acceptance checklists, prefer `codex exec` with prompts that request output-only artifacts.
- Prompt constraints: "Output only the final checklist/plan. No explanations. No code fences." Use JSON when machine parsing is needed.
- Non-interactive mode only; do not set Codex timeouts. Recommend `hide_agent_reasoning = true` in `~/.codex/config.toml`.

## Concurrent Support Subagents
Run the following subagents in parallel with the main implementation, and integrate their outputs:

<parallel_workflows>
  <agent name="validator" triggers="on-edit,on-save">
    - Perform code review (style/security/performance) on diffs
    - Run lint/typecheck incrementally; surface errors immediately
    - If tests are impacted, suggest focused test files to `test-runner`
  </agent>
  <agent name="test-runner" triggers="on-request">
    - Execute focused tests for touched modules
    - Prepare a minimal Playwright MCP check when UI changes detected
  </agent>
  <agent name="project-manager" triggers="on-subtask-complete">
    - Update tasks.md checkboxes and notes
    - Record blockers with actionable follow-ups
  </agent>
  <agent name="orchestrator" triggers="continuous">
    - Pre-fetch context/docs via Exa/Ref as needed
    - Queue next implementation step; coordinate with `git-workflow` for branch hygiene
  </agent>
  <agent name="external-delegator" triggers="conditional">
    - If the task involves graph/Neo4j: use Neo4j Cypher MCP to verify schema or run safe read queries
  </agent>
  <agent name="sentry-integrator" triggers="conditional">
    - If the task impacts observability: run Sentry MCP queries to detect new issues for the relevant service/project
  </agent>
</parallel_workflows>

<pre_flight_check>
  EXECUTE: @.agent-os/instructions/meta/pre-flight.md
</pre_flight_check>


<process_flow>

<step number="1" subagent="project-manager" name="task_understanding">

### Step 1: Task Understanding

Use the project-manager subagent to read and analyze the given parent task and all its sub-tasks from tasks.md to gain complete understanding of what needs to be built.

<task_analysis>
  <read_from_tasks_md>
    - Parent task description
    - All sub-task descriptions
    - Task dependencies
    - Expected outcomes
  </read_from_tasks_md>
</task_analysis>

<instructions>
  ACTION: Read the specific parent task and all its sub-tasks
  ANALYZE: Full scope of implementation required
  UNDERSTAND: Dependencies and expected deliverables
  NOTE: Test requirements for each sub-task
</instructions>

</step>

<step number="2" subagent="context-fetcher" name="technical_spec_review">

### Step 2: Technical Specification Review

Use the context-fetcher subagent to search and extract relevant sections from technical-spec.md to understand the technical implementation approach for this task. For external references, the context-fetcher should coordinate with external-delegator to discover via `Exa MCP` and fetch via `Ref MCP`.

<selective_reading>
  <search_technical_spec>
    FIND sections in technical-spec.md related to:
    - Current task functionality
    - Implementation approach for this feature
    - Integration requirements
    - Performance criteria
  </search_technical_spec>
</selective_reading>

<instructions>
  ACTION: Search technical-spec.md for task-relevant sections
  EXTRACT: Only implementation details for current task
  SKIP: Unrelated technical specifications
  FOCUS: Technical approach for this specific feature
</instructions>

</step>

<step number="3" subagent="context-fetcher" name="best_practices_review">

### Step 3: Best Practices Review

Use the context-fetcher subagent to retrieve relevant sections from @.agent-os/standards/best-practices.md that apply to the current task's technology stack and feature type.

<selective_reading>
  <search_best_practices>
    FIND sections relevant to:
    - Task's technology stack
    - Feature type being implemented
    - Testing approaches needed
    - Code organization patterns
  </search_best_practices>
</selective_reading>

<instructions>
  ACTION: Use context-fetcher subagent
  REQUEST: "Find best practices sections relevant to:
            - Task's technology stack: [CURRENT_TECH]
            - Feature type: [CURRENT_FEATURE_TYPE]
            - Testing approaches needed
            - Code organization patterns"
  PROCESS: Returned best practices
  APPLY: Relevant patterns to implementation
</instructions>

</step>

<step number="4" subagent="context-fetcher" name="code_style_review">

### Step 4: Code Style Review

Use the context-fetcher subagent to retrieve relevant code style rules from @.agent-os/standards/code-style.md for the languages and file types being used in this task.

<selective_reading>
  <search_code_style>
    FIND style rules for:
    - Languages used in this task
    - File types being modified
    - Component patterns being implemented
    - Testing style guidelines
  </search_code_style>
</selective_reading>

<instructions>
  ACTION: Use context-fetcher subagent
  REQUEST: "Find code style rules for:
            - Languages: [LANGUAGES_IN_TASK]
            - File types: [FILE_TYPES_BEING_MODIFIED]
            - Component patterns: [PATTERNS_BEING_IMPLEMENTED]
            - Testing style guidelines"
  PROCESS: Returned style rules
  APPLY: Relevant formatting and patterns
</instructions>

</step>

<step number="5" subagent="precision-coder" name="task_execution">

### Step 5: Task and Sub-task Execution

Use the precision-coder subagent to execute the parent task and all sub-tasks in order using test-driven development (TDD) approach.

<typical_task_structure>
  <first_subtask>Write tests for [feature]</first_subtask>
  <middle_subtasks>Implementation steps</middle_subtasks>
  <final_subtask>Verify all tests pass</final_subtask>
</typical_task_structure>

<execution_order>
  <subtask_1_tests>
    IF sub-task 1 is "Write tests for [feature]":
      - Write all tests for the parent feature
      - Include unit tests, integration tests, edge cases
      - Run tests to ensure they fail appropriately
      - Mark sub-task 1 complete
  </subtask_1_tests>

  <middle_subtasks_implementation>
    FOR each implementation sub-task (2 through n-1):
      - Implement the specific functionality
      - Make relevant tests pass
      - Update any adjacent/related tests if needed
      - Refactor while keeping tests green
      - Mark sub-task complete
  </middle_subtasks_implementation>

  <final_subtask_verification>
    IF final sub-task is "Verify all tests pass":
      - Run entire test suite
      - Fix any remaining failures
      - Ensure no regressions
      - Mark final sub-task complete
  </final_subtask_verification>
</execution_order>

<test_management>
  <new_tests>
    - Written in first sub-task
    - Cover all aspects of parent feature
    - Include edge cases and error handling
  </new_tests>
  <test_updates>
    - Made during implementation sub-tasks
    - Update expectations for changed behavior
    - Maintain backward compatibility
  </test_updates>
</test_management>

<instructions>
  ACTION: Execute sub-tasks in their defined order
  RECOGNIZE: First sub-task typically writes all tests
  IMPLEMENT: Middle sub-tasks build functionality
  VERIFY: Final sub-task ensures all tests pass
  UPDATE: Mark each sub-task complete as finished
</instructions>

</step>

<step number="6" subagent="test-runner" name="task_test_verification">

### Step 6: Task-Specific Test Verification

Use the test-runner subagent to run and verify only the tests specific to this parent task (not the full test suite) to ensure the feature is working correctly. For browser-visible changes, the test-runner should coordinate with external-delegator to run a minimal `Playwright MCP` check (navigate, assert text/element).

<focused_test_execution>
  <run_only>
    - All new tests written for this parent task
    - All tests updated during this task
    - Tests directly related to this feature
  </run_only>
  <skip>
    - Full test suite (done later in execute-tasks.md)
    - Unrelated test files
  </skip>
</focused_test_execution>

<final_verification>
  IF any test failures:
    - Debug and fix the specific issue
    - Re-run only the failed tests
  ELSE:
    - Confirm all task tests passing
    - Ready to proceed
</final_verification>

<instructions>
  ACTION: Use test-runner subagent
  REQUEST: "Run tests for [this parent task's test files]"
  WAIT: For test-runner analysis
  PROCESS: Returned failure information
  VERIFY: 100% pass rate for task-specific tests
  CONFIRM: This feature's tests are complete
</instructions>

</step>

<step number="7" subagent="project-manager" name="task_status_updates">

### Step 7: Mark this task and sub-tasks complete

Use the project-manager subagent to mark this task and its sub-tasks complete by updating each task checkbox to [x] in tasks.md.

<update_format>
  <completed>- [x] Task description</completed>
  <incomplete>- [ ] Task description</incomplete>
  <blocked>
    - [ ] Task description
    ⚠️ Blocking issue: [DESCRIPTION]
  </blocked>
</update_format>

<blocking_criteria>
  <attempts>maximum 3 different approaches</attempts>
  <action>document blocking issue</action>
  <emoji>⚠️</emoji>
</blocking_criteria>

<instructions>
  ACTION: Update tasks.md after each task completion
  MARK: [x] for completed items immediately
  DOCUMENT: Blocking issues with ⚠️ emoji
  LIMIT: 3 attempts before marking as blocked
</instructions>

</step>

</process_flow>

<post_flight_check>
  EXECUTE: @.agent-os/instructions/meta/post-flight.md
</post_flight_check>
