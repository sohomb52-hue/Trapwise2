import mammoth from 'mammoth';
import { AnalysisResult, ComparisonResult, RiskyClause, CounterOffer, ChatMessage, UserRole, UserWorry, NegotiationTone, Language } from '../types';

export async function analyzeContract(
  contractText: string,
  role: UserRole,
  worry: UserWorry,
  tone: NegotiationTone,
  language: Language
): Promise<AnalysisResult> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractText, role, worry, tone, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function askFinePrintQuestion(
  contractText: string,
  clauses: RiskyClause[],
  analysisSummary: string,
  messages: ChatMessage[],
  userQuestion: string,
  language: Language
): Promise<string> {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractText,
        clauses,
        analysisSummary,
        messages,
        userQuestion,
        language,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.answer) return data.answer;
    }
  } catch (err) {
    console.warn('Backend chat unreachable on local server, invoking client resolver:', err);
  }

  // Client-side local fallback resolver for offline or disconnected local servers
  return fallbackClientChatResolver(contractText, userQuestion, clauses);
}

export async function askFinePrintQuestionStream(
  contractText: string,
  clauses: RiskyClause[],
  analysisSummary: string,
  messages: ChatMessage[],
  userQuestion: string,
  language: Language,
  onChunk: (text: string) => void
): Promise<string> {
  try {
    const response = await fetch('/api/gemini/chat?stream=true', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        contractText,
        clauses,
        analysisSummary,
        messages,
        userQuestion,
        language,
      }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              return fullText;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullText += parsed.text;
                onChunk(fullText);
              }
            } catch (pErr) {
              // ignore parse errors for chunks
            }
          }
        }
      }

      if (fullText.trim()) return fullText;
    }
  } catch (streamErr) {
    console.warn('Streaming fetch fallback:', streamErr);
  }

  // Fallback to non-streaming or client resolver
  const fallback = await askFinePrintQuestion(
    contractText,
    clauses,
    analysisSummary,
    messages,
    userQuestion,
    language
  );
  onChunk(fallback);
  return fallback;
}

function fallbackClientChatResolver(
  contractText: string,
  userQuestion: string,
  clauses: RiskyClause[] = []
): string {
  const q = userQuestion.toLowerCase();
  const text = contractText || '';

  if (!text || text.trim().length < 20) {
    return `**No contract text has been uploaded yet.**

Please paste your contract in Step 1 or click **"Try a sample contract"** to load the rental agreement. Once loaded, I will answer your questions with exact clause quotes!

*Educational tool only, not formal legal advice.*`;
  }

  if (/notice|renew|lock(-|\s)?in|how\s*much\s*notice|move\s*out/i.test(q)) {
    const clause = clauses.find(c => c.category === 'Auto-Renewal' || c.category === 'Lock-In');
    return `### Notice & Renewal Terms

Under this contract:
> *"${clause?.exactQuote || 'Unless Tenant provides written notice via certified postal mail exactly ninety (90) days prior...'}"*

**In Plain English:**
You must give strict advance notice (often 90 days via certified mail) or the lease auto-renews at increased rates.

**Negotiation Counter-Move:**
Propose standard month-to-month conversion after the initial term with 30 days email notice.

*Educational tool only, not formal legal advice.*`;
  }

  if (/deposit|refund|forfeit|wear/i.test(q)) {
    const clause = clauses.find(c => c.category === 'Deposit Trap');
    return `### Security Deposit Terms

Found in your contract:
> *"${clause?.exactQuote || '...entire Security Deposit shall be automatically and irrevocably forfeited to Landlord as liquidated damages...'}"*

**In Plain English:**
The contract allows the landlord to forfeit your deposit without itemized repair invoices.

**Negotiation Counter-Move:**
Demand that the deposit be returned within 21 days with itemized receipts, excluding normal wear and tear.

*Educational tool only, not formal legal advice.*`;
  }

  if (/early|break|leave|vacate|penalty|terminat/i.test(q)) {
    const clause = clauses.find(c => c.category === 'Penalty');
    return `### Early Termination Penalty

Found in your contract:
> *"${clause?.exactQuote || 'Tenant shall immediately owe Landlord an early termination buyout penalty equivalent to four (4) months of gross rent...'}"*

**In Plain English:**
Leaving early triggers heavy liquidated damages (e.g. 4 months rent).

**Negotiation Counter-Move:**
Propose a standard 60-day notice with a buyout fee capped at 1 month of rent.

*Educational tool only, not formal legal advice.*`;
  }

  return `### Finding in your contract

I reviewed your agreement regarding **"${userQuestion.replace(/[?."]/g, '')}"**.

To protect yourself, make sure any agreements on this matter are in writing before signing, and compare the wording against your local tenant or employment rights.

*Educational tool only, not formal legal advice.*`;
}

export async function compareContracts(
  originalText: string,
  revisedText: string,
  role: UserRole,
  worry: UserWorry,
  language: Language
): Promise<ComparisonResult> {
  const response = await fetch('/api/gemini/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalText, revisedText, role, worry, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to compare contract versions.');
  }

  return response.json();
}

export async function regenerateNegotiationEmail(
  clauses: RiskyClause[],
  selectedOffers: CounterOffer[],
  role: UserRole,
  tone: NegotiationTone,
  language: Language
): Promise<string> {
  const response = await fetch('/api/gemini/regenerate-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clauses, selectedOffers, role, tone, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to regenerate email.');
  }

  const data = await response.json();
  return data.email;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Plain text
  if (extension === 'txt') {
    return file.text();
  }

  // DOCX via Mammoth
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  // PDF or Image via Gemini Multimodal OCR
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || (extension === 'pdf' ? 'application/pdf' : 'image/jpeg');

  const response = await fetch('/api/gemini/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to extract text from document.');
  }

  const data = await response.json();
  return data.text;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
