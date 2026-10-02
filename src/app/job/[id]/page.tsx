import { prisma } from '@/lib/db';
export default async function JobPage({params}:{params:{id:string}}){
  const j=await prisma.setting.findUnique({where:{key:`job:${params.id}`}});
  return(<div dir="rtl" className="mt-6"><h1 className="text-2xl font-bold">{j?.value||'راهنمای اشتغال'} <span className="b-info ml-2">راهنمای اشتغال</span></h1>
  <div className="card mt-4"><p className="text-sm">متن کامل راهنمای اشتغال از پنل ادمین قابل ویرایش است و در این صفحه نمایش داده می‌شود.</p></div></div>)}
