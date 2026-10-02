'use client';
import AdminShell from '@/components/AdminShell';
import { get, post } from '@/lib/client';
import { useEffect, useState } from 'react';
export default function P(){const [s,setS]=useState<Record<string,string>>({});
  useEffect(()=>{get('/admin/settings',true).then((d:any)=>{const m={};d.forEach((x:any)=>m[x.key]=x.value);setS(m)})},[]);
  const save=async()=>{for(const[k,v]of Object.entries(s))await post('/admin/settings',{key:k,value:v},true);alert('ذخیره شد')};
  const F=(k:string,l:string,multiline=false)=><div className="mb-3"><label className="text-sm font-bold">{l}</label>
    {multiline?<textarea className="inp" rows={2} value={s[k]||''} onChange={e=>setS({...s,[k]:e.target.value})}/>
    :<input className="inp" value={s[k]||''} onChange={e=>setS({...s,[k]:e.target.value})}/>}</div>;
  return(<AdminShell title="تنظیمات سامانه"><div dir="rtl" className="grid md:grid-cols-2 gap-4 items-start">
    <div className="card">{F('examMin','مدت آزمون (دقیقه)')}{F('passPct','حد نصاب قبولی (٪)')}{F('bale','لینک ربات بله')}
    <button className="btn-p" onClick={save}>💾 ذخیره</button></div>
    <div className="card"><h3>متن‌های پیامک</h3>{F('smsOtp','کد تأیید',true)}{F('smsCode','ارسال کد آزمون',true)}{F('smsRemind','یادآوری انقضا',true)}</div>
  </div></AdminShell>)}
