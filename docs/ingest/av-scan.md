# AV Scan (Staging)

Purpose
- Prevent malicious uploads; basic safety before promotion.

Tools
- ClamAV daemon in sidecar; scan object after upload completion.

Policy
- Blocklist executables/archives unless explicitly allowed; scan results stored on promotion record.
