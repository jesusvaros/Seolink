# Amazon Affiliate Cron Jobs

This project sets up automated cron jobs using Vercel to run the Amazon affiliate scraping and MDX generation scripts at scheduled intervals.

## How It Works

1. The first cron job runs daily at midnight (00:00) to execute the Elle scraping script
2. The second cron job runs daily at 1:00 AM to execute the MDX generation script (1 hour after scraping)

## Deployment Instructions

### Prerequisites

1. Install the Vercel CLI:
```bash
npm i -g vercel
```

2. Log in to Vercel:
```bash
vercel login
```

### Setting Up Environment Variables

Create a secret for securing the cron endpoint:

```bash
vercel secrets add cron_secret your-secret-value-here
```

### Deploying to Vercel

From the `vercel-cron` directory, run:

```bash
vercel
```

Follow the prompts to link to your Vercel project.

### Verifying Deployment

After deployment, your cron jobs will be automatically scheduled according to the configuration in `vercel.json`.

You can verify the cron jobs in the Vercel dashboard under Project Settings > Cron Jobs.

## Testing the Endpoints

You can manually trigger the cron jobs by visiting:

- Scraping: `https://your-vercel-deployment.vercel.app/api/cron?task=scrape`
- MDX Generation: `https://your-vercel-deployment.vercel.app/api/cron?task=mdx`

Remember to include the authorization header:
```
Authorization: Bearer your-secret-value-here
```

## Troubleshooting

- Check the Vercel logs for any errors in the execution of the cron jobs
- Ensure that all dependencies are correctly specified in `package.json`
- Verify that the paths to the scripts are correct in `api/cron.js`
