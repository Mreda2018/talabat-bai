export const MIN_ORDER=100
export const fallbackContent={siteName:'طلبات بيلا',location:'بيلا، كفر الشيخ',logoText:'طلبات\nبيلا',logoImage:'',supportPhone:'201000000000',bannerTitle:'اطلب كل\nاحتياجاتك',bannerSubtitle:'توصيل محلي سريع من المتاجر القريبة',bannerSmall:'متاح الآن داخل بيلا',bannerButton:'ابدأ الطلب',bannerIcon:'🛵',bannerImage:'',primaryColor:'#ff5a1f',secondaryColor:'#ff7a2d',minimumOrder:100}
export const money=(n)=>Number(n||0).toLocaleString('ar-EG')+' ج'
export function visual(v, cls=''){ if(!v)return null; if(String(v).startsWith('data:')||String(v).startsWith('http')) return <img src={v} className={cls} alt="" />; return v }
export const catDb=(c)=>({id:c.id,name:c.name,type:c.type,icon:c.icon||'⭐'})
export const zoneDb=(z)=>({id:z.id,name:z.name,fee:Number(z.fee||0),eta:z.eta||''})
export const storeDb=(s)=>({id:s.id,name:s.name,type:s.type,label:s.label||'',logo:s.logo_url||'🛒',merchantPhone:s.merchant_phone||'',rating:Number(s.rating||4.5),time:s.delivery_time||'',status:s.status||'متاح الآن',isAvailable:s.is_available!==false,isLate:!!s.is_late})
export const prodDb=(p)=>({id:p.id,storeId:p.store_id,cat:p.category_type,name:p.name,price:Number(p.price||0),old:Number(p.old_price||0),img:p.image_url||'🛒',discount:p.discount||'',active:p.is_active!==false})
export const driverDb=(d)=>({id:d.id,name:d.name,phone:d.phone,zone:d.zone||'',availability:d.availability||'available'})
export const orderDb=(o)=>({id:o.id,date:o.created_at?new Date(o.created_at).toLocaleString('ar-EG'):'',customer:{name:o.customer_name,phone:o.customer_phone,address:o.customer_address,notes:o.customer_notes,replaceOption:o.replace_option,zone:o.zone_name,eta:o.eta},zoneId:o.zone_id,store:{id:o.store_id,name:o.store_name},merchantPhone:o.merchant_phone,driverId:o.driver_id,driverName:o.driver_name,driverPhone:o.driver_phone,items:o.items||[],subtotal:Number(o.subtotal||0),delivery:Number(o.delivery||0),total:Number(o.total||0),commission:Number(o.commission||0),driverFee:Number(o.driver_fee||0),merchantDue:Number(o.merchant_due||0),profit:Number(o.profit||0),status:o.status||'Pending Review',zoneReview:o.zone_review||'Pending',internalNote:o.internal_note||'',paymentStatus:o.payment_status||'Unpaid'})

export const categoryFromDb = catDb
export const storeFromDb = storeDb
export const productFromDb = prodDb
export const zoneFromDb = zoneDb
export const driverFromDb = driverDb
export const orderFromDb = orderDb

export const fallbackCategories = [
  {id:'all', icon:'🔥', name:'الكل', type:'all'},
  {id:'available', icon:'✅', name:'متاح الآن', type:'available'},
  {id:'night', icon:'🌙', name:'طلبات ليلية', type:'night'},
  {id:'super', icon:'🛒', name:'سوبر ماركت', type:'super'},
  {id:'pharma', icon:'💊', name:'صيدليات', type:'pharma'},
  {id:'food', icon:'🍔', name:'مطاعم', type:'food'},
  {id:'fresh', icon:'🥦', name:'خضار وفاكهة', type:'fresh'}
]
export const fallbackZones = [
  {id:'z-demo-1', name:'داخل بيلا', fee:20, eta:'30–45 دقيقة'},
  {id:'z-demo-2', name:'قرية قريبة', fee:35, eta:'45–60 دقيقة'},
  {id:'z-demo-3', name:'قرية بعيدة', fee:50, eta:'60–90 دقيقة'}
]
export const fallbackStores = [
  {id:'s-demo-1',name:'سوبر ماركت الخير',type:'super',label:'سوبر ماركت',time:'30-45 د',logo:'🛒',merchantPhone:'201000000001',rating:4.8,isAvailable:true,isLate:false,status:'متاح الآن'},
  {id:'s-demo-2',name:'صيدلية الشفاء',type:'pharma',label:'صيدلية',time:'15-25 د',logo:'💊',merchantPhone:'201000000002',rating:4.9,isAvailable:true,isLate:true,status:'متاح الآن'},
  {id:'s-demo-3',name:'مطعم بيلا',type:'food',label:'مطعم',time:'30-40 د',logo:'🍔',merchantPhone:'201000000003',rating:4.6,isAvailable:true,isLate:false,status:'مشغول'}
]
export const fallbackProducts = [
  {id:'p-demo-1',storeId:'s-demo-1',cat:'super',name:'أرز مصري 1 كجم',price:45,old:55,img:'🍚',discount:'-20%',active:true},
  {id:'p-demo-2',storeId:'s-demo-1',cat:'super',name:'زيت خليط 700 مل',price:65,old:75,img:'🛢️',discount:'-15%',active:true},
  {id:'p-demo-3',storeId:'s-demo-2',cat:'pharma',name:'باراسيتامول',price:25,old:0,img:'💊',discount:'متاح الآن',active:true},
  {id:'p-demo-4',storeId:'s-demo-3',cat:'food',name:'وجبة برجر كومبو',price:95,old:120,img:'🍔',discount:'-20%',active:true}
]

export function textLines(v){ return String(v||'').replaceAll('/n','\n').replaceAll('\\n','\n') }
