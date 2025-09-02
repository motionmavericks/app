#!/bin/bash

# Media Asset Management - Production Secrets Generator
# This script generates cryptographically secure secrets for production deployment

set -e

echo "🔐 Generating Production Secrets for Media Asset Management System"
echo "=================================================================="

# Function to generate secure random hex string
generate_hex_secret() {
    local length=$1
    openssl rand -hex $length
}

# Function to generate secure random base64 string
generate_base64_secret() {
    local bytes=$1
    openssl rand -base64 $bytes | tr -d '\n'
}

# Function to generate secure password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d '\n' | cut -c1-$length
}

echo ""
echo "📝 Generated Secrets (SAVE THESE SECURELY!):"
echo "============================================="

echo ""
echo "# Database Secrets"
echo "DB_PASSWORD=$(generate_password 24)"

echo ""
echo "# JWT & Authentication Secrets"
echo "JWT_SECRET=$(generate_hex_secret 32)"
echo "COOKIE_SECRET=$(generate_hex_secret 32)"

echo ""
echo "# HMAC & Signing Secrets"
echo "EDGE_SIGNING_KEY=$(generate_hex_secret 32)"
echo "HMAC_SECRET=$(generate_hex_secret 32)"

echo ""
echo "# Session Secrets"
echo "SESSION_SECRET=$(generate_hex_secret 32)"

echo ""
echo "# Encryption Keys"
echo "ENCRYPTION_KEY=$(generate_hex_secret 32)"
echo "BACKUP_ENCRYPTION_KEY=$(generate_hex_secret 32)"

echo ""
echo "# API Keys (Generate these from your providers)"
echo "# Replace these with your actual Wasabi/S3 credentials:"
echo "WASABI_STAGING_ACCESS_KEY=YOUR_STAGING_ACCESS_KEY"
echo "WASABI_STAGING_SECRET=YOUR_STAGING_SECRET_KEY"
echo "WASABI_MASTERS_ACCESS_KEY=YOUR_MASTERS_ACCESS_KEY"
echo "WASABI_MASTERS_SECRET=YOUR_MASTERS_SECRET_KEY"
echo "WASABI_PREVIEWS_ACCESS_KEY=YOUR_PREVIEWS_ACCESS_KEY"
echo "WASABI_PREVIEWS_SECRET=YOUR_PREVIEWS_SECRET_KEY"

echo ""
echo "# Database Admin Password"
echo "POSTGRES_ADMIN_PASSWORD=$(generate_password 32)"

echo ""
echo "🔒 Security Recommendations:"
echo "=============================="
echo "1. Store these secrets in a secure password manager"
echo "2. Use environment-specific secrets (staging vs production)"
echo "3. Rotate secrets regularly (quarterly recommended)"
echo "4. Never commit secrets to version control"
echo "5. Use DigitalOcean's App Platform environment variables"
echo "6. Enable audit logging for secret access"
echo "7. Set up monitoring for failed authentication attempts"

echo ""
echo "📋 Next Steps:"
echo "==============="
echo "1. Update .env.production with these generated secrets"
echo "2. Configure DigitalOcean App Platform environment variables"
echo "3. Set up Wasabi/S3 buckets with proper IAM policies"
echo "4. Configure SSL certificates for your domain"
echo "5. Set up monitoring and alerting"

echo ""
echo "✅ Secret generation complete!"
echo ""
echo "⚠️  WARNING: These secrets provide full access to your system."
echo "    Treat them with the same care as root passwords!"

