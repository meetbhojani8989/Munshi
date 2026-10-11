// OpenAI-compatible chat client. Reads LLM_BASE_URL, LLM_API_KEY and LLM_MODEL.
// When any of them is unset it falls back to a deterministic mock so the app
// runs with no env vars at all.
export type ChatMessage={role:'system'|'user'|'assistant';content:string};
export type ChatOptions={json?:boolean;temperature?:number};

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
  async complete(messages:ChatMessage[],options:ChatOptions={}):Promise<string>{
    const response=await fetch(`${this.config.baseUrl}/chat/completions`,{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.config.apiKey}`},
      body:JSON.stringify({
        model:this.config.model,
        temperature:options.temperature??0.2,
        messages,
        ...(options.json?{response_format:{type:'json_object'}}:{}),
      }),
    });
    if(!response.ok)throw new Error(`LLM request failed (${response.status})`);
    const data=await response.json();
    const content=data?.choices?.[0]?.message?.content;
    if(typeof content!=='string')throw new Error('LLM returned an empty response');
    return content;
  }
}

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
