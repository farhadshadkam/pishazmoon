'use client';
import AdminShell from '@/components/AdminShell';
import SmartTable from '@/components/SmartTable';
import { money } from '@/lib/client';
export default function P(){return(<AdminShell title="مدیریت مالی">
  <SmartTable endpoint="/admin/orders/list" csv="/admin/orders/csv" hier
    searchPh="🔍 مرجع یا کاربر…"
    filters={[{k:'status',l:'همه وضعیت‌ها',o:[['PAID','موفق'],['FAILED','ناموفق'],['PENDING','در انتظار']]}]}
    cols={[
      {h:'مرجع',c:(r:any)=><code dir="ltr">{r.refId||'—'}</code>},
      {h:'کاربر',c:(r:any)=>r.user?`${r.user.firstName} ${r.user.lastName}`:'—'},
      {h:'استاندارد',c:(r:any)=>r.standard?.title},
      {h:'مبلغ',c:(r:any)=>money(r.amount)},
      {h:'وضعیت',c:(r:any)=><span className={r.status==='PAID'?'b-ok':'b-bad'}>{r.status==='PAID'?'موفق':r.status==='FAILED'?'ناموفق':'در انتظار'}</span>},
      {h:'تاریخ',c:(r:any)=>new Intl.DateTimeFormat('fa-IR').format(new Date(r.createdAt))},
    ]} /></AdminShell>)}
