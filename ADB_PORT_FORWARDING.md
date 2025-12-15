# ADB Port Forwarding Setup - Quick Reference

## Problem
After repository restructuring, the Android app couldn't connect to the backend API.

## Root Cause
ADB reverse port forwarding was not set up, so the Android emulator's `localhost:8000` didn't route to the Mac's backend server.

## Solution

### Quick Fix (Manual)
```bash
adb reverse tcp:8000 tcp:8000
```

### Permanent Fix
The `restart-all.sh` script now automatically sets up port forwarding during startup.

### Helper Script
```bash
./setup-adb-forwarding.sh
```
Use this script anytime you need to manually setup port forwarding (e.g., after emulator restart).

## Verification

Check if port forwarding is active:
```bash
adb reverse --list
```

Expected output:
```
tcp:8000 tcp:8000
```

## Troubleshooting

### If app still can't connect:

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check port forwarding:**
   ```bash
   adb reverse --list
   ```

3. **Re-setup port forwarding:**
   ```bash
   adb reverse --remove-all
   adb reverse tcp:8000 tcp:8000
   ```

4. **Check ADB logs for errors:**
   ```bash
   adb logcat | grep -E "(error|Error|ERROR|failed|Failed)"
   ```

5. **Restart emulator:**
   ```bash
   adb reboot
   # Wait for boot, then re-run:
   adb reverse tcp:8000 tcp:8000
   ```

## Why This Happens

- ADB reverse port forwarding is **not persistent** across emulator restarts
- It must be set up each time the emulator starts
- The `restart-all.sh` script now handles this automatically
- If you manually start the emulator, run `./setup-adb-forwarding.sh`

## Port Details

| Port | Service | Access From |
|------|---------|-------------|
| 8000 | Backend API | Mac: `http://localhost:8000`<br>Android: `http://localhost:8000` (via ADB reverse) |
| 10.0.2.2:8000 | Backend API | Android: Alternative IP (emulator host loopback) |

## Note
The app is configured to use `http://localhost:8000`. With ADB reverse, this works seamlessly without code changes.
