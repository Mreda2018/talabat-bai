import './globals.css'
import { Tajawal } from 'next/font/google'
const tajawal = Tajawal({ subsets:['arabic'], weight:['300','400','500','700','800','900'] })
export const metadata={title:'طلبات بيلا',description:'Talabat Bela Supabase'}
export default function RootLayout({children}){return <html lang="ar" dir="rtl"><body className={tajawal.className}>{children}</body></html>}
