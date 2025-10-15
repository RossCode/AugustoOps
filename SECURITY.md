# Security Configuration Guide

## Environment Variables

### ⚠️ IMPORTANT: Never Commit Secrets

The following files contain sensitive credentials and are **ignored by git**:
- `server/.env` - Backend secrets (database, OAuth, JWT)
- `client/.env` - Frontend configuration

These files are listed in `.gitignore` and should **never** be committed to version control.

### Setting Up Your Environment

#### 1. Server Environment (`server/.env`)

Copy the example file and fill in your actual credentials:

```bash
cd server
cp .env.example .env
```

Then edit `server/.env` with your actual values:

```env
# Database
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-actual-database-password
DB_NAME=your-database-name
DB_PORT=3306

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret

# Session/JWT Secrets
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=<generate-a-64-char-hex-string>
JWT_SECRET=<generate-another-64-char-hex-string>
```

#### 2. Client Environment (`client/.env`)

Copy the example file:

```bash
cd client
cp .env.example .env
```

Then edit `client/.env`:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:5001
```

### Generating Secure Secrets

For `SESSION_SECRET` and `JWT_SECRET`, generate cryptographically secure random strings:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command **twice** to generate two different secrets.

## Secrets Storage Recommendations

### Development
- Store secrets in `.env` files (already gitignored)
- Share secrets securely with team members via:
  - Password manager (1Password, LastPass)
  - Encrypted email
  - Secure chat (Signal, encrypted Slack)
  - **Never via unencrypted email or Slack**

### Production
Consider using a secrets management service:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**
- **Doppler**
- **Environment variables in hosting platform** (Vercel, Netlify, Railway, etc.)

## What's Safe to Commit

✅ **Safe to commit:**
- `.env.example` files (template without secrets)
- Configuration code that references environment variables
- Documentation about required environment variables

❌ **Never commit:**
- `.env` files with actual credentials
- API keys, passwords, tokens
- Database credentials
- OAuth client secrets
- JWT secrets
- Session secrets
- SSH keys
- Any file containing sensitive data

## Current Configuration

### Files in Git (Safe)
- `server/.env.example` - Template with placeholders
- `client/.env.example` - Template with placeholders
- `.gitignore` - Ensures `.env` files are not tracked

### Files NOT in Git (Contains Secrets)
- `server/.env` - Your actual backend secrets
- `client/.env` - Your actual frontend config

## Team Onboarding

When a new developer joins:

1. They clone the repository
2. They run: `cp server/.env.example server/.env`
3. They run: `cp client/.env.example client/.env`
4. Team lead shares actual credentials securely (password manager)
5. Developer fills in `server/.env` and `client/.env` with real values
6. Never commit these files

## Checking for Exposed Secrets

Before committing, verify no secrets are staged:

```bash
# Check what will be committed
git diff --staged

# Make sure .env files are not listed
git status

# Verify .env is gitignored
git check-ignore server/.env client/.env
# Should output: server/.env and client/.env
```

## If Secrets Are Accidentally Committed

If you accidentally commit secrets to git:

1. **Immediately rotate all exposed credentials**
   - Generate new Google OAuth credentials
   - Generate new JWT/Session secrets
   - Change database passwords

2. **Remove from git history**
   ```bash
   # WARNING: This rewrites history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch server/.env" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (if already pushed)
   git push origin --force --all
   ```

3. **Better approach: Consider the repository compromised**
   - Rotate all secrets immediately
   - Use git-secrets or similar tools to prevent future incidents

## Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] `.env` files contain actual secrets (not checked into git)
- [ ] `.env.example` files only contain placeholders
- [ ] Team members know how to set up environment variables
- [ ] Secrets are shared via secure channels only
- [ ] Production uses a secrets management service
- [ ] Session/JWT secrets are cryptographically random (not default values)
- [ ] Database credentials are strong and unique
- [ ] OAuth secrets are kept confidential

## Additional Resources

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [git-secrets tool](https://github.com/awslabs/git-secrets)
