import Head from 'next/head'
import { Inter } from '@next/font/google'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  const [historyListLoaded, setHistoryListLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [historyList, setHistoryList] = useState([] as any[]);
  const [msg, setMsg] = useState("");

  const [conversation, setConversation] = useState([] as any[]);

  const [sessionId, setSessionId] = useState(null as null|string);

  const loadHistoryList = async () => {
    var hs = await fetch('/api/history');
    var h = await hs.json();
    setHistoryList([...h, {_id: null}]);
    setHistoryListLoaded(true);
  };

  const loadHistoryBySessionId = async (id: string) => {
    if (id === sessionId) return;
    if (id === null) {
      setConversation([]);
      setSessionId(null);
      return;
    }
    setIsLoading(true)
    var cv = await fetch('/api/history/' + id);
    var c = await cv.json();
    setConversation(c.history);
    setIsLoading(false);
    setSessionId(id);
  };

  const postMessage = async (message: string) => {
    setMsg("");
    var url = sessionId ? '/api/chat/' + sessionId : '/api/chat';
    var msg = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({message: message})
    });
    var m = await msg.json();
    if (!sessionId) {
      setHistoryList([{_id: m.sessionId, title: m.title}, ...historyList]);
      setSessionId(m.sessionId);
    }
    setConversation([...conversation, {
      input: message,
      output: m.response,
      timestamp: new Date().getTime()
    }]);
    setIsLoading(false);
  };

  const handleKeyUp = (e: any) => {
    if (e.key === 'Enter' && e.shiftKey) {
      setIsLoading(true);
      postMessage(msg);
    }
  };

  function formatDate(timestamp: number) {
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    var hour = date.getHours().toString().padStart(2, '0');
    var minute = date.getMinutes().toString().padStart(2, '0');
  
    return day + '/' + month + '/' + year + ' ' + hour + ':' + minute;
  }

  useEffect(() => {
    loadHistoryList();
  }, []);
  return (
    <>
      <Head>
        <title>cgpt</title>
        <meta name="description" content="cgpt" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="parent bg-slate-600 h-screen grid grid-cols-8">
        <section className="sidebar bg-slate-800 md:col-span-1 hidden sm:inline-grid">
          {historyListLoaded ? <div>
            {historyListLoaded && historyList.map((h: {_id: string, title: string}) => {
              return (
                <div key={h._id}>
                  <div className="text-gray-300 cursor-pointer p-3">
                    <div className={(h._id === sessionId ? "bg-slate-700 rounded-lg" : "") + " w-full p-2"} onClick={()=>{loadHistoryBySessionId(h._id)}} data-value={h._id}>{h._id ? h.title : "New Chat"}</div>
                  </div>
                </div>
              );
            })}
          </div> : <div className="text-gray-200">Loading...</div>}
        </section>
        <main className="main md:col-span-7 col-span-8 container mx-auto flex items-end flex-col h-screen">
          <div className="flex-grow w-full overflow-auto">
            {conversation.map((c: any) => {
              return (
                <div key={c.timestamp}>
                  <div className="bg-slate-700 p-2 rounded-lg m-1">
                    <div className="text-gray-200" style={{whiteSpace:'pre-wrap'}}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.input.trim()}</ReactMarkdown>
                    </div>
                    <div className="text-gray-400 text-xs">
                    {formatDate(c.timestamp)}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg m-1">
                    <div className="text-gray-200" style={{whiteSpace:'pre-wrap'}}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.output.trim()}</ReactMarkdown>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {formatDate(c.timestamp)}
                    </div>
                  </div>
                </div>
              );  
            })}
            {isLoading && <div className="text-gray-200">Loading...</div>}
          </div>
          <textarea value={msg} onChange={(e)=>{setMsg(e.target.value)}} placeholder={"Shift + Enter to Submit, Enter for New Line"} onKeyUp={handleKeyUp} className="h-20 w-full resize-none p-2 rounded-lg mb-1"></textarea>
        </main>
      </div>
    </>
  )
}

