#!/bin/bash
# uso: agy-run.sh <modello-slug> <effort> <brief> <uscita>
P="REGOLA: rispondi direttamente in testo. Non eseguire comandi di shell (sono disattivati in questa sessione): scrivi il risultato senza provarlo. REGOLA: NON scrivere né modificare file sul disco: il codice va SOLO nella risposta.

$(cat "$3")"
exec agy -p "$P" --model "$1" --effort "$2" --print-timeout 25m --sandbox --log-file "$4.log" > "$4" 2> "$4.err"
