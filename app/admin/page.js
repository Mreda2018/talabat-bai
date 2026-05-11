"use client"

import {useEffect,useState} from "react"
import {supabase} from "../lib/supabaseClient"
import {
  money,
  fallbackContent,
  fallbackCategories,
  fallbackZones,
  fallbackStores,
  fallbackProducts,
  categoryFromDb,
  zoneFromDb,
  storeFromDb,
  productFromDb,
  driverFromDb,
  orderFromDb
} from "../lib/helpers"

const demoDrivers=[
 {id:"d-demo-1",name:"محمد المندوب",phone:"201000000010",zone:"داخل بيلا",availability:"available"},
 {id:"d-demo-2",name:"محمود المندوب",phone:"201000000011",zone:"قرية قريبة",availability:"available"}
]

const tabs=[
 ["orders","الطلبات"],
 ["cms","CMS الواجهة"],
 ["stores","المتاجر"],
 ["products","المنتجات"],
 ["zones","المناطق"],
 ["drivers","المندوبين"],
 ["settlements","التسويات"],
 ["diagnostics","فحص Supabase"]
]

async function safeQuery(query){
 try{
  const result=await Promise.race([query,new Promise(resolve=>setTimeout(()=>resolve({data:null,error:{message:"timeout"}}),3500))])
  if(result?.error){
   console.error("Supabase error:", result.error)
   return {data:null,error:result.error}
  }
  return {data:result?.data||null,error:null}
 }catch(error){
  console.error("Supabase failed:", error)
  return {data:null,error}
 }
}

function csvEscape(value){return `"${String(value??"").replaceAll('"','""')}"`}

function fileToBase64(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader()
  reader.onload=()=>resolve(reader.result)
  reader.onerror=reject
  reader.readAsDataURL(file)
 })
}

function ImageUpload({label,help,onChange,preview}){
 return <div className="upload-box">
  <label>{label}</label>
  <p>{help}</p>
  {preview && String(preview).startsWith("data:") && <img src={preview} className="upload-preview" alt="preview"/>}
  {preview && String(preview).startsWith("http") && <img src={preview} className="upload-preview" alt="preview"/>}
  <input type="file" accept="image/*" onChange={async e=>{
    const file=e.target.files?.[0]
    if(!file)return
    const base64=await fileToBase64(file)
    onChange(base64)
  }}/>
 </div>
}

