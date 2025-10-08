# GitHub Actions Setup for Automated Content Generation

This document explains how to set up GitHub Actions to automate your content generation process, replacing the need for local cron jobs.

## Overview

The GitHub Actions workflow will:
1. Run automatically every day at 9 AM UTC (configurable)
2. Execute your scraping scripts (Elle and Compramejor)
3. Generate MDX content using OpenAI
4. Build the site
5. Commit and push changes automatically
6. Trigger deployment (if using Vercel/Netlify)

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. Navigate to Repository Settings
- Go to your GitHub repository
- Click on **Settings** tab
- In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Required Secrets

Click **New repository secret** for each of the following:

#### Essential Secrets:
- **Name:** `OPENAI_API_KEY`
  - **Value:** Your OpenAI API key (starts with `sk-`)
  - **Description:** Required for content generation using GPT

#### Optional Secrets (add if your scripts use them):
- **Name:** `GITHUB_TOKEN`
  - **Value:** This is automatically provided by GitHub Actions
  - **Description:** Used for committing changes back to the repository

#### Additional Secrets (if needed by your scraping scripts):
- **Name:** `USER_AGENT`
  - **Value:** Custom user agent string for web scraping
- **Name:** `PROXY_URL`
  - **Value:** Proxy URL if your scraping requires it
- **Name:** `RATE_LIMIT_DELAY`
  - **Value:** Delay between requests in milliseconds

## Workflow Configuration

The workflow is configured in `.github/workflows/content-generation.yml` with the following features:

### Schedule
```yaml
schedule:
  - cron: '0 9 * * *'  # Daily at 9 AM UTC
```

**To change the schedule:**
- Modify the cron expression
- Use [crontab.guru](https://crontab.guru/) to generate custom schedules
- Examples:
  - `'0 */6 * * *'` - Every 6 hours
  - `'0 9 * * 1-5'` - Weekdays only at 9 AM
  - `'0 9,21 * * *'` - Twice daily at 9 AM and 9 PM

### Manual Triggering
The workflow can also be triggered manually:
- Go to **Actions** tab in your repository
- Select **Automated Content Generation**
- Click **Run workflow**

## Environment Variables in Workflow

The workflow sets up the following environment variables:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  NODE_ENV: production
```

## Workflow Steps Explained

1. **Checkout repository** - Downloads your code
2. **Setup Node.js** - Installs Node.js 18 with npm caching
3. **Install dependencies** - Runs `npm ci` for main project and subdirectories
4. **Install Playwright browsers** - Sets up browser automation for scraping
5. **Run content generation** - Executes your `autoRunner.js` script
6. **Build site** - Runs `npm run build` if new content was generated
7. **Commit and push changes** - Automatically commits new content
8. **Deploy** - Triggers deployment (automatic with most hosting providers)

## Monitoring and Debugging

### View Workflow Runs
- Go to **Actions** tab in your repository
- Click on any workflow run to see detailed logs
- Each step shows its output and any errors

### Common Issues and Solutions

#### 1. OpenAI API Key Issues
- **Error:** `Invalid API key`
- **Solution:** Verify the `OPENAI_API_KEY` secret is correctly set

#### 2. Build Failures
- **Error:** Build step fails
- **Solution:** Check if all dependencies are properly listed in `package.json`

#### 3. No Changes Committed
- **Info:** This is normal if no new content was generated
- **Note:** The workflow will skip building if no changes are detected

#### 4. Playwright Browser Issues
- **Error:** Browser installation fails
- **Solution:** The workflow includes `npx playwright install-deps` to handle this

### Logs and Debugging
- All output from your `autoRunner.js` script will appear in the GitHub Actions logs
- The workflow creates a `logs/` directory for any additional logging
- Failed runs will show detailed error messages

## Benefits of GitHub Actions vs Local Cron

✅ **Advantages:**
- No need to keep your local machine running
- Automatic dependency management
- Built-in logging and monitoring
- Easy to modify schedule
- Runs in a clean environment every time
- Free for public repositories (2000 minutes/month for private)

⚠️ **Considerations:**
- Requires internet connection for your repository
- GitHub Actions has usage limits (usually sufficient for this use case)
- Runs in UTC timezone (adjust cron schedule accordingly)

## Next Steps

1. **Add the required secrets** to your GitHub repository
2. **Push the workflow file** to your repository
3. **Test the workflow** by triggering it manually
4. **Monitor the first few runs** to ensure everything works correctly
5. **Adjust the schedule** if needed

## Customization

You can customize the workflow by editing `.github/workflows/content-generation.yml`:

- Change the Node.js version
- Modify the cron schedule
- Add additional environment variables
- Include notification steps (Slack, email, etc.)
- Add deployment steps for specific hosting providers

## Support

If you encounter issues:
1. Check the GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly configured
3. Test your scripts locally to ensure they work independently
4. Review the workflow file for any syntax errors
