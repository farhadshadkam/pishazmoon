'use client';
import AdminShell from '@/components/AdminShell';
import SmartTable from '@/components/SmartTable';
import { post, fa } from '@/lib/client';
export default function AdminBank(){
  const approve=async(id:string)=>{await post(`/admin/questions/${id}/status`,{status:'PUBLISHED'},true);location.reload()};
  const reject=async(id:string)=>{await post(`/admin/questions/${id}/status`,{status:'REJECTED'},true);location.reload()};
  return(<AdminShell title="بانک سوالات">
    <div className="flex gap-2 mb-3 flex-wrap">
      <a href="/admin/bank?tab=list" className="btn-p btn-sm">فهرست سوالات</a>
      <a href="/admin/bank?tab=qa" className="btn-g btn-sm">صف بازبینی</a>
      <a href="/admin/gen" className="btn-t btn-sm">🤖 تولید با عامل هوشمند</a>
    </div>
    <SmartTable endpoint="/admin/questions/list" hier
      searchPh="🔍 متن سوال، فصل یا استاندارد…"
      filters={[{k:'status',l:'همه وضعیت‌ها',o:[['PENDING','در انتظار بازبینی'],['PUBLISHED','انتشار‌یافته'],['REJECTED','ردشده']]}]}
      cols={[
        {h:'متن',c:(r:any)=><span className="block max-w-[350px] whitespace-normal">{r.text}</span>},
        {h:'فصل',c:(r:any)=>r.chapter?.title},
        {h:'استاندارد',c:(r:any)=>r.chapter?.standard?.title},
        {h:'سطح',c:(r:any)=>r.cognitive},
        {h:'دشواری',c:(r:any)=>r.difficulty},
        {h:'وضعیت',c:(r:any)=><span className={r.status==='PUBLISHED'?'b-ok':r.status==='PENDING'?'b-warn':'b-bad'}>{r.status==='PUBLISHED'?'انتشار‌یافته':r.status==='PENDING'?'در انتظار بازبینی':'ردشده'}</span>},
        {h:'',c:(r:any)=>r.status==='PENDING'?(<span className="flex gap-1"><button className="btn-t btn-sm" onClick={()=>approve(r.id)}>✔</button><button className="btn-d btn-sm" onClick={()=>reject(r.id)}>✖</button></span>):null},
      ]} />
  </AdminShell>)}
