import Link from 'next/link';
import { prisma } from '@/lib/db';
export default async function PathPage({params}:{params:{code:string}}){
  const s=await prisma.standard.findUnique({where:{code:params.code}});
  return(<div dir="rtl" className="mt-6"><h1 className="text-2xl font-bold">مسیر مهارت‌آموزی: {s?.title}</h1>
  <div className="grid md:grid-cols-3 gap-4 mt-4">{['سطح ورودی','ادامه مسیر','مسیر تخصصی'].map((lv,i)=>(
  <div key={lv} className="card"><span className={i===0?'b-ok':'b-gray'}>{lv}</span><h3 className="mt-2">مسیر شغلی مرتبط</h3><p className="text-sm text-slate-400">شرح مسیر شغلی در نسخه کامل</p></div>))}</div></div>)}
