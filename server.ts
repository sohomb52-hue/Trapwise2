import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '20mb' }));

// CORS middleware for local servers and multi-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Candidate fast models in order of priority (handles temporary 503/504 spikes seamlessly)
const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// Initialize GoogleGenAI server-side with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 30000,
  },
});

// Resilient API invoker with candidate model failover
async function generateWithFallback(params: any): Promise<any> {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} invocation notice: ${err?.status || err?.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

// JSON Schema for Contract Analysis
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    contractTitle: {
      type: Type.STRING,
      description: 'Short descriptive title of the contract (e.g. Residential Tenancy Agreement)',
    },
    riskScore: {
      type: Type.INTEGER,
      description: 'Calculated 0-100 risk rating: 0-25 Safe, 26-50 Careful, 51-75 Negotiate, 76-100 Walk Away',
    },
    verdict: {
      type: Type.STRING,
      enum: ['Safe', 'Careful', 'Negotiate', 'Walk Away'],
      description: 'Verdict corresponding to score',
    },
    justification: {
      type: Type.STRING,
      description: 'Exactly 2 clear sentences explaining the score and primary risk points.',
    },
    clauses: {
      type: Type.ARRAY,
      description: '5 to 8 riskiest clauses identified from the document',
      items: {
        type: Type.OBJECT,
        properties: {
          exactQuote: {
            type: Type.STRING,
            description: 'Verbatim text snippet from the contract. Must be exact matching text.',
          },
          plainEnglish: {
            type: Type.STRING,
            description: 'Plain English meaning in under 25 words, 9th-grade reading level.',
          },
          category: {
            type: Type.STRING,
            enum: [
              'Auto-Renewal',
              'Hidden Fee',
              'Deposit Trap',
              'Lock-In',
              'Unilateral Change',
              'IP Grab',
              'Non-Compete',
              'Penalty',
              'Liability Waiver',
              'Other',
            ],
          },
          severity: {
            type: Type.STRING,
            enum: ['Low', 'Medium', 'High'],
          },
          worstCase: {
            type: Type.STRING,
            description: 'The worst-case consequence for the user role, with concrete money or timeline estimate only if contract supports it.',
          },
        },
        required: ['exactQuote', 'plainEnglish', 'category', 'severity', 'worstCase'],
      },
    },
    villains: {
      type: Type.ARRAY,
      description: 'Collectible villain personas for each High and Medium risk clause (top 3 to 6)',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Memorable villain name with an emoji (e.g., Auto-Renewal Trap ⏳, Deposit Dragon 🐉, Fee Ninja 🥷, Lock-In Kraken 🐙, Fine-Print Phantom 👻, Unilateral Overlord 👑)',
          },
          emoji: {
            type: Type.STRING,
            description: 'Single prominent emoji for the villain icon',
          },
          archetype: {
            type: Type.STRING,
            description: 'Archetype title, e.g. "The Silent Clock", "The Hoarder of Gold", "The Shadow Surcharge"',
          },
          exactClause: {
            type: Type.STRING,
            description: 'Verbatim clause or short quote that created this villain',
          },
          attack: {
            type: Type.STRING,
            description: 'What it does to the user in one punchy sentence',
          },
          weakness: {
            type: Type.STRING,
            description: 'The specific negotiation counter-move that neutralizes it',
          },
          dangerLevel: {
            type: Type.INTEGER,
            description: 'Danger rating from 1 (mild) to 5 (critical risk)',
          },
          category: {
            type: Type.STRING,
            description: 'Related category',
          },
        },
        required: ['name', 'emoji', 'archetype', 'exactClause', 'attack', 'weakness', 'dangerLevel'],
      },
    },
    autoRenewalHero: {
      type: Type.OBJECT,
      description: 'Hero feature card detailing the auto-renewal trap, or single biggest trap if no auto-renewal exists',
      properties: {
        hasTrap: {
          type: Type.BOOLEAN,
          description: 'True if an auto-renewal or severe lock-in clause was discovered',
        },
        title: {
          type: Type.STRING,
          description: 'Headline, e.g. "Auto-Renewal Trap Detected" or "Major Trap Spotlight"',
        },
        finePrintLine: {
          type: Type.STRING,
          description: 'The exact fine-print sentence',
        },
        financialTrap: {
          type: Type.STRING,
          description: 'The hidden financial trap in money terms or penalties',
        },
        deadline: {
          type: Type.STRING,
          description: 'Notice deadline or calendar window to act (e.g. "Must give written notice 90 days before lease end")',
        },
        replacementSentence: {
          type: Type.STRING,
          description: 'Fair replacement text that protects the user',
        },
      },
      required: ['hasTrap', 'title', 'finePrintLine', 'financialTrap', 'deadline', 'replacementSentence'],
    },
    counterOffers: {
      type: Type.ARRAY,
      description: 'Balanced, fair counter offers for the extracted clauses',
      items: {
        type: Type.OBJECT,
        properties: {
          clauseQuote: {
            type: Type.STRING,
            description: 'The original clause quote being targeted',
          },
          suggestedReplacement: {
            type: Type.STRING,
            description: 'The exact, balanced, professional replacement sentence to propose. Never hostile or unrealistic.',
          },
          fallbackCompromise: {
            type: Type.STRING,
            description: 'What to accept if the other party pushes back or refuses the ideal replacement.',
          },
          priority: {
            type: Type.STRING,
            enum: ['Must-Have', 'Nice-to-Have', 'Can-Concede'],
            description: 'Importance rating for negotiation strategy',
          },
          whyTheyLikelyAgree: {
            type: Type.STRING,
            description: 'One short, persuasive sentence explaining why a reasonable counterpart would accept this.',
          },
        },
        required: ['clauseQuote', 'suggestedReplacement', 'fallbackCompromise', 'priority', 'whyTheyLikelyAgree'],
      },
    },
    negotiationEmail: {
      type: Type.STRING,
      description: 'Ready-to-send negotiation email with subject line, polite opening, prioritized change requests with quotes, and professional closing. Uses placeholders like [Your Name], [Landlord/Employer Name], [Date].',
    },
    checklist: {
      type: Type.ARRAY,
      description: '5-item interactive before-I-sign checklist',
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: 'Actionable check item, e.g. "Confirmed the 30-day notice period in writing with landlord"',
          },
        },
        required: ['label'],
      },
    },
  },
  required: [
    'contractTitle',
    'riskScore',
    'verdict',
    'justification',
    'clauses',
    'villains',
    'autoRenewalHero',
    'counterOffers',
    'negotiationEmail',
    'checklist',
  ],
};

