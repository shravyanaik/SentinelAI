# SentinelAI — Agent Safety Console

### 🚀 Live Demo
Try SentinelAI here: https://sentinelai-demo1.onrender.com

Note: This is a demonstration project. Actions are simulated and should not be treated as a production security system.


**Problem statement:** PS 2.1 — AI Agent Safety and Control

SentinelAI is a beginner-friendly hackathon prototype that demonstrates a safety layer between a hypothetical AI agent and the tools it might request. It evaluates proposed actions and returns one of three decisions: **ALLOW**, **BLOCK**, or **REQUIRE HUMAN APPROVAL**.

> **Simulation only:** this prototype is not connected to a real AI agent and does not send emails, delete files, transfer funds, or modify external systems. It evaluates text inputs against deterministic Python rules.

## Features

- Responsive cybersecurity dashboard with decision counters.
- Action simulator with Safe Action, Sensitive Data, and High-Impact Action presets.
- Python/Flask policy engine with deterministic rules.
- JSON API for action evaluation, audit-log retrieval, and health status.
- In-session audit log that updates alongside the dashboard counters.
- Input validation and user-friendly error messages.
- No API keys, paid services, or database setup required.

## Policy rules implemented

Rules are evaluated in this order:

1. **High-Impact Action Review:** actions containing phrases such as `delete all`, `drop database`, `change permissions`, or `transfer funds` return `REQUIRE HUMAN APPROVAL`.
2. **Sensitive Data Protection:** confidential/customer/personal/credential-related data directed to a destination containing hints such as `unknown`, `external`, `unapproved`, `public paste`, or `personal email` returns `BLOCK`.
3. **Destination Verification:** a destination that appears unapproved or external returns `REQUIRE HUMAN APPROVAL`.
4. **Sensitive data review:** sensitive data that does not trigger the block rule returns `REQUIRE HUMAN APPROVAL`.
5. Otherwise, the action returns `ALLOW`.

These are intentionally simple keyword-based demo rules, not a production-grade security policy. The dashboard explains the same rules at a high level.

## Technologies

- HTML, CSS, JavaScript
- Python 3
- Flask

## Requirements

- Windows 10/11
- Python 3.10 or newer (Python 3.11+ recommended)
- VS Code (recommended)

## Run on Windows (PowerShell)

### 1. Extract and open the folder

1. Download and extract `SentinelAI_Demo_Website.zip`.
2. Open VS Code.
3. Select **File → Open Folder** and choose the extracted `SentinelAI_Demo_Website` folder.
4. In VS Code, select **Terminal → New Terminal**.

Make sure the terminal is inside the project folder. The path should end in `SentinelAI_Demo_Website`.

### 2. Create a virtual environment

Run these commands in the VS Code PowerShell terminal, one at a time:

```powershell
py --version
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If `py` is not recognized, install Python from https://www.python.org/downloads/ and select **Add Python to PATH** during setup. Close and reopen VS Code after installing.

If PowerShell says script execution is disabled, run this command for the current terminal session only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate again:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Flask

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 4. Start the website

```powershell
python app.py
```

Keep this terminal open while demonstrating the site. Flask will show a local address similar to `http://127.0.0.1:5000`.

### 5. Open in your browser

Open **http://127.0.0.1:5000** in Chrome or Edge. Click each scenario preset and then **Evaluate action**.

To stop the server, return to the terminal and press `Ctrl+C`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Confirms that the Flask backend is running |
| `POST` | `/api/evaluate` | Validates an action, evaluates policies, and records the decision |
| `GET` | `/api/logs` | Returns the current session's audit log as JSON |

Example request body for `POST /api/evaluate`:

```json
{
  "action": "Read public weather data",
  "resource": "Public weather API",
  "sensitivity": "Public",
  "destination": "public_weather_api"
}
```

## Test checklist

- [ ] **Safe Action:** `Read public weather data` / `Public weather API` / `Public` / `public_weather_api` → `ALLOW`.
- [ ] **Sensitive Data:** `Send customer data by email` / `Confidential customer records` / `Confidential` / `unknown.external@example.com` → `BLOCK`.
- [ ] **High-Impact Action:** `Delete all records` / `Production database` / `Internal` / `approved_internal_system` → `REQUIRE HUMAN APPROVAL`.
- [ ] Confirm the decision reason appears below the form.
- [ ] Confirm the total and category counters update.
- [ ] Confirm a new row appears in the audit log.
- [ ] Try submitting an empty field and confirm validation prevents an empty request.

## Audit log behavior

Audit entries are held in server memory, with the latest 100 entries retained. **The log resets when the Flask server restarts.** This is intentional to keep setup simple; no generated database file is needed.

## GitHub upload

Create a repository on GitHub named `SentinelAI` (do not initialize it with a README if you plan to push this folder's README). Then run these commands from the project folder, replacing the URL with your own repository URL:

```powershell
git init
git add .
git commit -m "Build SentinelAI safety console prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/SentinelAI.git
git push -u origin main
```

Suggested repository description:

> SentinelAI is a Flask-based AI-agent safety and control prototype that evaluates proposed actions with deterministic policies and records decisions in a live demo audit log.

Do not commit `.venv`, secrets, passwords, or generated databases. The included `.gitignore` excludes common local files. These commands prepare the project for upload; they do not upload it on your behalf.

## Limitations and future work

- Keyword-based deterministic rules can miss context and can flag harmless text.
- No real AI agent, tools, identity provider, or external integrations are connected.
- “Human approval” is a decision outcome in the demo, not a real approval workflow.
- Audit logs are in memory and reset on server restart.
- No persistent database, user authentication, role management, or production security hardening is included.
- A production version would need structured action schemas, destination allowlists, robust policy evaluation, authentication, durable audit storage, and explicit enforcement before tool execution.
