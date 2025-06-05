import React, { useState, useRef, useEffect } from 'react';

const ScriptManagerPage = () => {
  const [url, setUrl] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const outputEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [output]);

  const runScript = async (action: 'scrape' | 'generate') => {
    setIsLoading(true);
    setOutput(`Running ${action} script...\n`);

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
        setOutput(prev => `${prev}Error: ${response.status} ${errorData.error || 'Failed to fetch'}\nDetails: ${errorData.details || 'N/A'}\n`);
        setIsLoading(false);
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
        setOutput(prev => prev + decoder.decode(value, { stream: true }));
      }
      setOutput(prev => prev.endsWith('\n') ? prev : prev + '\n'); // Ensure final newline

    } catch (error: any) {
      setOutput(prev => `${prev}Fetch error: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
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
            onClick={() => runScript('scrape')} 
            disabled={isLoading || !url}
            style={{ padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {isLoading ? 'Running...' : 'Run Scraper'}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px', color: '#2ecc71' }}>Generate MDX</h2>
        <button 
          onClick={() => runScript('generate')} 
          disabled={isLoading}
          style={{ padding: '10px 15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isLoading ? 'Running...' : 'Run Generator'}
        </button>
      </section>

      {output && (
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
            {output}
            <div ref={outputEndRef} />
          </pre>
        </section>
      )}
    </div>
  );
};

export default ScriptManagerPage;
