import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// ویرایش استاندارد
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (body.title) data.title = body.title;
  if (body.groupName) data.groupName = body.groupName;
  if (body.profession) data.profession = body.profession;
  if (body.job) data.job = body.job;
  if (body.code) data.code = body.code;
  if (body.hours !== undefined) data.hours = +body.hours;
  if (body.price !== undefined) data.price = +body.price;
  if (body.description !== undefined) data.description = body.description;
  if (body.published !== undefined) data.published = Boolean(body.published);

  const updated = await prisma.standard.update({ where: { id: params.id }, data });
  await prisma.auditLog.create({ data: { actor: admin.email, action: 'STANDARD_UPDATE', entity: 'Standard', entityId: params.id } });
  return NextResponse.json({ ok: true, standard: updated });
}

// فعال/غیرفعال
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const std = await prisma.standard.findUnique({ where: { id: params.id } });
  if (!std) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const updated = await prisma.standard.update({ where: { id: params.id }, data: { published: !std.published } });
  return NextResponse.json({ ok: true, published: updated.published });
}

// حذف کامل استاندارد + تمام سوالات و فصل‌ها
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const std = await prisma.standard.findUnique({
    where: { id: params.id },
    include: { _count: { select: { chapters: true } } },
  });
  if (!std) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  // شمارش سوالات برای گزارش
  const questionCount = await prisma.question.count({
    where: { chapter: { standardId: params.id } },
  });

  try {
    // ۱. حذف پاسخ‌های آزمون‌های مرتبط
    const attempts = await prisma.examAttempt.findMany({
      where: { standardId: params.id },
      select: { id: true },
    });
    if (attempts.length > 0) {
      await prisma.examAnswer.deleteMany({
        where: { attemptId: { in: attempts.map((a) => a.id) } },
      });
      await prisma.examAttempt.deleteMany({ where: { standardId: params.id } });
    }

    // ۲. حذف کدهای آزمون
    await prisma.examCode.deleteMany({ where: { standardId: params.id } });

    // ۳. حذف سفارش‌ها
    await prisma.order.deleteMany({ where: { standardId: params.id } });

    // ۴. حذف استاندارد (فصل‌ها و سوالات به‌صورت خودکار cascade حذف می‌شوند)
    await prisma.standard.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        actor: admin.email, action: 'STANDARD_DELETE',
        entity: 'Standard', entityId: params.id,
        meta: { title: std.title, questionsDeleted: questionCount },
      },
    });

    return NextResponse.json({ ok: true, deletedQuestions: questionCount, deletedChapters: std._count.chapters });
  } catch (e: any) {
    return NextResponse.json({ error: 'DELETE_FAILED', message: e.message }, { status: 500 });
  }
}
