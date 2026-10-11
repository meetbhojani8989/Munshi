// Server-side Amazon Pay (Checkout v2) helper for the Munshi founding plan.
// The private key is read from env and NEVER sent to the client; only the
// public button config (payloadJSON + signature + public ids) is exposed.
// Follows the official Node SDK: https://github.com/amzn/amazon-pay-api-sdk-nodejs
import{WebStoreClient}from'@amazonpay/amazon-pay-api-sdk-nodejs';
import{randomUUID}from'node:crypto';

// Single source of truth for the plan price — change it here only.
export const FOUNDING_PLAN={
  name:'Munshi Founding Plan',
  currencyCode:'USD',
  amount:'5.00',                 // first month is charged today
  frequency:{unit:'Month',value:'1'},
}as const;

export function isSandbox():boolean{
  return process.env.AMAZON_PAY_ENV!=='production';
}

// Live Amazon Pay needs all four credentials. Without them we run in demo mode.
export function isConfigured():boolean{
  return Boolean(
    process.env.AMAZON_PAY_PUBLIC_KEY_ID&&
    process.env.AMAZON_PAY_PRIVATE_KEY&&
    process.env.AMAZON_PAY_MERCHANT_ID&&
    process.env.AMAZON_PAY_STORE_ID
  );
}

function client():WebStoreClient{
  // Allow the private key to be stored with literal \n escapes in a single env line.
  const privateKey=(process.env.AMAZON_PAY_PRIVATE_KEY||'').replace(/\\n/g,'\n');
  return new WebStoreClient({
    publicKeyId:process.env.AMAZON_PAY_PUBLIC_KEY_ID!,
    privateKey,
    region:'us',
    sandbox:isSandbox(),
    algorithm:'AMZN-PAY-RSASSA-PSS-V2',
  });
}

// The recurring checkout payload Amazon signs into the button. On click the
// buyer is taken to Amazon's hosted page; on return we complete the charge.
function checkoutPayload(baseUrl:string){
  return{
    webCheckoutDetails:{
      checkoutResultReturnUrl:`${baseUrl}/api/payments/complete`,
      checkoutMode:'ProcessOrder',
    },
    storeId:process.env.AMAZON_PAY_STORE_ID!,
    scopes:['name','email'],
    chargePermissionType:'Recurring',
    recurringMetadata:{
      frequency:{unit:FOUNDING_PLAN.frequency.unit,value:FOUNDING_PLAN.frequency.value},
      amount:{amount:FOUNDING_PLAN.amount,currencyCode:FOUNDING_PLAN.currencyCode},
    },
    paymentDetails:{
      paymentIntent:'AuthorizeWithCapture',
      chargeAmount:{amount:FOUNDING_PLAN.amount,currencyCode:FOUNDING_PLAN.currencyCode},
    },
    merchantMetadata:{
      merchantReferenceId:`munshi-founding-${randomUUID().replace(/-/g,'').slice(0,20)}`,
      merchantStoreName:'Munshi',
      noteToBuyer:`${FOUNDING_PLAN.name} — $${FOUNDING_PLAN.amount}/month`,
    },
  };
}

// Everything the front-end amazon.Pay.renderButton needs. Safe to send to the
// browser: payloadJSON, signature and the public ids are designed to be public.
export type CheckoutButtonConfig={
  merchantId:string;
  publicKeyId:string;
  ledgerCurrency:string;
  checkoutLanguage:string;
  productType:'PayOnly'|'PayAndShip';
  placement:string;
  buttonColor:string;
  sandbox:boolean;
  createCheckoutSessionConfig:{
    payloadJSON:string;
    signature:string;
    publicKeyId:string;
    algorithm:string;
  };
};

export function createCheckoutButtonConfig(baseUrl:string):CheckoutButtonConfig{
  const payload=checkoutPayload(baseUrl);
  const signature=client().generateButtonSignature(payload);
  const publicKeyId=process.env.AMAZON_PAY_PUBLIC_KEY_ID!;
  return{
    merchantId:process.env.AMAZON_PAY_MERCHANT_ID!,
    publicKeyId,
    ledgerCurrency:FOUNDING_PLAN.currencyCode,
    checkoutLanguage:'en_US',
    productType:'PayOnly',
    placement:'Checkout',
    buttonColor:'Gold',
    sandbox:isSandbox(),
    createCheckoutSessionConfig:{
      payloadJSON:JSON.stringify(payload),
      signature,
      publicKeyId,
      algorithm:'AMZN-PAY-RSASSA-PSS-V2',
    },
  };
}

export type CompleteResult={state:'completed'|'canceled'|'failed';amount:string;currencyCode:string};

// Called after Amazon redirects the buyer back. Completes the session, which
// authorizes and captures the first month's charge.
export async function completeCheckout(checkoutSessionId:string):Promise<CompleteResult>{
  const base={amount:FOUNDING_PLAN.amount,currencyCode:FOUNDING_PLAN.currencyCode};
  try{
    const response=await client().completeCheckoutSession(checkoutSessionId,{chargeAmount:base});
    const state=response.data?.statusDetails?.state;
    if(state==='Completed'||state==='Open')return{state:'completed',...base};
    if(state==='Canceled')return{state:'canceled',...base};
    return{state:'failed',...base};
  }catch{
    // A buyer who cancels on Amazon's page leaves the session uncompletable.
    return{state:'canceled',...base};
  }
}
