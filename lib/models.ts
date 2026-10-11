import mongoose,{Schema,model,models}from'mongoose';
const opts={timestamps:true};const id={type:Schema.Types.ObjectId,index:true,required:true};
const line=new Schema({itemId:String,name:String,qty:Number,price:Number,cost:Number},{_id:false});
const schemas={
 User:new Schema({name:String,email:{type:String,index:true,unique:true},image:String},opts),
 Business:new Schema({ownerId:id,name:String,type:String,address:String,currency:String,eventDay:Boolean},opts),
 Item:new Schema({businessId:id,name:String,category:String,price:Number,cost:Number,stock:Number,reorder:Number,unit:String},opts),
 Vendor:new Schema({businessId:id,name:String,email:String,phone:String,items:[String]},opts),
 Invoice:new Schema({businessId:id,vendorId:Schema.Types.ObjectId,date:Date,items:[line],imageUrl:String,total:Number,paid:Boolean},opts),
 Sale:new Schema({businessId:id,date:Date,items:[line],total:Number,channel:String,payment:String},opts),
 JournalEntry:new Schema({businessId:id,date:Date,source:String,memo:String,lines:[new Schema({account:String,debit:Number,credit:Number},{_id:false})]},opts),
 Account:new Schema({businessId:id,code:String,name:String,type:String},opts),
 InventoryMovement:new Schema({businessId:id,itemId:Schema.Types.ObjectId,qty:Number,unitCost:Number,source:String},opts),
 Prediction:new Schema({businessId:id,action:String,reason:String,impact:Number,confidence:Number,category:String,checkAfter:Date},opts),
 Outcome:new Schema({businessId:id,predictionId:Schema.Types.ObjectId,actual:Number,verdict:String,lesson:String},opts),
 Experiment:new Schema({businessId:id,itemId:Schema.Types.ObjectId,testPrice:Number,baselinePrice:Number,startsAt:Date,endsAt:Date,status:String},opts),
 Order:new Schema({businessId:id,channel:String,status:String,items:[line],customer:String},opts),
 PurchaseOrder:new Schema({businessId:id,vendorId:Schema.Types.ObjectId,status:String,items:[line],total:Number},opts)
};
export const dbModels=Object.fromEntries(Object.entries(schemas).map(([name,schema])=>[name,models[name]||model(name,schema)]));
export async function connectDatabase(){if(process.env.MONGODB_URI)return mongoose.connect(process.env.MONGODB_URI);const{MongoMemoryServer}=await import('mongodb-memory-server');const server=await MongoMemoryServer.create();return mongoose.connect(server.getUri())}
