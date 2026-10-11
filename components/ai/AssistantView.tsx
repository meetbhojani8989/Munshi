'use client';
import{useState}from'react';
import{Mic}from'lucide-react';
import type{AssistantReply,AssistantProposal}from'@/lib/ai/types';
import{Card,Title,usd}from'./ui';

type Message={role:'user'|'assistant';text:string};

export default function AssistantView(){
  const[input,setInput]=useState('');
  const[messages,setMessages]=useState<Message[]>([
    {role:'assistant',text:'Hi! I can help explain your sales, stock, and profit. Ask me anything — money changes always wait for your approval.'},
  ]);
  const[proposal,setProposal]=useState<AssistantProposal|null>(null);
  const[sending,setSending]=useState(false);
  const[listening,setListening]=useState(false);

  // Web Speech API dictation. Fills the input so the owner can review the
  // transcript before sending; degrades to typing when unsupported.
  function startVoice(){
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){
      setMessages(m=>[...m,{role:'assistant',text:'Voice input isn’t available in this browser — type your command instead.'}]);
      return;
    }
    const recognition=new SR();
    recognition.lang='en-US';
    recognition.interimResults=false;
    recognition.onresult=(e:any)=>setInput(e.results[0][0].transcript);
    recognition.onend=()=>setListening(false);
    recognition.onerror=()=>setListening(false);
    setListening(true);
    recognition.start();
  }

  async function send(){
    const message=input.trim();
    if(!message||sending)return;
    setMessages(m=>[...m,{role:'user',text:message}]);
    setInput('');
    setSending(true);
    try{
      const r=await fetch('/api/assistant/intent',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message}),
      });
      const reply:AssistantReply=await r.json();
      if(!r.ok)throw new Error((reply as any).error||'Assistant unavailable');
      setMessages(m=>[...m,{role:'assistant',text:reply.answer}]);
      setProposal(reply.proposal??null);
    }catch(e){
      setMessages(m=>[...m,{role:'assistant',text:e instanceof Error?e.message:'Something went wrong.'}]);
    }finally{
      setSending(false);
    }
  }

  async function approve(){
    if(!proposal)return;
    await fetch(`/api/items/${proposal.itemId}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({price:proposal.newPrice}),
    }).catch(()=>{});
    setMessages(m=>[...m,{role:'assistant',text:`Approved. ${proposal.action} is set.`}]);
    setProposal(null);
  }

  return <>
    <Title kicker="Ask in plain language" title="Your business assistant" sub="Ask a question or propose an action. Money changes always wait for approval."/>
    <Card className="max-w-3xl">
      <div className="h-80 overflow-y-auto space-y-4">
        {messages.map((m,i)=>
          <div key={i} className={'max-w-[85%] rounded-2xl p-4 text-sm '+(m.role==='user'?'ml-auto bg-[#dceee4] text-[#163f2d]':'bg-paper')}>{m.text}</div>
        )}
      </div>
      {proposal&&<div className="border border-green rounded-xl p-4 mt-3">
        <b>Action needs approval</b>
        <p className="text-sm mt-2">Change the price from {usd(proposal.currentPrice)} to {usd(proposal.newPrice)}.</p>
        <button className="btn mt-3" onClick={approve}>Approve change</button>
        <button className="btn2 ml-2" onClick={()=>setProposal(null)}>Dismiss</button>
      </div>}
      <div className="flex gap-2 mt-4">
        <input className="flex-1 min-w-0" placeholder="What was my best item?" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
        <button className="btn2 px-3" aria-label="Speak your question" onClick={startVoice} disabled={listening}><Mic size={16} className={listening?'positive':''}/></button>
        <button className="btn" onClick={send} disabled={sending}>{sending?'…':'Send'}</button>
      </div>
      {listening&&<p className="text-xs muted mt-2">Listening… speak your question.</p>}
    </Card>
  </>;
}