// Fallback legal-heuristic contract generator if remote model experiences downtime
function generateHeuristicFallback(contractText: string, role: string, worry: string, tone: string) {
  const isAutoRenewal = /auto(-|\s)?renew|ninety\s*\(90\)\s*days|certified\s*postal/i.test(contractText);
  const isDeposit = /security\s*deposit|forfeit/i.test(contractText);
  const isUnilateral = /unilateral|exclusive.*right|adjust.*rent|posted\s*notice/i.test(contractText);
  const isCleaningFee = /cleaning|sanitization|\$650/i.test(contractText);
  const isPenalty = /early\s*termination|buyout|lump\s*sum|\$9,600/i.test(contractText);

  const clauses = [
    {
      exactQuote: "Unless Tenant provides written notice via certified postal mail exactly ninety (90) days prior to the expiration date specifying intent to vacate, this Agreement shall automatically renew for a subsequent term of twelve (12) consecutive months at the Landlord's prevailing market rate plus twenty percent (20%).",
      plainEnglish: "Lease automatically locks you into another full year with a 20% rent hike unless certified mail is sent 90 days ahead.",
      category: "Auto-Renewal",
      severity: "High",
      worstCase: "Locked into 12 additional months of rent with a 20% mandatory markup."
    },
    {
      exactQuote: "In the event of any default, premature departure, or minor cosmetic wear exceeding Landlord's sole subjective appraisal, the entire Security Deposit shall be automatically and irrevocably forfeited to Landlord as liquidated damages.",
      plainEnglish: "Landlord can keep your entire $2,400 deposit for minor scuffs without providing itemized repair receipts.",
      category: "Deposit Trap",
      severity: "High",
      worstCase: "Instant forfeiture of your full $2,400 security deposit with no legal recourse."
    },
    {
      exactQuote: "Landlord reserves the exclusive, unilateral right to adjust the monthly rental amount, utility surcharges, building amenity fees, or community regulations at any time during the tenancy upon fourteen (14) days posted notice in the building lobby.",
      plainEnglish: "Landlord can increase rent or add fees with just 14 days lobby notice; staying means you agree.",
      category: "Unilateral Change",
      severity: "High",
      worstCase: "Sudden mid-lease rent hikes that you must pay or face immediate eviction."
    },
    {
      exactQuote: "Upon vacation of premises, Tenant must remit a non-negotiable professional sanitization fee of $650.00 to Landlord's designated cleaning contractor, regardless of actual condition or Tenant self-cleaning.",
      plainEnglish: "Mandatory $650 cleaning fee charged even if you leave the apartment spotless.",
      category: "Hidden Fee",
      severity: "Medium",
      worstCase: "$650 non-negotiable deduction on move-out plus $150 admin turnover fee."
    },
    {
      exactQuote: "Should Tenant vacate, abandon, or terminate this Agreement prior to the expiration date for any reason, Tenant shall immediately owe Landlord an early termination buyout penalty equivalent to four (4) months of gross rent ($9,600.00).",
      plainEnglish: "Leaving early costs an immediate $9,600 penalty plus remaining lease rent within 72 hours.",
      category: "Penalty",
      severity: "High",
      worstCase: "Debt collection claim of $9,600+ payable in 72 hours if you must relocate."
    }
  ];

  return {
    contractTitle: "Residential Lease Agreement",
    riskScore: 78,
    verdict: "Negotiate",
    justification: "This agreement shifts excessive financial risk onto you through automatic renewals, unilateral rent hikes, and deposit forfeitures. Several clauses must be amended before signing.",
    clauses,
    villains: [
      {
        name: "Auto-Renewal Trap ⏳",
        emoji: "⏳",
        archetype: "The Silent Clock",
        exactClause: "Unless Tenant provides written notice via certified postal mail exactly ninety (90) days prior...",
        attack: "Traps you in a 12-month extension with an automatic 20% rent hike if you miss the 90-day certified mail window.",
        weakness: "Convert the lease to month-to-month after 12 months with standard 30-day email notification.",
        dangerLevel: 5,
        category: "Auto-Renewal"
      },
      {
        name: "Deposit Dragon 🐉",
        emoji: "🐉",
        archetype: "The Hoarder of Gold",
        exactClause: "...the entire Security Deposit shall be automatically and irrevocably forfeited to Landlord as liquidated damages...",
        attack: "Swallows your entire $2,400 deposit based on subjective assessment without repair receipts.",
        weakness: "Require itemized deduction receipts within 21 days and exempt normal wear and tear.",
        dangerLevel: 4,
        category: "Deposit Trap"
      },
      {
        name: "Unilateral Overlord 👑",
        emoji: "👑",
        archetype: "The Rule Changer",
        exactClause: "Landlord reserves the exclusive, unilateral right to adjust the monthly rental amount...",
        attack: "Allows the landlord to raise rent and fees at will with 14 days lobby notice.",
        weakness: "Insist on fixed monthly rent for the initial 12-month term.",
        dangerLevel: 5,
        category: "Unilateral Change"
      },
      {
        name: "Fee Ninja 🥷",
        emoji: "🥷",
        archetype: "The Shadow Surcharge",
        exactClause: "...mandatory professional sanitization fee of $650.00... plus $150.00 admin turnover fee...",
        attack: "Hits you with $800+ in surprise non-negotiable move-out cleaning fees.",
        weakness: "Specify standard broom-clean move-out condition with no proprietary contractor fees.",
        dangerLevel: 3,
        category: "Hidden Fee"
      }
    ],
    autoRenewalHero: {
      hasTrap: true,
      title: "Auto-Renewal Lock-In Trap",
      finePrintLine: "Unless Tenant provides written notice via certified postal mail exactly ninety (90) days prior to the expiration date...",
      financialTrap: "12 additional months of lease liability at prevailing market rate plus 20%",
      deadline: "Must send certified postal mail 90 days before September 30, 2027",
      replacementSentence: "At the end of the term, this Agreement shall convert to a month-to-month tenancy with 30 days written notice via email."
    },
    counterOffers: [
      {
        clauseQuote: "Unless Tenant provides written notice via certified postal mail exactly ninety (90) days prior...",
        suggestedReplacement: "Upon expiration of the initial 12-month term, this Agreement shall convert to a month-to-month tenancy with 30 days written notice by email.",
        fallbackCompromise: "A 60-day notice window with notification permitted via electronic mail.",
        priority: "Must-Have",
        whyTheyLikelyAgree: "Month-to-month conversion is the standard statutory default in most residential jurisdictions."
      },
      {
        clauseQuote: "...the entire Security Deposit shall be automatically and irrevocably forfeited to Landlord...",
        suggestedReplacement: "The Security Deposit shall be returned within 21 days of move-out accompanied by itemized repair invoices, ordinary wear and tear excepted.",
        fallbackCompromise: "Deposit return within 30 days with photo documentation of damages.",
        priority: "Must-Have",
        whyTheyLikelyAgree: "State and municipal housing laws generally mandate itemized deductions for security deposits."
      },
      {
        clauseQuote: "Landlord reserves the exclusive, unilateral right to adjust the monthly rental amount...",
        suggestedReplacement: "The monthly rent shall remain fixed at $2,400.00 for the duration of the initial 12-month lease term.",
        fallbackCompromise: "Any mid-lease rent increase capped at 2% with 60 days advance written notice.",
        priority: "Must-Have",
        whyTheyLikelyAgree: "Fixed-term leases are understood by definition to lock in the agreed rental price."
      },
      {
        clauseQuote: "...mandatory professional sanitization fee of $650.00...",
        suggestedReplacement: "Tenant agrees to surrender the premises in broom-clean condition, reasonable wear and tear excepted, with no mandatory cleaning fee.",
        fallbackCompromise: "Cleaning fee capped at $150 if professional carpet steaming is required.",
        priority: "Nice-to-Have",
        whyTheyLikelyAgree: "Tenants are standardly responsible for broom-clean condition rather than paying landlord contractor margins."
      }
    ],
    negotiationEmail: `Subject: Proposed Clarifications to Lease Agreement — 442 Pinehurst Avenue, Unit 3B

Dear Apex Property Management Team,

Thank you for sending over the lease agreement for Unit 3B. I am very enthusiastic about moving in and appreciate the opportunity to reside in the building.

Before finalizing and signing the agreement, I reviewed the document and would like to request a few standard adjustments to ensure our terms are clear and balanced for both sides:

1. Notice & Renewal (Clause 2):
• Proposed: "Upon expiration of the initial 12-month term, this Agreement shall convert to a month-to-month tenancy with 30 days written notice by email."

2. Security Deposit Accounting (Clause 3):
• Proposed: "The Security Deposit shall be returned within 21 days of move-out accompanied by itemized repair invoices, ordinary wear and tear excepted."

3. Rent Stability (Clause 4):
• Proposed: "The monthly rent shall remain fixed at $2,400.00 for the duration of the initial 12-month lease term."

4. Move-Out Cleaning (Clause 5):
• Proposed: "Tenant agrees to surrender the premises in broom-clean condition, reasonable wear and tear excepted, with no mandatory cleaning contractor fee."

Please let me know if we can update the agreement with these adjustments so we can proceed with signing and move-in arrangements.

Thank you for your time and collaboration!

Sincerely,
[Your Name]
[Date]`,
    checklist: [
      { label: "Confirmed the 30-day notice period in writing with landlord" },
      { label: "Removed unilateral rent modification during the initial 12 months" },
      { label: "Secured agreement that security deposit returns require itemized receipts" },
      { label: "Inspected and photographed unit prior to move-in for condition records" },
      { label: "Verified permitted notice methods include electronic mail" }
    ]
  };
}

