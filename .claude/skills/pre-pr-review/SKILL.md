---
name: pre-pr-review
description: Review a branch before its pull request is opened or updated. Use whenever a PR or merge request is about to be created, pushed or marked ready, or the user asks "can we open the PR", "make a PR", "push this", even when they do not mention a review.
---

# Before a pull request

No pull request is opened, and no branch is pushed for one, until these steps
pass. A step that fails is fixed on the branch, not noted for later.

1. **Checks.** `npm run lint`, `npm run typecheck`, `npm test`,
   `npm run build`, `npm run check:size`, `npm run knip`, and
   `npm run test:pw:docker` (functional specs and screenshots). If the branch
   changes pixels on purpose, regenerate baselines in Docker and look at every
   changed PNG before committing them.
2. **Simplify.** Run the `simplify` skill on the branch's changes and apply
   what it finds, so the review sees the simplest form of the code. Rerun the
   checks if it changed anything.
3. **Code review.** Run the `code-review` skill on the branch against its base
   (`master` unless the PR targets another branch), at `high` effort or above
   for a branch of more than a few commits. Fix every confirmed finding on the
   branch; for a finding left as is, say why in the PR description.
4. **Comments.** Go through the diff's comments with the rule in `AGENTS.md`
   (Conventions, "Comments"): delete any that restate the code, narrate
   history, or would not change what a reader does. Keep only non-obvious
   whys, one line each.
5. **Commits.** Author is the repo's configured git identity; no
   `Co-Authored-By` or "Generated with" lines.

Then open the PR. Its description lists what changed by area, how it was
verified (the commands above and their results), and what is deliberately
left for later.
