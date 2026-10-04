# MEMORY

- [FLAGGED] 2026-08-03 14:54 PDT | Track tag: project development | `MEMORY.md` was missing at session start even though `Agents.md` requires reading active memory entries. Learned that the harness needs a baseline memory file before future Alfred/Nate continuity workflows can run cleanly. Affected workflow/tool: session-continuity startup.
- [RESOLVED] 2026-09-12 PDT | Track tag: project development | Profile autosave and explicit saves previously used independent cloud writes, allowing an older request to finish after a newer state change and report a misleading save result. All profile mutations now use a serialized per-user coordinator, latest-state checks, and reset waits for pending writes before cloud deletion. Affected workflow/tool: Supabase profile persistence.
