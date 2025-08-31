# Terraform Plan (DigitalOcean + Wasabi)

Providers
- DigitalOcean (droplets, managed DB/Redis, VPC, firewalls, DNS)
- AWS (Wasabi S3-compatible via custom endpoints)

Resources
- DO VPC, firewalls, droplets: web, worker (asg), edge
- Managed Postgres, Managed Redis
- DNS records: app, api, edge
- Wasabi buckets: masters, previews, staging, docs, backups
- IAM users/policies: uploader, promoter, gpu-writer, edge-reader, backup-writer, docs-writer

Outputs
- Service IPs/hostnames; bucket names; IAM keys (stored in DO secrets)

Acceptance
- `terraform plan` shows create; `terraform apply` provisions in sandbox (later)
