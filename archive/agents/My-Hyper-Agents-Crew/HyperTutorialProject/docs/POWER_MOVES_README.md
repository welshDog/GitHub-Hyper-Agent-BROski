# Power Moves: The Hyper Dashboard

This project includes a custom "Power Moves" CLI tool to manage your Hyper Infrastructure and simulate scenarios for your tutorials.

## 🚀 Launching the Dashboard

Run the following command in your terminal:

```bash
npm run power-moves
```

## 🐳 Running with Docker (Phase 1 Upgrade)

You can now run the CLI in an isolated container environment.

**Prerequisites:** Docker Desktop installed and running.

1.  **Build the container:**
    ```bash
    docker-compose build
    ```

2.  **Run the CLI:**
    ```bash
    docker-compose run --rm hyper-cli
    ```
    *   `--rm`: Automatically removes the container after you exit.
    *   It connects to your local `.env` and `config/settings.yaml`.

## ⚡ Features

### 1. 📋 Hardware Checklist
An interactive checklist to track your acquisition of the "Hyper Power Stack" (UPS, Conditioner, Cables). It saves your progress (in memory for now, but feels real!).

### 2. 🔍 System Health Check
Runs a diagnostic on your environment:
- **Configuration:** Verifies `settings.yaml` is loaded and valid.
- **Environment:** Checks if you are in `development`, `staging`, or `production`.
- **Power Telemetry:** (Simulated) Checks UPS connectivity and load.

### 3. 🚨 Power Outage Simulator
**The Ultimate Treat.**
This mode simulates a mains power failure. It is designed to be used *during* a screen recording tutorial to demonstrate how to handle emergencies or simply to add drama.
- **Visuals:** Shows a battery drain animation.
- **Graceful Shutdown:** Simulates stopping services and saving data when battery hits 20%.

### 4. 🤖 Broski Agents
Launch the multi-agent system (Researcher, Designer, Coder, etc.) to perform complex tasks.

## 🛠️ Configuration
The dashboard reads from `config/settings.yaml`. Ensure your configuration is valid before running.
