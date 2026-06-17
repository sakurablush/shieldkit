# Ollama on Windows

Official docs: [ollama.com/download/windows](https://ollama.com/download/windows)

## Search before install

```powershell
where.exe ollama
Get-Command ollama -All -ErrorAction SilentlyContinue
Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
Test-Path "C:\Program Files\Ollama\ollama.exe"
Get-Process ollama -ErrorAction SilentlyContinue
```

## Install

```powershell
winget install Ollama.Ollama
```

Or [ollama.com/download/windows](https://ollama.com/download/windows).

Binary: `%LOCALAPPDATA%\Programs\Ollama\ollama.exe`

## Session PATH

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\Ollama;" + $env:PATH
```

## Verify API

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:11434/api/tags" -UseBasicParsing
ollama list
```

## Pull and test

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\Ollama;" + $env:PATH
ollama pull llama3.2
$env:OLLAMA_HOST = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "llama3.2"
npm run test:run
```

## Warm-up (prefer API over `ollama run`)

`ollama run` can hang without output in non-interactive shells. Use the generate API:

```powershell
$body = '{"model":"llama3.2","prompt":"ping","stream":false}'
Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method POST -Body $body -ContentType "application/json"
ollama ps
```

`PROCESSOR` shows `100% GPU` when loaded on GPU (e.g. RTX 3050).
