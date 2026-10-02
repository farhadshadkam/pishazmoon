'use client';
import AdminShell from '@/components/AdminShell';
import SmartTable from '@/components/SmartTable';
import { fa } from '@/lib/client';
export default function P(){return(<AdminShell title="گزارش آزمون‌دهندگان">
  <SmartTable endpoint="/admin/attempts/list" csv="/admin/attempts/csv" hier
    searchPh="🔍 نام آزمون‌دهنده یا استاندارد…"
    filters={[{k:'result',l:'همه نتایج',o:[['pass','قبول'],['fail','مردود']]}]}
    cols={[
      {h:'آزمون‌دهنده',c:(r:any)=><b>{r.user?.firstName} {r.user?.lastName}</b>},
      {h:'استاندارد',c:(r:any)=>r.standard?.title},
      {h:'تاریخ',c:(r:any)=>new Intl.DateTimeFormat('fa-IR').format(new Date(r.startedAt))},
      {h:'نمره',c:(r:any)=><b>{fa(r.score)}</b>},
      {h:'نتیجه',c:(r:any)=><span className={r.passed?'b-ok':'b-bad'}>{r.passed?'قبول':'مردود'}</span>},
      {h:'',c:(r:any)=><a href={`/report/${r.id}`} className="btn-g btn-sm">کارنامه</a>},
    ]} /></AdminShell>)}
