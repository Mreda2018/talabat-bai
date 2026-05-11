'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabaseClient'
import {money} from '../lib/helpers'
export default function Success(){const[o,setO]=useState(null);useEffect(()=>{async function f(){const id=localStorage.getItem('belaLastOrderId');if(id){const {data}=await supabase.from('orders').select('*').eq('id',id).maybeSingle();setO(data)}}f()},[]);return <main className="app"><div className="safe"><div className="success-card"><div className="success-icon">✅</div><h1>تم استلام طلبك</h1>{o?<><p>رقم الطلب</p><h2>{o.id}</h2><p>الإجمالي الحالي: <b>{money(o.total)}</b></p><p>الحالة: في انتظار مراجعة العنوان والمنطقة</p></>:<p>جاري تحميل الطلب...</p>}<button className="secondary" onClick={()=>window.location.href='/track'}>تتبع الطلب</button><button className="secondary" onClick={()=>window.location.href='/'}>العودة للرئيسية</button></div></div></main>}
