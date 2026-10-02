'use client';
import AdminShell from '@/components/AdminShell';
import SmartTable from '@/components/SmartTable';
import { fa } from '@/lib/client';
export default function P(){return(<AdminShell title="مدیریت کاربران">
  <SmartTable endpoint="/admin/users/list" csv="/admin/users/csv"
    searchPh="🔍 نام، کد ملی، موبایل…"
    cols={[
      {h:'نام',c:(r:any)=><b>{r.firstName} {r.lastName}</b>},
      {h:'کد ملی',c:(r:any)=><code dir="ltr">{fa(r.nationalId)}</code>},
      {h:'موبایل',c:(r:any)=><code dir="ltr">{fa(r.mobile)}</code>},
      {h:'شهرستان',c:(r:any)=>r.county},
      {h:'تاریخ عضویت',c:(r:any)=>new Intl.DateTimeFormat('fa-IR').format(new Date(r.createdAt))},
    ]} /></AdminShell>)}
