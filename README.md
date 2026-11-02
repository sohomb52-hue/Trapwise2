# Fight My Fine Print

> **"Spot the risk. Feel the trap. Counter the offer."**

*Judge's 10-Second Summary:* An AI app that converts long, confusing contracts into plain-English warnings, memorable Villain Cards, a 0-100 risk score, and instant ready-to-send negotiation counter-offers.

---

## Key Features

1. **Pillar 1: SPOT IT (Trap-o-Meter)**
   - Client-side document upload for PDF, TXT, DOCX, and photo/scanned contract OCR via Gemini Multimodal.
   - 0-100 animated semicircle gauge rating the risk as **Safe (0-25)**, **Careful (26-50)**, **Negotiate (51-75)**, or **Walk Away (76-100)** with color-blind safe indicators.
   - Extracts 5-8 riskiest clauses with verbatim quote checking and plain-English translations (9th-grade reading level).

2. **Pillar 2: UNDERSTAND IT (Villain Trading Cards)**
   - Collectible 3D-feel trading cards that gamify legal traps into recognizable villains:
     - *Auto-Renewal Trap ⏳*, *Deposit Dragon 🐉*, *Fee Ninja 🥷*, *Lock-In Kraken 🐙*, *Fine-Print Phantom 👻*, *Unilateral Overlord 👑*.
   - Click each card to flip and reveal the strategic weakness/counter-move with holographic hover shimmer.
   - **Auto-Renewal Trap Hero Card (The WOW Moment):** Spotlight on the fine-print trap, concrete financial impact, notice deadline, and neutralizing replacement.
   - **Share My Score:** One-click instant PNG score card download (no private contract text included) for sharing.

3. **Pillar 3: FIGHT BACK (Counter-Offers & Negotiation Email)**
   - Balanced, reasonable proposed replacements with fallback compromises and "Why they will likely agree".
   - Ready-to-send negotiation email with tone switcher (**Polite**, **Firm**, **Friendly**), one-click copy, `mailto:` integration, and `.txt` download.
   - **"Before I Sign" Summary Card:** 1-screen printable defense recap with top 3 traps, 3 must-haves, deadline to act, and 5-item interactive checklist with native print / PDF export.

4. **Floating AI Assistant: "Ask the Fine Print"**
   - Context-aware chatbot grounded strictly in the uploaded contract.
   - Cites exact clauses or clearly states "Not mentioned in this contract".
   - Quick-question chips for common contract queries.

5. **Compare Mode**
   - Side-by-side comparison between Original (Version A) and Revised (Version B) contracts to verify if risk decreased before signing.

6. **Authentication & Persistence**
   - Firebase Authentication (Google popup and email/password).
   - "Demo Mode" for judges to evaluate the full app instantly without registration.
   - Cloud Firestore persistence for past analyses, with "Delete all my data" privacy compliance.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- **AI Engine:** Google GenAI SDK (`gemini-3.8-flash`) with structured JSON schemas
- **Backend:** Node.js Express server (`server.ts`) proxying all Gemini API calls securely
- **Database & Auth:** Firebase Authentication & Cloud Firestore with hardened security rules
- **Doc Extraction:** Mammoth (DOCX) + Gemini Multimodal OCR (Images & PDFs)
