# Ollama on macOS

Official docs: [docs.ollama.com/macos](https://docs.ollama.com/macos) · [ollama.com/download](https://ollama.com/download)

**Requirements:** macOS 14 Sonoma or newer · Apple Silicon (Metal) or Intel (CPU).

## Search before install

```bash
command -v ollama
test -d /Applications/Ollama.app && echo "Ollama.app present"
readlink /usr/local/bin/ollama 2>/dev/null
pgrep -x Ollama || pgrep -x ollama
```

CLI after install: `/usr/local/bin/ollama` → `Ollama.app/Contents/Resources/ollama`.

## Install

**Recommended** (installs the app, symlinks CLI, starts the server):

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Skip auto-start: `OLLAMA_NO_START=1 curl -fsSL https://ollama.com/install.sh | sh`

**Or** mount [Ollama.dmg](https://ollama.com/download/Ollama.dmg) and drag **Ollama** to `/Applications`. On first launch, allow the CLI link in `/usr/local/bin` when prompted.

Models and config: `~/.ollama` (ensure enough disk space for pulled models).

## Start / restart

The install script runs `open -a Ollama --args hidden`. To start manually:

```bash
open -a Ollama
```

Or from the menu bar icon. Decline “Move to Applications?” if you installed outside `/Applications`.

## Verify API

```bash
curl -s http://127.0.0.1:11434/api/tags
ollama list
ollama -v
```

## Pull and test

```bash
ollama pull llama3.2
export OLLAMA_HOST=http://127.0.0.1:11434
export OLLAMA_MODEL=llama3.2
npm run test:run
```

## Warm-up (prefer API over `ollama run`)

First inference loads Metal / memory (1–3 min on Apple Silicon). Warm via the generate API:

```bash
curl -s http://127.0.0.1:11434/api/generate \
  -d '{"model":"llama3.2","prompt":"ping","stream":false}'
ollama ps
```

`PROCESSOR` shows GPU usage when the model is loaded. Smaller model: `llama3.2:1b`.
