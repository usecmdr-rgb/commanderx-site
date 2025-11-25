# Commands to Deploy to Vercel

Run these commands in order:

```bash
# 1. Add all changes
git add .

# 2. Commit with a message
git commit -m "Update Aloha UI and add contact memory features"

# 3. Push to GitHub (Vercel will auto-deploy)
git push origin main
```

If you want to see what will be committed first:

```bash
# Check status
git status

# See what files changed
git diff --cached
```

After pushing, Vercel will automatically detect the changes and deploy.

