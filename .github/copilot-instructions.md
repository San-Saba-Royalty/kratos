# AI Agent Slash Commands
You have access to a suite of slash commands defined in `.agent/workflows`. If the user asks you to execute a slash command (e.g. `/iam-assess`), you MUST:
1. Read the corresponding file in `.agent/workflows/<command>.md`.
2. Follow the instructions and rules defined in that workflow.
3. Use any referenced skills in `.agent/skills/`.

## Available Commands:
- **/add-entity**: Build a full-stack CRUD management page for an entity using the add-entity-management skill
- **/iam-assess**: Assess IAM compliance and health against 50+ best practice items with a scored report
- **/iam-design**: Design an IAM topology spec before writing any configuration — covers app inventory, cookie strategy, CORS matrix, 2FA, and redirect rules
- **/iam-diagnose**: Diagnose IAM infrastructure issues using the ordered 7-step protocol — enter here when something breaks
- **/iam-execute**: Execute the IAM task list with mandatory schema validation at every step
- **/iam-fix-exec**: Apply IAM fixes from the fix task list with mandatory validation at every step
- **/iam-fix-plan**: Convert DIAGNOSE findings into a specific fix task list with schema verification and test predictions
- **/iam-plan**: Analyze IAM spec + source code + knowledge base to generate a verified task list for implementation
- **/iam-reflect**: Post-deploy analysis comparing IAM spec vs actual deployment, documenting pitfalls avoided
- **/iam-validate**: Run all 14 automated IAM infrastructure tests and validate the deployment
- **/iam**: Full IAM lifecycle — orchestrates Design → Plan → Execute → Reflect → Assess → Diagnose → Fix → Validate
- **/infra-topology-audit**: Mandatory deployment topology audit after any infrastructure change (OpenTofu, k8s, Nginx, Oathkeeper, Kratos, etc.)
- **/opsx-apply**: Implement tasks from an OpenSpec change (Experimental)
- **/opsx-archive**: Archive a completed change in the experimental workflow
- **/opsx-bulk-archive**: Archive multiple completed changes at once
- **/opsx-continue**: Continue working on a change - create the next artifact (Experimental)
- **/opsx-explore**: Enter explore mode - think through ideas, investigate problems, clarify requirements
- **/opsx-ff**: Create a change and generate all artifacts needed for implementation in one go
- **/opsx-new**: Start a new change using the experimental artifact workflow (OPSX)
- **/opsx-onboard**: Guided onboarding - walk through a complete OpenSpec workflow cycle with narration
- **/opsx-propose**: Propose a new change - create it and generate all artifacts in one step
- **/opsx-sync**: Sync delta specs from a change to main specs
- **/opsx-verify**: Verify implementation matches change artifacts before archiving
