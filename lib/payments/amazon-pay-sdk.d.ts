// Minimal ambient types for @amazonpay/amazon-pay-api-sdk-nodejs (v2.x), which
// ships no TypeScript declarations. Covers only the Checkout v2 surface Munshi
// uses. See https://github.com/amzn/amazon-pay-api-sdk-nodejs.
declare module '@amazonpay/amazon-pay-api-sdk-nodejs'{
  export interface AmazonPayConfig{
    publicKeyId:string;
    privateKey:string|Buffer;
    region:'us'|'eu'|'jp';
    sandbox:boolean;
    algorithm?:string;
  }
  export interface ApiResponse<T=any>{status:number;data:T;headers?:Record<string,string>}
  export class AmazonPayClient{
    constructor(config:AmazonPayConfig);
    generateButtonSignature(payload:object|string):string;
  }
  export class WebStoreClient extends AmazonPayClient{
    createCheckoutSession(payload:object,headers:Record<string,string>):Promise<ApiResponse>;
    getCheckoutSession(checkoutSessionId:string,headers?:Record<string,string>|null):Promise<ApiResponse>;
    updateCheckoutSession(checkoutSessionId:string,payload:object,headers?:Record<string,string>|null):Promise<ApiResponse>;
    completeCheckoutSession(checkoutSessionId:string,payload:object,headers?:Record<string,string>|null):Promise<ApiResponse>;
  }
  export class InStoreClient{constructor(config:AmazonPayConfig)}
}
