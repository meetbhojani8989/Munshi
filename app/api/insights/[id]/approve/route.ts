import{NextRequest,NextResponse}from'next/server';
import{auth}from'@/auth';
import{suggestionSchema}from'@/lib/ai/types';

// POST /api/insights/:id/approve — record owner approval of a suggestion.
// The suggestion is sent in the body (this layer is stateless until Person A's
// store lands). For a pricing suggestion we return a `priceChange` directive;
// the client applies it with PATCH /api/items/:id (Person A's route), keeping
// the money change behind the owner's explicit approval.
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!await auth())return NextResponse.json({error:'Sign in required'},{status:401});
  const{id}=await params;
  try{
    const body=await req.json();
    const suggestion=suggestionSchema.parse(body?.suggestion);
    if(suggestion.id!==id)return NextResponse.json({error:'Suggestion id mismatch'},{status:400});
    const approved={...suggestion,status:'approved'as const};
    const priceChange=approved.itemId&&typeof approved.newPrice==='number'
      ?{itemId:approved.itemId,newPrice:approved.newPrice}
      :undefined;
    return NextResponse.json({suggestion:approved,priceChange});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:'Invalid approval request'},{status:400});
  }
}