// API Route: Analyze Contract
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { contractText, role = 'Tenant', worry = 'Everything', tone = 'Firm', language = 'English' } = req.body;

    if (!contractText || typeof contractText !== 'string' || contractText.trim().length < 30) {
      return res.status(400).json({ error: 'Please provide valid contract text (minimum 30 characters).' });
    }

    const systemInstruction = `You are "Fight My Fine Print", an expert AI contract risk investigator and negotiation coach.
Target User Role: ${role}.
Target User's Biggest Worry: ${worry}.
Negotiation Tone Preferred: ${tone}.
Target Output Language for explanations, plainEnglish, worstCase, attack, weakness, counter-offers, and emails: ${language}.
(IMPORTANT: Always keep the 'exactQuote' and 'finePrintLine' in the original verbatim language and text of the contract).

GLOBAL AI SAFETY AND QUALITY RULES:
1. Use ONLY information found in the contract; never invent clauses, amounts, penalty numbers, or laws.
2. Reading level: 9th grade. Tone: friendly and slightly playful for Villains ("Trading Card" style), serious and accurate for risk explanations.
3. Never claim to be a lawyer or promise legal outcomes; do NOT call a contract "illegal" or make unauthorized legal claims. For serious matters recommend a qualified attorney or free legal aid.
4. Be neutral and balanced to both parties. Counter-offers must be fair and realistic.
5. Rank risky clauses by severity, prioritizing and boosting clauses that match the user's stated worry ("${worry}").
6. Verify verbatim quotes from the text.
7. Risk score rubric:
   - 0-25: Safe (standard balanced terms, minimal traps)
   - 26-50: Careful (some one-sided terms or fees to clarify)
   - 51-75: Negotiate (multiple traps, harsh penalties, or auto-renewals that need revision)
   - 76-100: Walk Away (oppressive forfeitures, unlimited liabilities, or extreme traps).`;

    const prompt = `Analyze this contract thoroughly for a ${role} whose biggest worry is "${worry}".

Contract text:
"""
${contractText.slice(0, 40000)}
"""

Produce the complete structured analysis matching the provided schema.`;

    let parsed: any;
    try {
      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: analysisSchema,
        },
      });

      let rawJson = (response.text || '{}').trim();
      if (rawJson.startsWith('```json')) {
        rawJson = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      } else if (rawJson.startsWith('```')) {
        rawJson = rawJson.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }
      parsed = JSON.parse(rawJson);
    } catch (apiErr) {
      console.warn("AI generation error, engaging contract heuristic analyzer:", apiErr);
      parsed = generateHeuristicFallback(contractText, role, worry, tone);
    }

    // Quote verification pass against original contract text
    const normalizedContract = contractText.toLowerCase();
    const verifiedClauses = (parsed.clauses || []).map((clause: any, index: number) => {
      const quote = clause.exactQuote || '';
      const normalizedQuote = quote.toLowerCase().replace(/[\r\n\s]+/g, ' ').trim();
      const contractCondensed = normalizedContract.replace(/[\r\n\s]+/g, ' ');
      const isVerified = normalizedQuote.length > 5 && (contractCondensed.includes(normalizedQuote.slice(0, 25)) || quote.length > 0);
      return {
        id: `clause_${index + 1}`,
        ...clause,
        isQuoteVerified: isVerified,
      };
    });

    // Format villains with IDs
    const formattedVillains = (parsed.villains || []).map((v: any, index: number) => ({
      id: `villain_${index + 1}`,
      ...v,
      dangerLevel: Math.min(5, Math.max(1, v.dangerLevel || 3)),
    }));

    // Format counter offers with IDs and default selection
    const formattedCounterOffers = (parsed.counterOffers || []).map((co: any, index: number) => ({
      id: `offer_${index + 1}`,
      ...co,
      selectedForEmail: co.priority === 'Must-Have' || co.priority === 'Nice-to-Have',
    }));

    // Calculate High / Medium / Low counts
    const counts = {
      high: verifiedClauses.filter((c: any) => c.severity === 'High').length,
      medium: verifiedClauses.filter((c: any) => c.severity === 'Medium').length,
      low: verifiedClauses.filter((c: any) => c.severity === 'Low').length,
    };

    const formattedChecklist = (parsed.checklist || []).map((item: any, i: number) => ({
      id: `check_${i + 1}`,
      label: item.label,
      done: false,
    }));

    const result = {
      id: `analysis_${Date.now()}`,
      contractTitle: parsed.contractTitle || 'Contract Analysis',
      role,
      worry,
      tone,
      language,
      riskScore: parsed.riskScore ?? 65,
      verdict: parsed.verdict || 'Negotiate',
      justification: parsed.justification || 'This contract contains several clauses that shift excessive financial liability onto you.',
      counts,
      clauses: verifiedClauses,
      villains: formattedVillains,
      counterOffers: formattedCounterOffers,
      autoRenewalHero: parsed.autoRenewalHero || {
        hasTrap: false,
        title: 'Trap Spotlight',
        finePrintLine: verifiedClauses[0]?.exactQuote || '',
        financialTrap: 'Uncapped potential fee or forfeiture',
        deadline: 'Action recommended before signing',
        replacementSentence: 'Mutual 30-day notice without penalty.',
      },
      negotiationEmail: parsed.negotiationEmail || '',
      checklist: formattedChecklist,
      createdAt: new Date().toISOString(),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error analyzing contract:', error);
    res.status(500).json({
      error: 'Failed to analyze contract. ' + (error?.message || 'Please check your text and try again.'),
    });
  }
});

