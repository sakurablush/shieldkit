# Ollama on Linux

Official docs: [docs.ollama.com/linux](https://docs.ollama.com/linux)

## Search before install

```bash
command -v ollama
which ollama
ollama -v 2>/dev/null
systemctl is-active ollama 2>/dev/null
pgrep -x ollama
```

Binary after install: `/usr/bin/ollama` (install script or manual `.tar.zst` extract to `/usr`).

## Install (recommended)

The install script detects architecture, installs binaries, and configures a **systemd** service:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Pin a version (optional):

```bash
curl -fsSL https://ollama.com/install.sh | OLLAMA_VERSION=0.5.7 sh
```

Or [ollama.com/download/linux](https://ollama.com/download/linux).

### Manual install (amd64)

When upgrading, remove old libraries first: `sudo rm -rf /usr/lib/ollama`.

```bash
curl -fsSL https://ollama.com/download/ollama-linux-amd64.tar.zst \
  | sudo tar x -C /usr
```

**ARM64:** `ollama-linux-arm64.tar.zst` · **AMD GPU (ROCm):** also extract `ollama-linux-amd64-rocm.tar.zst` — see [Linux docs](https://docs.ollama.com/linux).

Start manually if not using systemd:

```bash
ollama serve
```

## Service (after install script)

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

Logs: `journalctl -e -u ollama`

Customize env (e.g. `OLLAMA_DEBUG=1`): `sudo systemctl edit ollama`

## Verify API

```bash
curl -s http://127.0.0.1:11434/api/tags
ollama list
ollama -v
```

NVIDIA GPU (optional): `nvidia-smi` before first model load.

## Pull and test

```bash
ollama pull llama3.2
export OLLAMA_HOST=http://127.0.0.1:11434
export OLLAMA_MODEL=llama3.2
npm run test:run
```

## Warm-up (prefer API over `ollama run`)

First load can take 1–3 minutes on GPU. Warm via the generate API (reliable in scripts):

```bash
curl -s http://127.0.0.1:11434/api/generate \
  -d '{"model":"llama3.2","prompt":"ping","stream":false}'
ollama ps
```

`PROCESSOR` shows GPU % when the model is loaded (NVIDIA/AMD). CPU-only fallback: `OLLAMA_NUM_GPU=0`.
