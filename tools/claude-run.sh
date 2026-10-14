#!/bin/bash
# uso: claude-run.sh <modello> <effort> <brief> <uscita>   (Claude nativo, niente strumenti, risposta solo testo)
for v in $(env | grep -o '^ANTHROPIC_[A-Z_]*'); do unset $v; done
export CLAUDE_ROUTE_GUARD=1
exec claude -p --model "$1" --effort "$2" --tools "" < "$3" > "$4" 2> "$4.err"