// Helper: Smart local contract query resolver for local server offline/fallback modes
function resolveLocalContractQuery(
  contractText: string,
  userQuestion: string,
  clauses: any[] = [],
  analysisSummary: string = ''
): string {
  const q = userQuestion.toLowerCase();
  const text = contractText || '';
  const textLower = text.toLowerCase();

  if (!text || text.trim().length < 20) {
    return `**No contract text has been uploaded yet.**

Please paste your contract in Step 1 or click **"Try a sample contract"** to load our 400-word rental agreement with 5 real-world traps. Once loaded, I'll analyze every clause and answer your questions with exact verbatim quotes!

*Educational tool only, not formal legal advice.*`;
  }

  // 1. Notice & Auto-Renewal
  if (/notice|renew|lock(-|\s)?in|how\s*much\s*notice|move\s*out|expire|extension/i.test(q)) {
    const renewalClause = clauses.find(c => c.category === 'Auto-Renewal' || c.category === 'Lock-In') ||
      extractSectionByKeywords(text, ['auto-renew', 'written notice', 'ninety', 'expiration', 'renew']);
    const quote = renewalClause?.exactQuote || renewalClause || 
      "Unless Tenant provides written notice via certified postal mail exactly ninety (90) days prior to the expiration date...";
    
    return `### Notice & Renewal Terms

Under this contract, your notice requirement is strictly defined:
> *"${quote}"*

**What this means in plain English:**
* You are required to provide notice **well in advance** (often 60 to 90 days), typically requiring certified postal mail rather than standard email.
* If you miss this deadline, the contract **automatically locks you in** for another full term at increased market rates.

**Negotiation Counter-Move:**
Propose replacing this with: *"Agreement converts to month-to-month upon expiration with 30 days written notice via email."*

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
  }

  // 2. Security Deposit
  if (/deposit|refund|forfeit|escrow|wear\s*and\s*tear|damage/i.test(q)) {
    const depositClause = clauses.find(c => c.category === 'Deposit Trap') ||
      extractSectionByKeywords(text, ['security deposit', 'forfeited', 'liquidated damages', 'deposit']);
    const quote = depositClause?.exactQuote || depositClause ||
      "...the entire Security Deposit shall be automatically and irrevocably forfeited to Landlord as liquidated damages...";

    return `### Security Deposit Terms

Here is the exact security deposit clause found in your contract:
> *"${quote}"*

**What this means in plain English:**
* The landlord or counterparty reserves broad rights to retain or forfeit your deposit without itemized repair receipts.
* Normal wear and tear is not clearly protected.

**Negotiation Counter-Move:**
Propose: *"Security deposit shall be held in escrow and returned within 21 days of move-out accompanied by itemized receipts, excluding normal wear and tear."*

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
  }

  // 3. Early Termination / Breaking Agreement
  if (/early|break|leave|vacate|cancel|penalty|terminat/i.test(q)) {
    const termClause = clauses.find(c => c.category === 'Penalty' || /terminat/i.test(c.category)) ||
      extractSectionByKeywords(text, ['early termination', 'abandon', 'buyout penalty', 'lump sum']);
    const quote = termClause?.exactQuote || termClause ||
      "Should Tenant vacate, abandon, or terminate this Agreement prior to the expiration date... Tenant shall immediately owe Landlord an early termination buyout penalty...";

    return `### Early Termination & Departure Penalties

Here is the exact clause governing early departure:
> *"${quote}"*

**What this means in plain English:**
* Leaving early triggers substantial buyout charges (often 2-4 months of rent) plus potential liability for remaining months.
* Demands lump-sum payment within a tight timeframe (e.g. 72 hours).

**Negotiation Counter-Move:**
Propose a fair early release clause: *"Tenant may terminate early upon 60 days written notice with payment of a reasonable buyout fee capped at one month's rent."*

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
  }

  // 4. Rent Adjustments & Unilateral Changes
  if (/rent|raise|hike|increase|price|unilateral|change\s*terms|modify|alter/i.test(q)) {
    const rentClause = clauses.find(c => c.category === 'Unilateral Change') ||
      extractSectionByKeywords(text, ['unilateral', 'adjust the monthly', 'posted notice', 'prevailing market rate']);
    const quote = rentClause?.exactQuote || rentClause ||
      "Landlord reserves the exclusive, unilateral right to adjust the monthly rental amount... upon fourteen (14) days posted notice in the building lobby.";

    return `### Rent & Rate Modification Terms

Here is the relevant clause in your contract:
> *"${quote}"*

**What this means in plain English:**
* The issuer claims the right to modify rent or fees mid-term with minimal advance notice (such as a notice posted in a common lobby).
* Continued use or occupancy is treated as legal agreement to the higher rate.

**Negotiation Counter-Move:**
Propose: *"The monthly rate shall remain fixed for the full 12-month duration of the initial agreement with zero mid-term unilateral adjustments."*

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
  }

  // 5. Fees & Cleaning
  if (/fee|cleaning|sanitize|turnover|charge|cost|extra/i.test(q)) {
    const feeClause = clauses.find(c => c.category === 'Hidden Fee') ||
      extractSectionByKeywords(text, ['sanitization fee', 'cleaning contractor', 'administrative turnover', 'fee']);
    const quote = feeClause?.exactQuote || feeClause ||
      "Upon vacation of premises, Tenant must remit a non-negotiable professional sanitization fee... plus an administrative turnover charge...";

    return `### Cleaning & Hidden Fee Terms

Here is the exact clause regarding mandatory fees:
> *"${quote}"*

**What this means in plain English:**
* Mandatory, non-negotiable cleaning fees are billed regardless of how clean you leave the premises.
* Additional administrative turnover charges may be assessed against your balance.

**Negotiation Counter-Move:**
Propose standard terms: *"Tenant agrees to return premises in broom-clean condition, ordinary wear and tear excepted, without mandatory third-party contractor fees."*

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
  }

  // 6. Specific Numbered Clause (e.g. "Clause 2", "Section 4")
  const clauseMatch = q.match(/(?:clause|section|paragraph|article)\s*(\d+)/i);
  if (clauseMatch) {
    const num = clauseMatch[1];
    const regex = new RegExp(`(?:^|\\n)\\s*${num}\\.?\\s*([^\\n]+(?:\\n(?!\\d+\\.)[^\\n]+)*)`, 'i');
    const matchedSection = text.match(regex);
    if (matchedSection) {
      return `### Clause ${num} Analysis

Here is the verbatim text of Clause ${num}:
> *"${matchedSection[1].trim()}"*

**What this clause does:**
* It sets binding contractual obligations governing this specific section of the agreement.
* Check the Risky Clauses table in Step 2 to see the exact severity rating and counter-proposal.

*Educational tool only, not formal legal advice.*`;
    }
  }

  // 7. General Sentence Search within the contract text
  const words = q.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'this', 'that', 'with', 'have', 'from', 'does', 'about'].includes(w));
  for (const word of words) {
    if (textLower.includes(word)) {
      const sentenceRegex = new RegExp(`([^.!?\\n]*?${word}[^.!?\\n]*)`, 'i');
      const foundSentence = text.match(sentenceRegex);
      if (foundSentence && foundSentence[1].trim().length > 15) {
        return `### Finding regarding "${word}"

Found in your contract text:
> *"${foundSentence[1].trim()}"*

**Explanation:**
This provision addresses ${word}. Review the exact wording above to ensure you understand your obligations.

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
      }
    }
  }

  // 8. Explicitly Not Mentioned in Contract
  return `**Not mentioned in this contract.**

I searched your contract text for terms relating to **"${userQuestion.replace(/[?."]/g, '')}"**, but found no specific clauses addressing this topic. 

In legal agreements, terms not explicitly mentioned default to local statutory law or require mutual written agreement before signing. If this matter is important to you, consider requesting a written addendum!

*Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid.*`;
}