export default function Admin(){
 const [active,setActive]=useState("orders")
 const [offline,setOffline]=useState(false)
 const [diagnostics,setDiagnostics]=useState([])
 const [orders,setOrders]=useState([])
 const [content,setContent]=useState(fallbackContent)
 const [categories,setCategories]=useState(fallbackCategories)
 const [stores,setStores]=useState(fallbackStores)
 const [products,setProducts]=useState(fallbackProducts)
 const [zones,setZones]=useState(fallbackZones)
 const [drivers,setDrivers]=useState(demoDrivers)
 const [orderSearch,setOrderSearch]=useState("")
 const [storeForm,setStoreForm]=useState({name:"",type:"super",label:"",delivery_time:"30-45 د",logo_url:"🛒",merchant_phone:"",rating:4.5,is_available:true,is_late:false,status:"متاح الآن"})
 const [productForm,setProductForm]=useState({name:"",price:0,old_price:0,image_url:"🛒",discount:"",category_type:"super",store_id:"",is_active:true})
 const [newZone,setNewZone]=useState({name:"",fee:20,eta:"30–45 دقيقة"})
 const [newDriver,setNewDriver]=useState({name:"",phone:"",zone:"داخل بيلا",availability:"available"})

 async function load(){
  const [or,set,cats,zs,st,pr,dr]=await Promise.all([
   safeQuery(supabase.from("orders").select("*").order("created_at",{ascending:false})),
   safeQuery(supabase.from("app_settings").select("*").eq("key","content").maybeSingle()),
   safeQuery(supabase.from("categories").select("*").order("sort_order")),
   safeQuery(supabase.from("zones").select("*").order("created_at")),
   safeQuery(supabase.from("stores").select("*").order("created_at")),
   safeQuery(supabase.from("products").select("*").order("created_at")),
   safeQuery(supabase.from("drivers").select("*").order("created_at"))
  ])

  const mappedOrders=(or.data||[]).map(orderFromDb)
  const mappedCats=(cats.data||[]).map(categoryFromDb)
  const mappedZones=(zs.data||[]).map(zoneFromDb)
  const mappedStores=(st.data||[]).map(storeFromDb)
  const mappedProducts=(pr.data||[]).map(productFromDb)
  const mappedDrivers=(dr.data||[]).map(driverFromDb)

  setOrders(mappedOrders)
  setContent({...fallbackContent,...(set.data?.value||{})})
  setCategories(mappedCats.length?mappedCats:fallbackCategories)
  setZones(mappedZones.length?mappedZones:fallbackZones)
  setStores(mappedStores.length?mappedStores:fallbackStores)
  setProducts(mappedProducts.length?mappedProducts:fallbackProducts)
  setDrivers(mappedDrivers.length?mappedDrivers:demoDrivers)
  setOffline(!!(or.error||set.error||cats.error||zs.error||st.error||pr.error||dr.error||!mappedCats.length||!mappedZones.length||!mappedStores.length||!mappedProducts.length))
 }

 useEffect(()=>{
  if(localStorage.getItem("belaAdminAuth")!=="true"){
   window.location.href="/login"
   return
  }
  load()
  runDiagnostics()
  const channel=supabase.channel("orders-realtime").on("postgres_changes",{event:"INSERT",schema:"public",table:"orders"},payload=>{
   setOrders(prev=>[orderFromDb(payload.new),...prev])
   try{new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==").play()}catch(e){}
  }).subscribe()
  return()=>supabase.removeChannel(channel)
 },[])

 async function runDiagnostics(){
  const results=[]
  const tables=["app_settings","categories","zones","stores","products","drivers","orders"]
  for(const table of tables){
   const {data,error}=await supabase.from(table).select("*").limit(1)
   results.push({name:table,ok:!error,message:error?error.message:"OK"})
  }

  const testId="TEST-"+Date.now().toString().slice(-6)
  const {error:insertError}=await supabase.from("orders").insert({
   id:testId,
   customer_name:"Test",
   customer_phone:"000",
   customer_address:"Test Address",
   items:[],
   subtotal:0,
   delivery:0,
   total:0,
   status:"Diagnostics Test"
  })
  results.push({name:"insert order test",ok:!insertError,message:insertError?insertError.message:"OK"})

  if(!insertError) await supabase.from("orders").delete().eq("id",testId)
  setDiagnostics(results)
 }

 async function updateOrder(id,patch){
  const current=orders.find(o=>o.id===id)
  if(!current)return

  let localPatch={...patch}

  if(patch.zoneId){
   const selectedZone=zones.find(z=>z.id===patch.zoneId)
   if(selectedZone){
    const delivery=Number(selectedZone.fee||0)
    const driverFee=Math.round(delivery*.6)
    localPatch={...localPatch,zoneId:selectedZone.id,customer:{...current.customer,zone:selectedZone.name,eta:selectedZone.eta},delivery,total:Number(current.subtotal||0)+delivery,driverFee,profit:Number(current.commission||0)+delivery-driverFee,zoneReview:"Approved",status:"تمت مراجعة المنطقة"}
   }
  }

  if(patch.delivery!==undefined){
   const delivery=Number(patch.delivery||0)
   const driverFee=Math.round(delivery*.6)
   localPatch={...localPatch,delivery,total:Number(current.subtotal||0)+delivery,driverFee,profit:Number(current.commission||0)+delivery-driverFee,zoneReview:"Approved",status:patch.status||"تم تعديل رسوم التوصيل"}
  }

  if(patch.driverId){
   const selectedDriver=drivers.find(d=>d.id===patch.driverId)
   if(selectedDriver){
    localPatch={...localPatch,driverId:selectedDriver.id,driverName:selectedDriver.name,driverPhone:selectedDriver.phone,status:"تم تحديد المندوب"}
   }
  }

  setOrders(prev=>prev.map(o=>o.id===id?{...o,...localPatch}:o))

  const dbPatch={}
  if(localPatch.status)dbPatch.status=localPatch.status
  if(localPatch.internalNote!==undefined)dbPatch.internal_note=localPatch.internalNote
  if(localPatch.delivery!==undefined)dbPatch.delivery=localPatch.delivery
  if(localPatch.total!==undefined)dbPatch.total=localPatch.total
  if(localPatch.driverFee!==undefined)dbPatch.driver_fee=localPatch.driverFee
  if(localPatch.profit!==undefined)dbPatch.profit=localPatch.profit
  if(localPatch.zoneReview)dbPatch.zone_review=localPatch.zoneReview
  if(localPatch.zoneId)dbPatch.zone_id=String(localPatch.zoneId).startsWith("z-demo")||String(localPatch.zoneId).startsWith("z-local")?null:localPatch.zoneId
  if(localPatch.customer?.zone)dbPatch.zone_name=localPatch.customer.zone
  if(localPatch.customer?.eta)dbPatch.eta=localPatch.customer.eta
  if(localPatch.driverId)dbPatch.driver_id=String(localPatch.driverId).startsWith("d-demo")||String(localPatch.driverId).startsWith("d-local")?null:localPatch.driverId
  if(localPatch.driverName)dbPatch.driver_name=localPatch.driverName
  if(localPatch.driverPhone)dbPatch.driver_phone=localPatch.driverPhone
  dbPatch.updated_at=new Date().toISOString()

  const {error}=await supabase.from("orders").update(dbPatch).eq("id",id)
  if(error)alert("فشل تحديث الطلب: "+error.message)
 }

 function sendCustomerConfirm(order){
  const phone=(order.customer.phone||"").replace(/^0/,"20")
  const msg=`تمت مراجعة طلبك ${order.id}\nالمنطقة: ${order.customer.zone||"-"}\nرسوم التوصيل: ${order.delivery} ج\nالإجمالي النهائي: ${order.total} ج\nهل تؤكد تنفيذ الطلب؟`
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank")
 }

 function sendMerchant(order){
  const items=(order.items||[]).map(i=>`- ${i.name} x ${i.qty||1}: ${i.price} ج`).join("\n")
  const msg=`طلب جديد من طلبات بيلا\nرقم الطلب: ${order.id}\nالمنطقة: ${order.customer.zone||"-"}\n\nالمنتجات:\n${items}\n\nالإجمالي: ${order.total} ج`
  window.open(`https://wa.me/${order.merchantPhone}?text=${encodeURIComponent(msg)}`,"_blank")
  updateOrder(order.id,{status:"تم الإرسال للتاجر"})
 }

 function sendDriver(order){
  if(!order.driverPhone){alert("اختار المندوب الأول");return}
  const msg=`طلب جاهز للتوصيل - طلبات بيلا\nرقم الطلب: ${order.id}\nالعميل: ${order.customer.name}\nالموبايل: ${order.customer.phone}\nالعنوان: ${order.customer.address}\nالمطلوب تحصيله: ${order.total} ج`
  window.open(`https://wa.me/${order.driverPhone}?text=${encodeURIComponent(msg)}`,"_blank")
  updateOrder(order.id,{status:"تم الإرسال للمندوب"})
 }

 function printInvoice(order,type="customer"){
  const hide=type==="merchant"
  const win=window.open("","_blank")
  win.document.write(`<html dir="rtl"><body style="font-family:Tahoma;padding:30px"><h1>طلبات بيلا</h1><h2>${hide?"فاتورة تاجر":"فاتورة عميل"} ${order.id}</h2>${hide?`<p>المنطقة: ${order.customer.zone||"-"}</p>`:`<p>العميل: ${order.customer.name}</p><p>${order.customer.phone}</p><p>${order.customer.address}</p>`}<hr>${(order.items||[]).map(i=>`<p>${i.name} × ${i.qty||1} = ${i.price*(i.qty||1)} ج</p>`).join("")}<h3>${hide?"مستحق التاجر: "+order.merchantDue:"الإجمالي: "+order.total} ج</h3></body></html>`)
  win.print()
 }

 function exportCSV(){
  const rows=[["Order","Customer","Phone","Store","Status","Total"],...orders.map(order=>[order.id,order.customer.name,order.customer.phone,order.store.name,order.status,order.total])]
  const csv=rows.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n")
  const blob=new Blob([csv],{type:"text/csv"})
  const url=URL.createObjectURL(blob)
  const link=document.createElement("a")
  link.href=url
  link.download="bela-orders.csv"
  link.click()
  URL.revokeObjectURL(url)
 }

 async function saveContent(){
  const {error}=await supabase.from("app_settings").upsert({key:"content",value:content})
  if(error)alert("لم يتم الحفظ في Supabase: "+error.message)
  else alert("تم حفظ CMS")
 }

 async function saveStore(){
  const row={name:storeForm.name,type:storeForm.type,label:storeForm.label,delivery_time:storeForm.delivery_time,logo_url:storeForm.logo_url,merchant_phone:storeForm.merchant_phone,rating:Number(storeForm.rating||4.5),is_available:storeForm.is_available,is_late:storeForm.is_late,status:storeForm.status}
  if(storeForm.id&&!String(storeForm.id).startsWith("s-demo"))row.id=storeForm.id
  const {error}=await supabase.from("stores").upsert(row)
  if(error)alert("فشل حفظ المتجر: "+error.message)
  await load()
  setStoreForm({name:"",type:"super",label:"",delivery_time:"30-45 د",logo_url:"🛒",merchant_phone:"",rating:4.5,is_available:true,is_late:false,status:"متاح الآن"})
 }

 async function saveProduct(){
  const row={name:productForm.name,price:Number(productForm.price||0),old_price:Number(productForm.old_price||0),image_url:productForm.image_url,discount:productForm.discount,category_type:productForm.category_type,store_id:String(productForm.store_id||"").startsWith("s-demo")?null:productForm.store_id,is_active:productForm.is_active}
  if(productForm.id&&!String(productForm.id).startsWith("p-demo"))row.id=productForm.id
  const {error}=await supabase.from("products").upsert(row)
  if(error)alert("فشل حفظ المنتج: "+error.message)
  await load()
  setProductForm({name:"",price:0,old_price:0,image_url:"🛒",discount:"",category_type:"super",store_id:stores[0]?.id||"",is_active:true})
 }

 async function saveZone(){
  const {error}=await supabase.from("zones").insert({name:newZone.name,fee:Number(newZone.fee),eta:newZone.eta,is_active:true})
  if(error)alert("فشل حفظ المنطقة: "+error.message)
  await load()
  setNewZone({name:"",fee:20,eta:"30–45 دقيقة"})
 }

 async function saveDriver(){
  const {error}=await supabase.from("drivers").insert(newDriver)
  if(error)alert("فشل حفظ المندوب: "+error.message)
  await load()
  setNewDriver({name:"",phone:"",zone:"داخل بيلا",availability:"available"})
 }

 const filteredOrders=orders.filter(order=>!orderSearch||order.id.includes(orderSearch)||order.customer?.name?.includes(orderSearch)||order.customer?.phone?.includes(orderSearch)||order.store?.name?.includes(orderSearch)||order.status?.includes(orderSearch))
 const sales=orders.reduce((sum,order)=>sum+Number(order.total||0),0)
 const profit=orders.reduce((sum,order)=>sum+Number(order.profit||0),0)
 const merchant=orders.reduce((sum,order)=>sum+Number(order.merchantDue||0),0)
 const driverDue=orders.reduce((sum,order)=>sum+Number(order.driverFee||0),0)

 return <main className="admin-page"><div className="admin-layout">
  <aside className="sidebar">
    <h2>طلبات بيلا</h2>
    {tabs.map(tab=><button key={tab[0]} className={"side-btn "+(active===tab[0]?"active":"")} onClick={()=>setActive(tab[0])}>{tab[1]}</button>)}
    <button className="side-btn" onClick={()=>window.location.href="/"}>واجهة العميل</button>
    <button className="side-btn" onClick={()=>{localStorage.removeItem("belaAdminAuth");window.location.href="/login"}}>خروج</button>
  </aside>

  <section className="admin-main">
    <div className="admin-top">
      <div><h1>لوحة تشغيل طلبات بيلا</h1><p>{offline?"وضع Demo / تحقق من Supabase SQL & Policies":"Dashboard Supabase متصل"}</p></div>
      <div className="actions"><button className="light" onClick={load}>Refresh</button><button className="dark" onClick={exportCSV}>Export CSV</button><button className="wa" onClick={()=>window.location.href="/"}>واجهة العميل</button></div>
    </div>

    {offline&&<div className="note" style={{marginBottom:16}}>البيانات قد تكون Demo. شغّل SUPABASE_FULL_SETUP.sql ثم اضغط Refresh.</div>}

    <section className="stats">
      <div className="stat"><p>الطلبات</p><strong>{orders.length}</strong></div>
      <div className="stat"><p>التحصيل</p><strong>{money(sales)}</strong></div>
      <div className="stat"><p>الربح</p><strong>{money(profit)}</strong></div>
      <div className="stat"><p>مستحق التاجر</p><strong>{money(merchant)}</strong></div>
      <div className="stat"><p>Driver Earnings</p><strong>{money(driverDue)}</strong></div>
    </section>

    {active==="diagnostics"&&<div className="panel">
      <h2>فحص Supabase</h2>
      <button className="primary" onClick={runDiagnostics}>إعادة الفحص</button>
      <div className="cards-grid">{diagnostics.map(d=><div className="mini-card" key={d.name}><h3>{d.ok?"✅":"❌"} {d.name}</h3><p>{d.message}</p></div>)}</div>
      <div className="note">لو Insert Test فشل، الطلبات من الموبايل لن تظهر في Dashboard.</div>
    </div>}

    {active==="orders"&&<div className="panel">
      <h2>إدارة الطلبات</h2>
      <input className="input" placeholder="Search orders" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}/>
      <div className="table-wrap"><table className="table"><thead><tr><th>الطلب</th><th>العميل والمنطقة</th><th>الحالة</th><th>مندوب</th><th>الحسابات</th><th>Quick actions</th></tr></thead><tbody>
        {filteredOrders.length===0&&<tr><td colSpan="6">لا توجد طلبات. لو طلبت من موبايل ولم يظهر هنا، افتح فحص Supabase.</td></tr>}
        {filteredOrders.map(order=><tr key={order.id}><td><b>{order.id}</b><br/><small>{order.date}</small></td><td>{order.customer.name}<br/>{order.customer.phone}<br/>{order.customer.address}<select className="input" value={order.zoneId||""} onChange={e=>updateOrder(order.id,{zoneId:e.target.value})}><option value="">تعديل المنطقة</option>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name} - {money(zone.fee)}</option>)}</select><input className="input" type="number" value={order.delivery} onChange={e=>updateOrder(order.id,{delivery:Number(e.target.value)})}/></td><td><span className="status">{order.status}</span><br/><small>Zone: {order.zoneReview}</small><textarea className="input" value={order.internalNote||""} onChange={e=>updateOrder(order.id,{internalNote:e.target.value})}/></td><td><select className="input" value={order.driverId||""} onChange={e=>updateOrder(order.id,{driverId:e.target.value})}><option value="">اختار مندوب</option>{drivers.map(driver=><option key={driver.id} value={driver.id}>{driver.name}</option>)}</select></td><td>منتجات: {money(order.subtotal)}<br/>توصيل: {money(order.delivery)}<br/>إجمالي: {money(order.total)}<br/>التاجر: {money(order.merchantDue)}<br/>المندوب: {money(order.driverFee)}</td><td><div className="actions"><button className="wa" onClick={()=>sendCustomerConfirm(order)}>تأكيد العميل</button><button className="wa" onClick={()=>sendMerchant(order)}>واتساب التاجر</button><button className="confirm" onClick={()=>updateOrder(order.id,{status:"تم تأكيد التاجر"})}>تأكيد التاجر</button><button className="driver" onClick={()=>sendDriver(order)}>واتساب المندوب</button><button className="done" onClick={()=>updateOrder(order.id,{status:"تم التوصيل"})}>تم التوصيل</button><button className="dark" onClick={()=>printInvoice(order)}>فاتورة عميل</button><button className="light" onClick={()=>printInvoice(order,"merchant")}>فاتورة تاجر</button><button className="cancel" onClick={()=>updateOrder(order.id,{status:"ملغي"})}>إلغاء</button></div></td></tr>)}
      </tbody></table></div>
    </div>}

    {active==="cms"&&<div className="panel">
      <h2>CMS واجهة العميل</h2>
      <div className="note">المقاسات الموصى بها: اللوجو 512×512 PNG، بانر الموبايل 1080×520، بانر عريض 1600×700. يمكن أيضًا وضع رابط صورة مباشر.</div>
      <div className="upload-grid">
        <ImageUpload label="رفع لوجو التطبيق" help="مقاس مقترح 512×512 PNG / WebP" preview={content.logoImage} onChange={v=>setContent({...content,logoImage:v})}/>
        <ImageUpload label="رفع صورة البانر الرئيسي" help="مقاس مقترح 1080×520 للموبايل" preview={content.bannerImage} onChange={v=>setContent({...content,bannerImage:v})}/>
      </div>
      <div className="form-grid">{["siteName","location","logoText","logoImage","supportPhone","bannerTitle","bannerSubtitle","bannerSmall","bannerButton","bannerIcon","bannerImage","primaryColor","secondaryColor","minimumOrder"].map(key=><div key={key}><label>{key}</label><textarea className="input" value={content[key]||""} onChange={e=>setContent({...content,[key]:e.target.value})}/></div>)}</div>
      <button className="primary" onClick={saveContent}>حفظ CMS</button>
    </div>}

    {active==="stores"&&<div className="panel">
      <h2>المتاجر</h2>
      <div className="upload-grid"><ImageUpload label="رفع صورة / لوجو المتجر" help="مقاس مقترح 512×512" preview={storeForm.logo_url} onChange={v=>setStoreForm({...storeForm,logo_url:v})}/></div>
      <div className="form-grid">{["name","label","merchant_phone","logo_url","delivery_time","status"].map(key=><input key={key} className="input" placeholder={key} value={storeForm[key]||""} onChange={e=>setStoreForm({...storeForm,[key]:e.target.value})}/>) }<select className="input" value={storeForm.type} onChange={e=>setStoreForm({...storeForm,type:e.target.value})}>{categories.filter(c=>!["all","available","night"].includes(c.type)).map(c=><option key={c.type} value={c.type}>{c.name}</option>)}</select><label><input type="checkbox" checked={!!storeForm.is_available} onChange={e=>setStoreForm({...storeForm,is_available:e.target.checked})}/> متاح الآن</label><label><input type="checkbox" checked={!!storeForm.is_late} onChange={e=>setStoreForm({...storeForm,is_late:e.target.checked})}/> ليلي</label><button className="primary" onClick={saveStore}>حفظ/إضافة متجر</button></div>
      <div className="cards-grid">{stores.map(store=><div className="mini-card" key={store.id}><div className="admin-thumb">{String(store.logo||"").startsWith("data:")||String(store.logo||"").startsWith("http")?<img src={store.logo}/>:store.logo}</div><h3>{store.name}</h3><p>{store.label}</p><button className="light" onClick={()=>setStoreForm({id:store.id,name:store.name,type:store.type,label:store.label,delivery_time:store.time,logo_url:store.logo,merchant_phone:store.merchantPhone,rating:store.rating,is_available:store.isAvailable,is_late:store.isLate,status:store.status})}>تعديل</button></div>)}</div>
    </div>}

    {active==="products"&&<div className="panel">
      <h2>المنتجات</h2>
      <div className="upload-grid"><ImageUpload label="رفع صورة المنتج" help="مقاس مقترح 800×800 بخلفية واضحة" preview={productForm.image_url} onChange={v=>setProductForm({...productForm,image_url:v})}/></div>
      <div className="form-grid">{["name","price","old_price","image_url","discount"].map(key=><input key={key} className="input" placeholder={key} value={productForm[key]||""} onChange={e=>setProductForm({...productForm,[key]:key==="price"||key==="old_price"?Number(e.target.value):e.target.value})}/>) }<select className="input" value={productForm.store_id} onChange={e=>setProductForm({...productForm,store_id:e.target.value})}>{stores.map(store=><option key={store.id} value={store.id}>{store.name}</option>)}</select><select className="input" value={productForm.category_type} onChange={e=>setProductForm({...productForm,category_type:e.target.value})}>{categories.filter(c=>!["all","available","night"].includes(c.type)).map(c=><option key={c.type} value={c.type}>{c.name}</option>)}</select><label><input type="checkbox" checked={productForm.is_active!==false} onChange={e=>setProductForm({...productForm,is_active:e.target.checked})}/> Active</label><button className="primary" onClick={saveProduct}>حفظ/إضافة منتج</button></div>
      <div className="cards-grid">{products.map(product=><div className="mini-card" key={product.id}><div className="admin-thumb">{String(product.img||"").startsWith("data:")||String(product.img||"").startsWith("http")?<img src={product.img}/>:product.img}</div><h3>{product.name}</h3><p>{money(product.price)}</p><button className="light" onClick={()=>setProductForm({id:product.id,name:product.name,price:product.price,old_price:product.old,image_url:product.img,discount:product.discount,category_type:product.cat,store_id:product.storeId,is_active:product.active})}>تعديل</button></div>)}</div>
    </div>}

    {active==="zones"&&<div className="panel"><h2>المناطق</h2><div className="form-grid"><input className="input" placeholder="المنطقة" value={newZone.name} onChange={e=>setNewZone({...newZone,name:e.target.value})}/><input className="input" type="number" placeholder="الرسوم" value={newZone.fee} onChange={e=>setNewZone({...newZone,fee:Number(e.target.value)})}/><input className="input" placeholder="ETA" value={newZone.eta} onChange={e=>setNewZone({...newZone,eta:e.target.value})}/><button className="primary" onClick={saveZone}>إضافة منطقة</button></div></div>}

    {active==="drivers"&&<div className="panel"><h2>المندوبين</h2><div className="form-grid"><input className="input" placeholder="الاسم" value={newDriver.name} onChange={e=>setNewDriver({...newDriver,name:e.target.value})}/><input className="input" placeholder="الموبايل" value={newDriver.phone} onChange={e=>setNewDriver({...newDriver,phone:e.target.value})}/><input className="input" placeholder="المنطقة" value={newDriver.zone} onChange={e=>setNewDriver({...newDriver,zone:e.target.value})}/><button className="primary" onClick={saveDriver}>إضافة مندوب</button></div></div>}

    {active==="settlements"&&<div className="panel"><h2>التسويات</h2><div className="cards-grid"><div className="mini-card"><h3>مستحق التجار</h3><p>{money(merchant)}</p></div><div className="mini-card"><h3>Driver Earnings</h3><p>{money(driverDue)}</p></div></div></div>}
  </section>
 </div></main>
}
