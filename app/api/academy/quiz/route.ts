import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🎓 Explicit Data Interfaces
interface QuizOption {
  id: string;
  text: string;
}

interface DbQuestion {
  id: string;
  phase: number;
  text: string;
  options: QuizOption[] | unknown;
  correctOptionId: string;
  category: string;
  createdAt?: Date;
}

// 🎲 Fisher-Yates Array Shuffle Utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// -----------------------------------------------------------------------------
// 🟢 GET: FETCH RANDOMIZED & SHUFFLED QUIZ QUESTIONS
// -----------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = parseInt(searchParams.get('phase') || '1', 10);

    const questionCountMap: Record<number, number> = { 1: 5, 2: 10, 3: 15 };
    const limit = questionCountMap[phase] || 5;

    // Type-safe access to Prisma Client
    const db = prisma as any;
    if (!db.quizQuestion) {
      return NextResponse.json(
        { error: 'Prisma Client missing quizQuestion model. Run npx prisma generate.' },
        { status: 500 }
      );
    }

    // Fetch questions for requested phase
    const allQuestions: DbQuestion[] = await db.quizQuestion.findMany({
      where: { phase },
    });

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json(
        { error: `No questions found in pool for Phase ${phase}` },
        { status: 404 }
      );
    }

    // 1. Pick N random questions from the pool
    const selectedQuestions = shuffleArray(allQuestions).slice(0, limit);

    // 2. Shuffle option order & strip correctOptionId for client security
    const sanitizedQuestions = selectedQuestions.map((q: DbQuestion) => {
      const rawOptions = (q.options as QuizOption[]) || [];
      const shuffledOptions = shuffleArray(rawOptions);

      return {
        id: q.id,
        phase: q.phase,
        category: q.category,
        text: q.text,
        options: shuffledOptions,
      };
    });

    return NextResponse.json({
      phase,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server Error' }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// 🔴 POST: EVALUATE ASSESSMENT SUBMISSION
// -----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phase, userPasskeyId, answers, passkeyAssertion } = body as {
      phase: number;
      userPasskeyId: string;
      answers: { questionId: string; selectedOptionId: string }[];
      passkeyAssertion?: string;
    };

    if (!phase || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid submission payload' }, { status: 400 });
    }

    const db = prisma as any;
    const questionIds = answers.map((a) => a.questionId);
    
    // Fetch correct answers directly from database
    const dbQuestions: DbQuestion[] = await db.quizQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    const questionMap = new Map(dbQuestions.map((q: DbQuestion) => [q.id, q.correctOptionId]));

    let correctCount = 0;
    const totalCount = answers.length;

    answers.forEach((ans) => {
      const correctId = questionMap.get(ans.questionId);
      if (correctId && correctId === ans.selectedOptionId) {
        correctCount += 1;
      }
    });

    const scorePercentage = (correctCount / totalCount) * 100;
    const passThresholdMap: Record<number, number> = { 1: 100, 2: 80, 3: 87 };
    const requiredScore = passThresholdMap[phase] || 100;
    const passed = scorePercentage >= requiredScore;

    // Record progress in database
    if (userPasskeyId && db.academyProgress) {
      await db.academyProgress.upsert({
        where: {
          userPasskeyId_phase: { userPasskeyId, phase },
        },
        update: {
          score: scorePercentage,
          passed,
          passkeyAssertion: passkeyAssertion || null,
          completedAt: new Date(),
        },
        create: {
          userPasskeyId,
          phase,
          score: scorePercentage,
          passed,
          passkeyAssertion: passkeyAssertion || null,
        },
      });
    }

    return NextResponse.json({
      phase,
      score: scorePercentage,
      correctAnswers: correctCount,
      totalQuestions: totalCount,
      passed,
      requiredScore,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Evaluation Error' }, { status: 500 });
  }
}