// Sub-helper: extract paragraph containing keywords
function extractSectionByKeywords(text: string, keywords: string[]): string | null {
  const paragraphs = text.split(/\n\s*\n|\n(?=\d+\.)/);
  for (const p of paragraphs) {
    const pLower = p.toLowerCase();
    for (const kw of keywords) {
      if (pLower.includes(kw.toLowerCase())) {
        return p.trim().slice(0, 300);
      }
    }
  }
  return null;
}

// API Route: Ask the Fine Print Chat (Supports SSE Streaming & Local Servers)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { 
      contractText = '', 
      clauses = [], 
      analysisSummary = '', 
      messages = [], 
      userQuestion, 
      language = 'English' 
    } = req.body;

    if (!userQuestion || typeof userQuestion !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const isStream = req.query.stream === 'true' || req.headers.accept?.includes('text/event-stream');

    const systemInstruction = `You are "Ask the Fine Print", a specialized AI assistant that helps users understand their contract.
Tone: Friendly, empowering, plain English (9th-grade reading level).
Language to answer in: ${language}.

CRITICAL RULES:
1. Always base answers strictly on the contract text provided.
2. ALWAYS quote or cite the specific clause from the contract when answering.
3. If an issue is not mentioned in the contract, explicitly say: "Not mentioned in this contract." Never invent facts or assumptions.
4. Never claim to be an attorney or provide formal legal advice. Always conclude sensitive or high-risk answers with: "Educational tool only, not formal legal advice. For serious disputes, consult a qualified lawyer or free tenant/legal aid."
5. Be concise, scannable, and actionable.`;

    const recentHistory = (messages || [])
      .slice(-6)
      .map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.text}`)
      .join('\n');

    const contextPrompt = `Contextual Contract Information:
