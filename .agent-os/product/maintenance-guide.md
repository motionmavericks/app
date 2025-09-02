# Documentation Maintenance Guide

> Last Updated: 2025-09-02
> Version: 1.0.0
> Agent OS Integration: Process Documentation

## Purpose

This guide provides clear procedures for maintaining and updating the Agent OS product documentation to ensure it remains accurate, comprehensive, and useful for both human developers and AI agents.

## Maintenance Responsibilities

### Primary Maintainers
- **Tech Lead**: Updates to `tech-stack.md` and `decisions.md`
- **Product Owner**: Updates to `mission.md` and `roadmap.md`
- **Documentation Lead**: Overall structure and cross-references

### Contributing Developers
- **All Team Members**: Updates to sections affected by their changes
- **AI Agents**: Updates as directed by human maintainers

## Update Triggers

### When to Update Documentation

#### `mission.md`
- Product vision or mission changes
- New user personas identified
- Competitive landscape shifts
- Success metrics evolve

#### `mission-lite.md`
- Any changes to `mission.md` that affect AI context
- Simplification of complex concepts for AI consumption

#### `tech-stack.md`
- Technology upgrades or replacements
- New service additions
- Infrastructure changes
- Dependency updates
- MCP tool integration or updates

#### `roadmap.md`
- Phase completion or initiation
- Feature addition or removal
- Timeline adjustments
- Effort estimation updates

#### `decisions.md`
- New architectural decisions
- Decision status changes (Proposed → Accepted, etc.)
- Decision deprecation or superseding
- Validation metric updates

#### `cross-reference.md`
- New cross-references identified
- Documentation structure changes
- Implementation file reorganization

#### `mcp-tools-guide.md`
- New MCP tools added
- Existing MCP tool capabilities updated
- MCP usage patterns evolved
- Security or operations guidelines changed

## Update Procedures

### 1. New Feature Implementation
```
When implementing a new feature:
1. Check if it affects the roadmap - update `roadmap.md`
2. Check if it requires architectural decisions - update `decisions.md`
3. Check if it changes the tech stack - update `tech-stack.md`
4. Update cross-references in `cross-reference.md`
5. Update relevant service documentation
6. Consider MCP tool integration opportunities
```

### 2. MCP Tool Integration
```
When integrating new MCP tools or updating existing ones:
1. Update `.mcp.json` configuration
2. Document tool capabilities in `standards/best-practices.md`
3. Update relevant sections in `tech-stack.md`
4. Add cross-references in `cross-reference.md`
5. Update deployment and testing procedures as needed
```

### 2. Bug Fix or Refactor
```
When fixing bugs or refactoring:
1. If architectural changes, update `decisions.md`
2. If tech stack affected, update `tech-stack.md`
3. Update cross-references if implementation files change
4. Update service-specific documentation
```

### 3. Phase Completion
```
When completing a roadmap phase:
1. Mark features as complete in `roadmap.md`
2. Update success metrics if available
3. Add any new architectural decisions to `decisions.md`
4. Update `mission.md` if current status changes
5. Update cross-references as needed
```

## Review Process

### Regular Reviews
- **Monthly**: Quick scan of all documentation for accuracy
- **Quarterly**: Comprehensive review of all documents
- **Annually**: Full audit and restructuring if needed

### Review Checklist
- [ ] All links and cross-references are valid
- [ ] Dates and versions are current
- [ ] Status indicators match actual implementation
- [ ] Technical details align with current codebase
- [ ] User personas and use cases are still relevant

### AI Agent Review
- [ ] `mission-lite.md` provides sufficient context
- [ ] `decisions.md` overrides are clear and unambiguous
- [ ] Cross-references support navigation
- [ ] Technical constraints are well-defined

## Quality Standards

### Documentation Style
- **Consistency**: Use consistent terminology and formatting
- **Clarity**: Write in clear, jargon-free language
- **Completeness**: Include all relevant information
- **Accuracy**: Ensure technical details are correct
- **MCP Alignment**: Reference appropriate MCP tools and capabilities

### Formatting Standards
- **Headers**: Use consistent header hierarchy
- **Lists**: Use consistent bullet and numbering styles
- **Code**: Use proper code formatting for technical elements
- **Links**: Use descriptive link text, not generic "click here"

### Version Control
- **Atomic Updates**: Make related changes in single commits
- **Clear Commit Messages**: Reference documentation files and changes
- **Pull Requests**: Include documentation updates with feature changes
- **Review Required**: Documentation changes require review before merge

## Agent OS Integration

### AI-Friendly Formatting
- **Structured Content**: Use consistent sections and formats
- **Explicit References**: Clearly link related concepts
- **Decision Hierarchy**: Make override priorities clear
- **Context Boundaries**: Separate different types of information

### Standards Compliance
- **Best Practices**: Follow `.agent-os/standards/best-practices.md`
- **Code Style**: Reference `.agent-os/standards/code-style.md`
- **Workflow**: Adhere to `.agent-os/standards/best-practices.md#project-workflow`

## Troubleshooting

### Common Issues
1. **Outdated Information**: Regular reviews prevent this
2. **Broken Links**: Use relative paths and verify after moves
3. **Inconsistent Terminology**: Maintain a glossary of terms
4. **Missing Cross-References**: Review related documents when making changes

### Resolution Process
1. **Identify**: Determine the scope of the issue
2. **Document**: Note the problem in the issue tracker
3. **Fix**: Make necessary updates following procedures
4. **Verify**: Confirm the fix resolves the issue
5. **Prevent**: Update processes to prevent recurrence

## Templates and Examples

### New Decision Template
```
## YYYY-MM-DD: Brief Decision Title

**ID:** DEC-XXX
**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Category:** [Architecture | Security | Performance | Product | Infrastructure]
**Stakeholders:** [List of key decision makers]
**Implementation Date:** [YYYY-MM-DD when decision was/will be implemented]
**Validation Metrics:** [Key metrics used to validate the decision]

### Decision
[Clear statement of what was decided]

### Context
[Background information that led to this decision]

### Rationale
[Reasoning behind the decision, including alternatives considered]

### Consequences
[Expected outcomes and trade-offs, both positive and negative]
[Validation approach and success criteria]
```

### New Roadmap Feature Template
```
- [ ] **Feature Name** - Brief description `Effort_Estimate`
```

### Cross-Reference Update Template
```
### Related_Concept_Name
- **Related Documents**: 
  - `document1.md` (specific section)
  - `document2.md` (specific section)
- **Implementation Files**:
  - `path/to/file1.ts`
  - `path/to/file2.ts`
```

## Communication

### Team Notifications
- **Slack Channel**: #documentation-updates
- **Email Group**: documentation-maintainers@company.com
- **Weekly Standup**: Documentation updates segment

### AI Agent Communication
- **Clear Instructions**: Specify exactly what needs updating
- **Context Provision**: Provide sufficient background for changes
- **Review Requests**: Ask for verification of changes

This maintenance guide ensures that the Agent OS product documentation remains a valuable resource for both human developers and AI agents throughout the product lifecycle.