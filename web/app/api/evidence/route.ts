import { NextRequest, NextResponse } from 'next/server';
import { RAG_KNOWLEDGE_BASE, retrieveRelevantKnowledge } from '@/lib/ragKnowledge';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  
  if (query) {
    const results = retrieveRelevantKnowledge(query);
    return NextResponse.json({ status: 'success', total: results.length, evidence: results });
  }

  return NextResponse.json({
    status: 'success',
    total: RAG_KNOWLEDGE_BASE.length,
    evidence: RAG_KNOWLEDGE_BASE
  });
}