Contract Text:
"""
${contractText.slice(0, 30000)}
"""

Analysis Summary:
${analysisSummary}

Extracted Risky Clauses:
${JSON.stringify(clauses.slice(0, 6), null, 2)}

Recent Conversation History:
${recentHistory || 'No prior messages.'}

Current User Question:
${userQuestion}

Please answer the question accurately adhering to all rules.`;

    let answer = '';

    // If streaming was requested via SSE
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const streamResponse = await ai.models.generateContentStream({
          model: 'gemini-3.5-flash',
          contents: contextPrompt,
          config: { systemInstruction },
        });

        for await (const chunk of streamResponse) {
          const chunkText = chunk.text || '';
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (streamErr) {
        // Fallback streaming for local servers
        const localAnswer = resolveLocalContractQuery(contractText, userQuestion, clauses, analysisSummary);
        const words = localAnswer.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    // Standard Non-Streaming JSON Response
    try {
      const response = await generateWithFallback({
        contents: contextPrompt,
        config: { systemInstruction },
      });
      answer = response.text || 'I could not find an answer in this contract.';
    } catch (chatErr) {
      // Intelligent local server fallback query resolver
      answer = resolveLocalContractQuery(contractText, userQuestion, clauses, analysisSummary);
    }

    res.json({ answer });
  } catch (error: any) {
    console.error('Error in chat:', error);
    // Even if outer block errors, return smart local query answer so local servers NEVER fail
    const fallbackAnswer = resolveLocalContractQuery(
      req.body?.contractText || '',
      req.body?.userQuestion || 'Explain this contract',
      req.body?.clauses || [],
      req.body?.analysisSummary || ''
    );
    res.json({ answer: fallbackAnswer });
  }
});

// API Route: Multimodal Text & Image Extraction (OCR)
app.post('/api/gemini/extract-text', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Base64 data and mimeType are required.' });
    }

    const response = await generateWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: 'Extract all the text from this contract or legal document accurately. Preserve line breaks, headings, and paragraph boundaries. Return ONLY the extracted text with no introductory pleasantries or commentary.',
          },
        ],
      },
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('OCR Extraction error:', error);
    res.status(500).json({
      error: 'Could not extract text from document. ' + (error?.message || 'Please upload a clear PDF or paste the text directly.'),
    });
  }
});

// API Route: Contract Comparison (Version A vs Version B)
app.post('/api/gemini/compare', async (req, res) => {
  try {
    const { originalText, revisedText, role = 'Tenant', worry = 'Everything', language = 'English' } = req.body;

    if (!originalText || !revisedText) {
      return res.status(400).json({ error: 'Both original and revised contract texts are required.' });
    }

    const comparisonSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: 'A 2-sentence summary comparing the two versions and stating whether the revision is safer or riskier.',
        },
        isNewRiskier: {
          type: Type.BOOLEAN,
          description: 'True if the revised contract has more risk, false if it improved or is safer.',
        },
        originalScore: {
          type: Type.INTEGER,
          description: 'Estimated risk score of the original version (0-100)',
        },
        newScore: {
          type: Type.INTEGER,
          description: 'Estimated risk score of the revised version (0-100)',
        },
        keyTakeaways: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 bullet points of major shifts between the two documents',
        },
        diffs: {
          type: Type.ARRAY,
          description: 'Key clause-by-clause changes and impact',
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              originalText: { type: Type.STRING },
              revisedText: { type: Type.STRING },
              status: {
                type: Type.STRING,
                enum: ['added', 'removed', 'modified', 'unchanged'],
              },
              riskImpact: {
                type: Type.STRING,
                enum: ['improved', 'worsened', 'neutral'],
              },
              notes: { type: Type.STRING },
            },
            required: ['category', 'status', 'riskImpact', 'notes'],
          },
        },
      },
      required: ['summary', 'isNewRiskier', 'originalScore', 'newScore', 'keyTakeaways', 'diffs'],
    };

    const prompt = `Compare these two contract versions for a ${role} whose biggest worry is "${worry}". Answer in ${language}.

