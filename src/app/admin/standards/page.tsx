'use client';
import AdminShell from '@/components/AdminShell';
import SmartTable from '@/components/SmartTable';
import { fa, money } from '@/lib/client';
export default function AdminStandards(){return(<AdminShell title="مدیریت استانداردها" >
  <SmartTable endpoint="/admin/standards/list" csv="/admin/standards/csv" hier
    searchPh="🔍 کد، عنوان، حرفه یا شغل…"
    cols={[
      {h:'کد',c:(r:any)=><code dir="ltr">{r.code}</code>},
      {h:'گروه',c:(r:any)=>r.groupName},
      {h:'حرفه',c:(r:any)=>r.profession},
      {h:'استاندارد',c:(r:any)=><b>{r.title}</b>},
      {h:'ساعت',c:(r:any)=>fa(r.hours)},
      {h:'قیمت',c:(r:any)=>money(r.price)},
      {h:'وزن‌ها',c:(r:any)=>{const w=r.chapters?.reduce((a:number,c:any)=>a+c.weight,0)||0;return <span className={w===40?'b-ok':'b-bad'}>{fa(w)}/۴۰</span>}},
      {h:'',c:(r:any)=><a href={`/admin/standards/${r.id}/edit`} className="btn-g btn-sm">ویرایش</a>},
    ]} />
</AdminShell>)}
