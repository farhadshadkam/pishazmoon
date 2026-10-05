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

  const updated = await prisma.standard.update({
    where: { id: params.id },
    data,
  });

  await prisma.auditLog.create({
    data: { actor: admin.email, action: 'STANDARD_UPDATE', entity: 'Standard', entityId: params.id, meta: data },
  });

  return NextResponse.json({ ok: true, standard: updated });
}

// فعال/غیرفعال‌سازی
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const std = await prisma.standard.findUnique({ where: { id: params.id } });
  if (!std) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const updated = await prisma.standard.update({
    where: { id: params.id },
    data: { published: !std.published },
  });

  await prisma.auditLog.create({
    data: { actor: admin.email, action: std.published ? 'STANDARD_DEACTIVATE' : 'STANDARD_ACTIVATE', entity: 'Standard', entityId: params.id },
  });

  return NextResponse.json({ ok: true, published: updated.published });
}

// حذف نرم
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  await prisma.standard.update({
    where: { id: params.id },
    data: { published: false },
  });

  await prisma.auditLog.create({
    data: { actor: admin.email, action: 'STANDARD_SOFT_DELETE', entity: 'Standard', entityId: params.id },
  });

  return NextResponse.json({ ok: true });
}
