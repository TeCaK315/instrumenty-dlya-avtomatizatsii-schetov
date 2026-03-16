import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const DEMO_MODE = !process.env.OPENAI_API_KEY;

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const SYSTEM_PROMPT = `Создать счет на основе данных клиента и суммы.\\n\\nYour purpose: Автоматическое создание и отправка счетов на основе введенных данных.\\n\\nValue you provide: Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.\\n\\nYour key capabilities:\\n- Автоматизированное создание счетов\\n- Интеграция с популярными платежными системами\\n\\nYour advantage: Автоматизация и простота интеграции, что экономит время и снижает ошибки.\\n\\nOUTPUT INSTRUCTIONS:\\nYou must PRODUCE the actual product output — not analyze or describe it.\\nFor example: if you are an invoice generator, GENERATE the actual invoice.\\nIf you are a quiz maker, CREATE actual quiz questions.\\nIf you are a business plan generator, WRITE the actual business plan.\\n\\nALWAYS respond in English.\\n\\nReturn a JSON object with this structure:\\n{\\n  "title": "Title of the generated output",\\n  "executive_summary": "Brief 1-2 sentence summary of what was produced",\\n  "sections": [\\n    {\\n      "heading": "Section name",\\n      "content": "Detailed content for this section",\\n      "key_points": ["Important detail 1", "Important detail 2"]\\n    }\\n  ],\\n  "conclusion": "Summary or total / final note",\\n  "recommendations": ["Next step 1", "Next step 2"]\\n}\\n\\nMake the sections SPECIFIC to the actual product output.\\nUse as many sections as needed to fully represent the result.\\nBe detailed, professional, and immediately useful.`;

// Build a contextual demo response using actual user input
function buildDemoResponse(body: Record<string, any>): Record<string, any> {
  const inputSummary = `${body['client_name'] || 'N/A'}, ${body['invoice_amount'] || 'N/A'}, ${body['due_date'] || 'N/A'}`;
  return {
    title: `Tool — ${inputSummary}`,
    executive_summary: `Your . has been generated based on: ${inputSummary}. .. This is a demo preview — connect your OpenAI API key for AI-powered results.`,
    sections: [
      {
        heading: 'Details',
        content: `.. Based on your input: client_name: ${body['client_name'] || 'N/A'} | invoice_amount: ${body['invoice_amount'] || 'N/A'} | due_date: ${body['due_date'] || 'N/A'}.`,
        key_points: [`${body['client_name'] ? 'client_name: ' + body['client_name'] : 'client_name: pending'}`, `${body['invoice_amount'] ? 'invoice_amount: ' + body['invoice_amount'] : 'invoice_amount: pending'}`, `${body['due_date'] ? 'due_date: ' + body['due_date'] : 'due_date: pending'}`],
      },
      {
        heading: 'Details',
        content: `PayPal, Stripe   .. Based on your input: client_name: ${body['client_name'] || 'N/A'} | invoice_amount: ${body['invoice_amount'] || 'N/A'} | due_date: ${body['due_date'] || 'N/A'}.`,
        key_points: [`${body['client_name'] ? 'client_name: ' + body['client_name'] : 'client_name: pending'}`, `${body['invoice_amount'] ? 'invoice_amount: ' + body['invoice_amount'] : 'invoice_amount: pending'}`, `${body['due_date'] ? 'due_date: ' + body['due_date'] : 'due_date: pending'}`],
      }
    ],
    conclusion: `Your . for ${inputSummary} is ready. Connect an OpenAI API key in your environment variables for full AI-powered generation.`,
    recommendations: ['Add OPENAI_API_KEY to your environment variables for real AI output', 'Review all sections above', 'Export or share your results'],
  };
}

export async function POST(req: NextRequest) {
  try {
    // ─── Optional auth: works with or without Supabase ───
    let userId: string | null = null;
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;

      if (userId) {
        try {
          const { checkUsageLimit } = await import('@/lib/usage');
          const hasCapacity = await checkUsageLimit(userId, 'analyses');
          if (!hasCapacity) {
            return NextResponse.json(
              { error: 'Usage limit reached. Please upgrade your plan.' },
              { status: 429 }
            );
          }
        } catch {}
      }
    } catch {
      // Supabase not configured — continue without auth
    }

    const body = await req.json();
    const input = body.input || body.q || '';
    
    const missingFields: string[] = [];
    if (!body['client_name']) missingFields.push('client_name');
    if (!body['invoice_amount']) missingFields.push('invoice_amount');
    if (!body['due_date']) missingFields.push('due_date');
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // ─── DEMO MODE: return contextual results using actual input ───
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      return NextResponse.json({
        success: true,
        analysis: buildDemoResponse(body),
        output_format: 'report',
        demo: true,
      });
    }

    // ─── LIVE MODE: call OpenAI ───
    
    const contentToAnalyze = input;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Process the following input and produce the result:\n\nclient_name: ${body['client_name']}\ninvoice_amount: ${body['invoice_amount']}\ndue_date: ${body['due_date']}` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const resultText = completion.choices[0]?.message?.content || '{}';

    let analysis;
    try {
      analysis = JSON.parse(resultText);
    } catch {
      analysis = { summary: resultText };
    }

    // ─── Save to DB if Supabase is available ───
    if (userId) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { incrementUsage } = await import('@/lib/usage');

        await incrementUsage(userId, 'analyses');

        await supabase.from('analyses').insert({
          user_id: userId,
          input: typeof input === 'string' ? input : JSON.stringify(body),
          input_type: 'form',
          result: analysis,
          tokens_used: completion.usage?.total_tokens || 0,
          created_at: new Date().toISOString(),
        });

        await supabase
          .from('profiles')
          .update({ last_analysis_at: new Date().toISOString() })
          .eq('id', userId);
      } catch {
        // DB save failed — not critical, analysis still returned
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      output_format: 'report',
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
