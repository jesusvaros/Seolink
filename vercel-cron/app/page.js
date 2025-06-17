export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Amazon Afiliados Cron Jobs</h1>
      <p className="text-xl mb-4">
        This Next.js app hosts the cron jobs for Amazon affiliate scraping and MDX generation.
      </p>
      <div className="mt-8 p-6 border border-gray-300 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Scheduled Jobs:</h2>
        <ul className="list-disc pl-6">
          <li className="mb-2">
            <strong>Scraping Job:</strong> Runs every Friday at 16:00 (4:00 PM)
          </li>
          <li className="mb-2">
            <strong>MDX Generation:</strong> Runs every Friday at 17:00 (5:00 PM)
          </li>
        </ul>
      </div>
    </main>
  );
}
