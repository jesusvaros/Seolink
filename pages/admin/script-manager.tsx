import React, { useState, useRef, useEffect } from 'react';

interface UrlStats {
  totalUrlsInSourceFiles: number;
  pendingUrlsCount: number;
  allSourceUrlsFromFiles: Array<string | { url: string }>;
  manuallySubmittedUrls: string[];
  generatedPostsCount: number;
  generatedPostsDetails: Array<{ title: string; slug: string }>;
}

const ScriptManagerPage = () => {
  const [url, setUrl] = useState('');
  const [output, setOutput] = useState('');
  const [scriptOutput, setScriptOutput] = useState('');
  const [isScriptRunning, setIsScriptRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlStats, setUrlStats] = useState<UrlStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const outputEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [scriptOutput]); // Changed from output to scriptOutput to ensure scroll on new script messages

  const fetchUrlStats = async () => {
      try {
        const response = await fetch('/api/script-runner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_url_stats' }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: UrlStats = await response.json();
        setUrlStats(data);
        setStatsError(null);
      } catch (error: any) {
        console.error('Failed to fetch URL stats:', error);
        setStatsError(error.message || 'An unknown error occurred while fetching stats.');
        setUrlStats(null);
      }
    };
  // Initial fetch of URL stats
  useEffect(() => {
    fetchUrlStats();
  }, []);

  const handleRunScript = async (action: 'scrape' | 'generate') => {
    setScriptOutput(''); // Clear previous output
    setIsScriptRunning(true);
    setIsLoading(true);
    // setOutput(`Running ${action} script...\n`); // Replaced by scriptOutput

    try {
      const response = await fetch('/api/script-runner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, url: action === 'scrape' ? url : undefined }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred', details: response.statusText }));
        setIsScriptRunning(false);
        setIsLoading(false);
        setScriptOutput(prev => prev + `\nError: ${errorData.error || 'Failed to fetch'}\nDetails: ${errorData.details || 'N/A'}\n`);
        return;
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        // Append new data to scriptOutput
        const text = decoder.decode(value, { stream: true });
        setScriptOutput(prev => {
          const newOutput = prev + text;
          // Check for script completion or critical error messages
          if (newOutput.includes('Script finished with code') || newOutput.includes('ERROR starting script:') || newOutput.includes('Error: A script is already running')) {
            setIsScriptRunning(false);
            setIsLoading(false);
            fetchUrlStats(); // Refresh stats
          }
          return newOutput;
        });
      }
      // Stream finished
      setIsScriptRunning(false);
      setIsLoading(false);
      fetchUrlStats(); // Refresh stats after script completion
    } catch (error: any) {
      setIsScriptRunning(false);
      setIsLoading(false);
      setScriptOutput(prev => prev + `\nFetch error: ${error.message}\n`);
    }
  };

  const handleInterruptScript = async () => {
    setScriptOutput(prev => prev + '\n[INFO] Sending interrupt signal...\n');
    try {
      const response = await fetch('/api/script-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kill_script' }),
      });
      const result = await response.json(); // Expecting JSON response for kill_script
      if (response.ok) {
        setScriptOutput(prev => prev + `[INFO] ${result.message || 'Interrupt signal sent.'}\n`);
      } else {
        setScriptOutput(prev => prev + `[ERROR] Failed to interrupt script: ${result.error || 'Unknown error'}\n`);
      }
    } catch (error) {
      setScriptOutput(prev => prev + `[ERROR] Error sending interrupt signal: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    // Note: isScriptRunning will be set to false by the scriptOutput listener when the script actually terminates.
    // Or if the script was already killed, the next stats update might reflect it.
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <style jsx global>{`
        body {
          background-color: #f4f7f6;
          color: #333;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50' }}>Script Manager</h1>
      </header>

      <section style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ borderBottom: '2px solid #f39c12', paddingBottom: '10px', color: '#f39c12' }}>URL Statistics</h2>
        {statsError && <p style={{ color: 'red' }}>Error loading stats: {statsError}</p>}
        {urlStats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '10px', backgroundColor: '#e8f6f3', borderRadius: '4px'}}>
              <strong>Total URLs in Source Files:</strong> {urlStats.totalUrlsInSourceFiles}
            </div>
            <div style={{ padding: '10px', backgroundColor: '#fdebd0', borderRadius: '4px'}}>
              <strong>Pending URLs:</strong> {urlStats.pendingUrlsCount}
            </div>
            <div style={{ padding: '10px', backgroundColor: '#d6eaf8', borderRadius: '4px'}}>
              <strong>Generated MDX Posts:</strong> {urlStats.generatedPostsCount}
            </div>
          </div>
        ) : (
          !statsError && <p>Loading URL statistics...</p>
        )}
      </section>
      {/* Moved URL Lists to the bottom - this comment seems out of place, URL lists are further down. Will proceed with adding Generated Posts section. */}

      {urlStats && urlStats.generatedPostsDetails && Array.isArray(urlStats.generatedPostsDetails) && urlStats.generatedPostsDetails.length > 0 && (
        <section style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ borderBottom: '2px solid #16a085', paddingBottom: '10px', color: '#16a085' }}>Generated MDX Posts ({urlStats.generatedPostsCount})</h2>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, maxHeight: '300px', overflowY: 'auto' }}>
            {urlStats.generatedPostsDetails
              .filter(post => post && typeof post === 'object')
              .map((post, index) => {
                // Extract title and slug safely
                const title = post && typeof post.title === 'string' ? post.title : 'Untitled Post';
                const slug = post && typeof post.slug === 'string' ? post.slug : '';
                
                return (
                  <li key={index} style={{ marginBottom: '8px', padding: '5px', borderBottom: '1px solid #eee' }}>
                    <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#2980b9' }}>
                      {title}
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
      
      <section style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#3498db' }}>Scrape Links</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scrape (e.g., https://www.example.com)"
            style={{ flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '300px' }}
            disabled={isLoading}
          />
          <button 
            onClick={() => handleRunScript('scrape')} 
            disabled={isLoading || !url || isScriptRunning}
            style={{ padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {isLoading ? 'Running...' : 'Run Scraper'}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px', color: '#2ecc71' }}>Generate MDX</h2>
        <button 
          onClick={() => handleRunScript('generate')} 
          disabled={isLoading || isScriptRunning}
          style={{ padding: '10px 15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isLoading ? 'Running...' : 'Run Generator'}
        </button>
        {isScriptRunning && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button onClick={handleInterruptScript} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', fontSize: '1em' }}>Interrupt Script</button>
          </div>
        )}
      </section>

      {scriptOutput && (
        <section style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ borderBottom: '2px solid #e74c3c', paddingBottom: '10px', color: '#e74c3c' }}>Output</h2>
          <pre style={{ 
            backgroundColor: '#2c3e50', 
            color: '#ecf0f1',
            padding: '15px', 
            border: '1px solid #1a252f', 
            borderRadius: '4px',
            maxHeight: '500px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.9em',
            fontFamily: 'monospace'
          }}>
            {scriptOutput}
            <div ref={outputEndRef} />
          </pre>
        </section>
      )}

      {/* Detailed URL Lists Section */}
      {urlStats && (
        <section style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ borderBottom: '2px solid #8e44ad', paddingBottom: '10px', color: '#8e44ad' }}>Detailed URL Lists</h2>
          
          {urlStats.manuallySubmittedUrls && urlStats.manuallySubmittedUrls.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#c0392b' }}>Manually Submitted URLs for Scraping ({urlStats.manuallySubmittedUrls.length})</h3>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                {urlStats.manuallySubmittedUrls.map((srcUrl, index) => (
                  <li key={`manual-${index}`} style={{ marginBottom: '5px' }}>
                    <a href={srcUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#2980b9' }}>{srcUrl}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {urlStats.allSourceUrlsFromFiles && urlStats.allSourceUrlsFromFiles.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#2980b9' }}>All Source URLs ({urlStats.allSourceUrlsFromFiles.length})</h3>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                {urlStats.allSourceUrlsFromFiles.map((srcUrl, index) => (
                  typeof srcUrl === 'string' ? (
                  <li key={`source-${index}`} style={{ marginBottom: '5px' }}>
                     <a href={srcUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#2980b9' }}>{srcUrl}</a>
                  </li>
                  )
                  :(
                  <li key={`source-${index}`} style={{ marginBottom: '5px' }}>
                    {srcUrl.url}
                  </li>
                  )
                ))}
              </ul>
            </div>
          )}

          {/* The Processed URLs list is intentionally removed as per user request, replaced by Generated MDX Posts list above */}
        </section>
      )}
    </div>
  );
};

export default ScriptManagerPage;
