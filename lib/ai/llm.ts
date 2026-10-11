// OpenAI-compatible chat client. Reads LLM_BASE_URL, LLM_API_KEY and LLM_MODEL.
// When any of them is unset it falls back to a deterministic mock so the app
// runs with no env vars at all.
export type ChatMessage={role:'system'|'user'|'assistant';content:string};
export type ChatOptions={json?:boolean;temperature?:number;effort?:'low'|'medium'|'high'};

export interface LlmClient{
  readonly live:boolean;
  complete(messages:ChatMessage[],options?:ChatOptions):Promise<string>;
}

function env(){
  const baseUrl=process.env.LLM_BASE_URL?.replace(/\/+$/,'');
  const apiKey=process.env.LLM_API_KEY;
  const model=process.env.LLM_MODEL;
  return baseUrl&&apiKey&&model?{baseUrl,apiKey,model}:null;
}

class OpenAICompatibleClient implements LlmClient{
  readonly live=true;
  constructor(private config:{baseUrl:string;apiKey:string;model:string}){}
  async complete(messages:ChatMessage[],options:ChatOptions={},attempt=0):Promise<string>{
    const response=await fetch(`${this.config.baseUrl}/chat/completions`,{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.config.apiKey}`},
      body:JSON.stringify({
        model:this.config.model,
        temperature:options.temperature??0.2,
        messages,
        ...(options.json?{response_format:{type:'json_object'}}:{}),
        // Reasoning models think less (and answer ~2x faster) at low effort.
        ...(options.effort?{reasoning_effort:options.effort}:{}),
      }),
    });
    if(!response.ok){
      // Some hosted models reject response_format; retry once without it.
      if(options.json&&response.status===400)return this.complete(messages,{...options,json:false});
      // Shared inference endpoints shed load under spikes; back off and retry twice.
      if((response.status===503||response.status===429)&&attempt<2){
        await new Promise(r=>setTimeout(r,600*(attempt+1)));
        return this.complete(messages,options,attempt+1);
      }
      throw new Error(`LLM request failed (${response.status})`);
    }
    const data=await response.json();
    const content=data?.choices?.[0]?.message?.content;
    if(typeof content!=='string')throw new Error('LLM returned an empty response');
    return stripReasoning(content);
  }
}

// Reasoning models (DeepSeek R1, GLM) wrap answers in <think> blocks or code fences.
export function stripReasoning(text:string):string{
  return text.replace(/<think>[\s\S]*?<\/think>/g,'').replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
}

/** Parse the first JSON object in a model reply. */
export function parseJson<T=unknown>(text:string):T{
  const clean=stripReasoning(text);
  try{return JSON.parse(clean)}catch{}
  const start=clean.indexOf('{'),end=clean.lastIndexOf('}');
  if(start>=0&&end>start)return JSON.parse(clean.slice(start,end+1));
  throw new Error('Model did not return JSON');
}

export function modelName():string{return process.env.LLM_MODEL||'deterministic-mock'}

// Deterministic so tests and demos are reproducible: the same prompt always
// yields the same answer, and JSON requests get a parseable object back.
class MockLlmClient implements LlmClient{
  readonly live=false;
  async complete(messages:ChatMessage[],options:ChatOptions={}):Promise<string>{
    const lastUser=[...messages].reverse().find(m=>m.role==='user')?.content??'';
    if(options.json)return JSON.stringify({suggestions:[]});
    return `Deterministic mock response for: ${lastUser.slice(0,120)}`;
  }
}

export function createLlmClient():LlmClient{
  const config=env();
  return config?new OpenAICompatibleClient(config):new MockLlmClient();
}

// Shared default instance.
export const llm:LlmClient=createLlmClient();
