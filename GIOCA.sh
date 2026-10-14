#!/bin/bash
# Apre Francy Warfront in una finestra di Chrome tutta sua, con la scheda video accesa.
# Il Chrome di tutti i giorni non viene toccato (profilo separato).
DIR="$(cd "$(dirname "$0")" && pwd)"
exec google-chrome --user-data-dir="$HOME/.cache/francywarfront-chrome" \
  --ignore-gpu-blocklist ${WF_DEBUG:+--remote-debugging-port=9444} \
  --no-first-run --no-default-browser-check --start-maximized \
  --app="file://$DIR/FrancyWarfront.html" >/dev/null 2>&1
