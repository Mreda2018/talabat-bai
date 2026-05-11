"use client"

import {useEffect,useMemo,useState} from "react"
import {supabase} from "./lib/supabaseClient"
import {
  fallbackContent,
  fallbackCategories,
  fallbackZones,
  fallbackStores,
  fallbackProducts,
  MIN_ORDER,
  money,
  visual,
  textLines,
  categoryFromDb,
  zoneFromDb,
  storeFromDb,
  productFromDb
} from "./lib/helpers"

async function safeQuery(query){
  try{
    const result = await Promise.race([
      query,
      new Promise(resolve => setTimeout(() => resolve({data:null,error:{message:"timeout"}}), 4000))
    ])
    if(result?.error){
      console.error("Supabase error:", result.error)
      return null
    }
    return result?.data || null
  }catch(error){
    console.error("Supabase failed:", error)
    return null
  }
}

export default function Home(){
  const [content,setContent] = useState(fallbackContent)
  const [categories,setCategories] = useState(fallbackCategories)
  const [zones,setZones] = useState(fallbackZones)
  const [stores,setStores] = useState(fallbackStores)
  const [products,setProducts] = useState(fallbackProducts)
  const [dbConnected,setDbConnected] = useState(false)
  const [cat,setCat] = useState("all")
  const [selectedStore,setSelectedStore] = useState("all")
  const [query,setQuery] = useState("")
  const [filterOpen,setFilterOpen] = useState(false)
  const [cart,setCart] = useState([])
  const [drawer,setDrawer] = useState(false)
  const [checkout,setCheckout] = useState(false)
  const [customer,setCustomer] = useState({
    name:"",
    phone:"",
    address:"",
    notes:"",
    zoneId:"",
    replaceOption:"اتصل بي قبل الاستبدال"
  })

  async function load(){
    const [settings,cats,zs,sts,prs] = await Promise.all([
      safeQuery(supabase.from("app_settings").select("*").eq("key","content").maybeSingle()),
      safeQuery(supabase.from("categories").select("*").eq("is_active",true).order("sort_order")),
      safeQuery(supabase.from("zones").select("*").eq("is_active",true).order("created_at")),
      safeQuery(supabase.from("stores").select("*").order("created_at")),
      safeQuery(supabase.from("products").select("*").eq("is_active",true).order("created_at"))
    ])

    const catList=(cats||[]).map(categoryFromDb)
    const zoneList=(zs||[]).map(zoneFromDb)
    const storeList=(sts||[]).map(storeFromDb)
    const productList=(prs||[]).map(productFromDb)

    if(settings?.value) setContent({...fallbackContent,...settings.value})
    setCategories(catList.length?catList:fallbackCategories)
    setZones(zoneList.length?zoneList:fallbackZones)
    setStores(storeList.length?storeList:fallbackStores)
    setProducts(productList.length?productList:fallbackProducts)
    setDbConnected(!!(catList.length && zoneList.length && storeList.length && productList.length))

    const firstZone=(zoneList.length?zoneList:fallbackZones)[0]
    setCustomer(prev=>({...prev,zoneId:prev.zoneId || firstZone?.id || ""}))
  }

  useEffect(()=>{load()},[])

  const minimum=Number(content.minimumOrder||MIN_ORDER)

  const visibleStores = useMemo(()=>{
    let list = stores
    if(cat==="available") list = stores.filter(s=>s.isAvailable)
    else if(cat==="night") list = stores.filter(s=>s.isLate)
    else if(cat!=="all") list = stores.filter(s=>s.type===cat)

    if(query.trim()){
      const q=query.trim().toLowerCase()
      list=list.filter(s=>
        s.name.toLowerCase().includes(q) ||
        String(s.label||"").toLowerCase().includes(q) ||
        String(s.status||"").toLowerCase().includes(q)
      )
    }
    return list
  },[stores,cat,query])

  const visibleProducts = useMemo(()=>{
    const q=query.trim().toLowerCase()
    return products.filter(p=>{
      const store=stores.find(s=>s.id===p.storeId)
      const catOk = cat==="all" || (cat==="available" ? store?.isAvailable : (cat==="night" ? store?.isLate : p.cat===cat))
      const storeOk = selectedStore==="all" || p.storeId===selectedStore
      const qOk = !q || p.name.toLowerCase().includes(q) || store?.name?.toLowerCase().includes(q) || String(p.discount||"").toLowerCase().includes(q)
      return p.active!==false && catOk && storeOk && qOk
    })
  },[products,stores,cat,selectedStore,query])

  const hasSearch = query.trim().length > 0
  const cartItems = cart.map(i=>({...i,product:products.find(p=>p.id===i.id)})).filter(i=>i.product)
  const subtotal = cartItems.reduce((s,i)=>s+Number(i.product.price)*i.qty,0)
  const zone = zones.find(z=>z.id===customer.zoneId) || zones[0] || {id:null,fee:0,eta:""}
  const delivery = cartItems.length ? Number(zone.fee||0) : 0
  const total = subtotal + delivery
  const remaining = Math.max(0,minimum-subtotal)
  const canCheckout = subtotal >= minimum

  function addToCart(product){
    setCart(prev=>{
      const found=prev.find(i=>i.id===product.id)
      return found ? prev.map(i=>i.id===product.id?{...i,qty:i.qty+1}:i) : [...prev,{id:product.id,qty:1}]
    })
    setDrawer(true)
  }

  function changeQty(id,delta){
    setCart(prev=>prev.map(i=>i.id===id?{...i,qty:i.qty+delta}:i).filter(i=>i.qty>0))
  }

  async function placeOrder(){
    if(!dbConnected){
      alert("الداتابيس غير متصلة. شغّل ملف SUPABASE_FULL_SETUP.sql من Supabase ثم جرّب مرة أخرى.")
      return
    }
    if(subtotal<minimum){
      alert(`الحد الأدنى للطلب هو ${minimum} جنيه بدون رسوم التوصيل. أضف منتجات بقيمة ${remaining} جنيه.`)
      return
    }
    if(!customer.name || !customer.phone || !customer.address){
      alert("اكتب الاسم والموبايل والعنوان بالتفصيل")
      return
    }
    if(!confirm("سيتم مراجعة المنطقة ورسوم التوصيل قبل التنفيذ. هل تريد إرسال الطلب؟")) return

    const firstStore=stores.find(s=>s.id===cartItems[0].product.storeId)||stores[0]
    const items=cartItems.map(i=>({name:i.product.name,price:Number(i.product.price),qty:i.qty,img:i.product.img}))
    const commission=Math.round(subtotal*.05)
    const driverFee=Math.round(delivery*.6)
    const profit=commission+delivery-driverFee
    const id="BELA-"+Date.now().toString().slice(-6)

    const payload={
      id,
      customer_name:customer.name,
      customer_phone:customer.phone,
      customer_address:customer.address,
      customer_notes:customer.notes,
      replace_option:customer.replaceOption,
      zone_id:String(zone.id||"").startsWith("z-demo")?null:zone.id,
      zone_name:zone.name,
      eta:zone.eta,
      store_id:String(firstStore?.id||"").startsWith("s-demo")?null:firstStore?.id,
      store_name:firstStore?.name,
      merchant_phone:firstStore?.merchantPhone,
      items,
      subtotal,
      delivery,
      total,
      commission,
      driver_fee:driverFee,
      merchant_due:subtotal-commission,
      profit,
      status:"Pending Review",
      zone_review:"Pending",
      payment_status:"Unpaid",
      timeline:[
        {label:"تم استلام الطلب",time:new Date().toLocaleString("ar-EG"),status:"done"},
        {label:"في انتظار مراجعة المنطقة",time:new Date().toLocaleString("ar-EG"),status:"pending"}
      ]
    }

    const {error}=await supabase.from("orders").insert(payload)
    if(error){
      alert("فشل حفظ الطلب في Supabase: "+error.message)
      console.error(error)
      return
    }

    localStorage.setItem("belaLastOrderId",id)
    setCart([])
    setDrawer(false)
    window.location.href="/success"
  }

  return <main className="shop-app">
    <section className="shop-top">
      <div className="top-row">
        <div className="logo-box">{content.logoImage?<img src={content.logoImage}/>:<span>{textLines(content.logoText)}</span>}</div>
        <div className="address-box">
          <small>التوصيل إلى</small>
          <strong>📍 {content.location}</strong>
        </div>
        <button className="support-btn" onClick={()=>window.open(`https://wa.me/${content.supportPhone}`,"_blank")}>💬</button>
      </div>

      {!dbConnected && <div className="db-alert">وضع Demo — شغّل Supabase Setup لتفعيل الطلبات من كل الأجهزة.</div>}

      <div className="search-pro">
        <span>🔍</span>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن منتج أو متجر..." />
        {query && <button onClick={()=>setQuery("")}>×</button>}
      </div>

      <div className="hero-pro" style={{
        backgroundImage: content.bannerImage ? `linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.18)),url(${content.bannerImage})` : undefined,
        background: content.bannerImage ? undefined : `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})`
      }}>
        <div>
          <small>{textLines(content.bannerSmall)}</small>
          <h1>{textLines(content.bannerTitle)}</h1>
          <p>{textLines(content.bannerSubtitle)}</p>
          <button onClick={()=>setCat("available")}>{content.bannerButton}</button>
        </div>
        {!content.bannerImage && <div className="hero-emoji">{content.bannerIcon}</div>}
      </div>

      <div className="min-delivery">الحد الأدنى للطلب: <b>{money(minimum)}</b> بدون رسوم التوصيل</div>
    </section>

    <section className="shop-body">
      <div className="quick-tabs">
        {categories.map(c=><button key={c.id} className={cat===c.type?"active":""} onClick={()=>{setCat(c.type);setSelectedStore("all")}}><span>{c.icon}</span>{c.name}</button>)}
      </div>

      <div className="section-title">
        <h2>{hasSearch?"نتائج البحث":"المتاجر القريبة"}</h2>
        <button onClick={()=>setFilterOpen(!filterOpen)}>فلتر</button>
      </div>

      {filterOpen && <div className="filter-card">
        <select value={selectedStore} onChange={e=>setSelectedStore(e.target.value)}>
          <option value="all">كل المتاجر</option>
          {stores.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}
        </select>
        <select value={cat} onChange={e=>{setCat(e.target.value);setSelectedStore("all")}}>
          {categories.map(c=><option value={c.type} key={c.id}>{c.name}</option>)}
        </select>
      </div>}

      <div className="store-strip">
        <button className={selectedStore==="all"?"store-chip active":"store-chip"} onClick={()=>setSelectedStore("all")}>
          <div>✨</div><b>كل المتاجر</b><small>عرض الكل</small>
        </button>
        {visibleStores.map(s=><button key={s.id} className={selectedStore===s.id?"store-chip active":"store-chip"} onClick={()=>setSelectedStore(s.id)}>
          <div className="store-chip-logo">{visual(s.logo)}</div>
          <b>{s.name}</b>
          <small>{s.status} • {s.time}</small>
        </button>)}
      </div>

      {hasSearch && <div className="search-summary">
        <b>{visibleProducts.length}</b> منتج و <b>{visibleStores.length}</b> متجر مطابق لـ “{query}”
      </div>}

      <div className="section-title"><h2>منتجات مقترحة</h2><span>{visibleProducts.length} منتج</span></div>

      <div className="product-list">
        {visibleProducts.length===0 && <div className="empty-state">لا توجد نتائج. جرّب كلمة أخرى أو اختر قسم مختلف.</div>}
        {visibleProducts.map(p=>{
          const store=stores.find(s=>s.id===p.storeId)
          return <article className="product-row" key={p.id}>
            <div className="product-photo">{visual(p.img)}</div>
            <div className="product-info">
              <small>{store?.name || "متجر"}</small>
              <h3>{p.name}</h3>
              {p.discount && <em>{p.discount}</em>}
              <div className="price-line"><b>{money(p.price)}</b>{p.old? <del>{money(p.old)}</del>:null}</div>
            </div>
            <button className="plus-btn" onClick={()=>addToCart(p)}>+</button>
          </article>
        })}
      </div>
    </section>

    <nav className="shop-nav">
      <button className="active">🏠<span>الرئيسية</span></button>
      <button onClick={()=>setCat("available")}>✅<span>متاح</span></button>
      <button className="cart-main" onClick={()=>setDrawer(true)}>🛒{cartItems.length>0&&<b>{cartItems.reduce((s,i)=>s+i.qty,0)}</b>}</button>
      <button onClick={()=>setCat("night")}>🌙<span>ليلي</span></button>
      <button onClick={()=>window.location.href="/customer-login"}>👤<span>حسابي</span></button>
    </nav>

    {cartItems.length>0 && <button className="cart-bar" onClick={()=>setDrawer(true)}>
      <span>{cartItems.reduce((s,i)=>s+i.qty,0)} منتجات</span>
      <b>{money(total)}</b>
    </button>}

    {drawer && <div className="drawer-bg"><div className="drawer-pro">
      <div className="drawer-head"><h2>سلة الطلب</h2><button onClick={()=>{setDrawer(false);setCheckout(false)}}>×</button></div>
      {cartItems.length===0 && <div className="empty-state">السلة فارغة</div>}
      {cartItems.map(i=><div className="cart-line" key={i.id}>
        <div className="cart-img">{visual(i.product.img)}</div>
        <div><b>{i.product.name}</b><small>{money(i.product.price)}</small></div>
        <div className="qty"><button onClick={()=>changeQty(i.id,-1)}>-</button><span>{i.qty}</span><button onClick={()=>changeQty(i.id,1)}>+</button></div>
      </div>)}

      <div className="summary-box">
        {subtotal<minimum?<div className="limit-warning">أضف منتجات بقيمة {money(remaining)} لإتمام الطلب</div>:<div className="limit-ok">يمكنك إتمام الطلب الآن</div>}
        <p><span>المنتجات</span><b>{money(subtotal)}</b></p>
        <p><span>التوصيل</span><b>{money(delivery)}</b></p>
        <p><span>الوقت المتوقع</span><b>{zone.eta}</b></p>
        <h3><span>الإجمالي</span><b>{money(total)}</b></h3>
      </div>

      {!checkout ? <button className="checkout-btn" disabled={!canCheckout} onClick={()=>setCheckout(true)}>متابعة الطلب</button> : <div className="checkout-form">
        <select value={customer.zoneId} onChange={e=>setCustomer({...customer,zoneId:e.target.value})}>
          {zones.map(z=><option key={z.id} value={z.id}>{z.name} - {money(z.fee)}</option>)}
        </select>
        <div className="small-note">اختيار المنطقة سيتم مراجعته قبل التنفيذ، وقد يتم تعديل رسوم التوصيل حسب العنوان الفعلي.</div>
        <input placeholder="الاسم" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/>
        <input placeholder="رقم الموبايل" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/>
        <textarea placeholder="العنوان بالتفصيل: الشارع، أقرب علامة، رقم البيت" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/>
        <select value={customer.replaceOption} onChange={e=>setCustomer({...customer,replaceOption:e.target.value})}>
          <option>اتصل بي قبل الاستبدال</option>
          <option>استبدل بمنتج مشابه</option>
          <option>احذف المنتج غير المتوفر</option>
        </select>
        <textarea placeholder="ملاحظات اختيارية" value={customer.notes} onChange={e=>setCustomer({...customer,notes:e.target.value})}/>
        <button className="checkout-btn" onClick={placeOrder}>تأكيد الطلب - كاش عند الاستلام</button>
      </div>}
    </div></div>}
  </main>
}
