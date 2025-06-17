export const metadata = {
  title: 'Amazon Afiliados Cron Jobs',
  description: 'Scheduled jobs for Amazon affiliate scraping and MDX generation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