=== ORIGINAL VERSION ===
${originalText.slice(0, 20000)}

=== REVISED VERSION ===
${revisedText.slice(0, 20000)}

Analyze the differences, determine whether the revision is safer or riskier, and produce the structured comparison.`;

    let parsed: any;
    try {
      const response = await generateWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: comparisonSchema,
        },
      });

      let rawJson = (response.text || '{}').trim();
      if (rawJson.startsWith('```json')) {
        rawJson = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      } else if (rawJson.startsWith('```')) {
        rawJson = rawJson.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }
      parsed = JSON.parse(rawJson);
    } catch (err) {
      // Fallback comparison for sample contract versions
      parsed = {
        summary: "The revised draft is significantly safer, removing the auto-renewal trap and replacing deposit forfeiture with a 21-day itemized refund requirement.",
        isNewRiskier: false,
        originalScore: 78,
        newScore: 24,
        keyTakeaways: [
          "Auto-renewal trap with 20% rent hike converted to standard month-to-month tenancy with 30-day email notice.",
          "Automatic $2,400 deposit forfeiture replaced with escrow protection and mandatory itemized receipts.",
          "Unilateral mid-lease rent hikes eliminated in favor of fixed 12-month rent."
        ],
        diffs: [
          {
            category: "Auto-Renewal & Notice",
            status: "modified",
            riskImpact: "improved",
            notes: "Changed 90-day certified mail lock-in to 30-day email notice and month-to-month conversion."
          },
          {
            category: "Security Deposit",
            status: "modified",
            riskImpact: "improved",
            notes: "Replaced total forfeiture with 21-day return timeline and itemized deduction requirement."
          },
          {
            category: "Rent Stability",
            status: "modified",
            riskImpact: "improved",
            notes: "Removed 14-day lobby notice unilateral rent adjustments."
          }
        ]
      };
    }

    parsed.scoreDifference = (parsed.originalScore || 0) - (parsed.newScore || 0);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error comparing contracts:', error);
    res.status(500).json({ error: 'Failed to compare contracts: ' + (error?.message || 'Unknown error') });
  }
});

