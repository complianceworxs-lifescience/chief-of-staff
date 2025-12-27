#!/bin/bash
# Deployment verification script - blocks replit-auth references
# This script will fail the build if any Replit Auth references remain

echo "🔍 Verifying no Replit Auth references remain..."

# Check for replit-auth references
REPLIT_AUTH_REFS=$(grep -r "replit-auth\|replitAuth\|requireAuth\|replit_integrations/auth" --include="*.ts" --include="*.tsx" --include="*.js" server/ client/src/ 2>/dev/null | grep -v node_modules | grep -v ".git")

if [ -n "$REPLIT_AUTH_REFS" ]; then
    echo "❌ DEPLOYMENT BLOCKED: Replit Auth references found!"
    echo "$REPLIT_AUTH_REFS"
    echo ""
    echo "Please remove all Replit Auth references before deploying."
    exit 1
fi

echo "✅ No Replit Auth references found - deployment allowed"
exit 0
