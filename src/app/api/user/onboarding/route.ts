import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Check onboarding status
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { onboardingCompleted: true },
    });

    return NextResponse.json({
      onboardingCompleted: user?.onboardingCompleted ?? false,
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status do onboarding' },
      { status: 500 }
    );
  }
}

// POST - Mark onboarding as completed
export async function POST() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { error: 'Erro ao completar onboarding' },
      { status: 500 }
    );
  }
}

// DELETE - Reset onboarding (to show again)
export async function DELETE() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { onboardingCompleted: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset onboarding error:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar onboarding' },
      { status: 500 }
    );
  }
}