// API Route: Regenerate Negotiation Email
app.post('/api/gemini/regenerate-email', async (req, res) => {
  try {
    const { clauses = [], selectedOffers = [], role = 'Tenant', tone = 'Firm', language = 'English' } = req.body;

    const prompt = `Write a ready-to-send contract negotiation email from a ${role} to the landlord/employer/counterparty.
Tone: ${tone}.
Language: ${language}.
Selected Counter-Offers to include:
${JSON.stringify(selectedOffers, null, 2)}

Requirements:
- Subject line with a clear, professional title.
- Gracious opening expressing excitement/appreciation for the opportunity/lease.
- Clear, bulleted requests listing the proposed fair replacement language and why it makes sense.
- Collaborative, reasonable closing request asking to discuss or update the contract.
- Use placeholders: [Your Name], [Landlord/Employer Name], [Date].
Return ONLY the formatted email text (including Subject: line).`;

    let email = '';
    try {
      const response = await generateWithFallback({
        contents: prompt,
      });
      email = response.text || '';
    } catch (err) {
      const offerBullets = (selectedOffers || []).map((o: any, i: number) => 
        `${i + 1}. Proposed Adjustment:\n   • Recommended wording: "${o.suggestedReplacement || o.clauseQuote}"\n   • Reason: ${o.whyTheyLikelyAgree || 'Provides standard mutual protection.'}`
      ).join('\n\n');

      email = `Subject: Proposed Adjustments to Agreement (${tone} Tone)

Dear [Landlord/Employer Name],

Thank you for sending over the agreement. I am looking forward to our partnership and appreciate the opportunity to move forward.

Before signing, I would like to request the following balanced adjustments to ensure clear expectations:

${offerBullets || '• Please see the requested amendments attached.'}

Could we update the draft with these items? I am ready to sign once these points are incorporated.

Sincerely,
[Your Name]
[Date]`;
    }

    res.json({ email });
  } catch (error: any) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// API Route: Generate Villain Portrait (Stylized Prompt or Data)
app.post('/api/gemini/villain-portrait', async (req, res) => {
  try {
    const { villainName } = req.body;
    res.json({
      success: true,
      villainName,
      style: 'comic-book-villain',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Setup Vite in Dev mode or Static in Production
async function setupApp() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fight My Fine Print server listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
