import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup multer for memory storage
  const upload = multer({ storage: multer.memoryStorage() });

  // API route for File Upload (User RAG)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let extractedText = "";
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text;
      } else {
        // Assume text file
        extractedText = req.file.buffer.toString("utf-8");
      }

      res.json({ text: extractedText, name: req.file.originalname });
    } catch (error) {
      console.error("Error parsing file:", error);
      res.status(500).json({ error: "Failed to parse file" });
    }
  });

  // API route for Contract Toxic Clause Scan
  app.post("/api/scan-contract", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let extractedText = "";
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text;
      } else {
        extractedText = req.file.buffer.toString("utf-8");
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `다음은 사용자가 업로드한 도급/설계 계약서 텍스트입니다. 이 계약서에서 수급인(또는 하도급인, 약자)에게 일방적으로 불리한 '독소조항'이나 '불공정 약관'이 의심되는 부분을 찾아주세요.
반드시 JSON 형식으로만 응답해야 합니다.
응답 포맷:
{
  "clauses": [
    {
      "originalText": "계약서에서 발췌한 불공정 조항의 정확한 원문 일부 (이 텍스트로 원문에 하이라이트를 칠 것이므로 가급적 10자 이상의 구체적인 원문을 그대로 가져오세요)",
      "reason": "이 조항이 독소조항인 이유 (법적 근거 등)",
      "suggestedRevision": "수정 제안 (공정한 조항 예시)"
    }
  ]
}

계약서 내용:
${extractedText}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let jsonResp = response.text || "{}";
      res.json({ text: extractedText, analysis: JSON.parse(jsonResp) });
    } catch (error) {
      console.error("Error scanning contract:", error);
      res.status(500).json({ error: "Failed to scan contract" });
    }
  });

  // API route for Live Briefing of Law Revisions
  app.get("/api/law-briefing", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
      
      const prompt = `당신은 최고 수준의 건축/건설 법률 전문가입니다. 현재 시점(2026년)을 기준으로 가장 최근에 발표된 국토교통부 고시, 주요 건축법/건설산업기본법 개정 사항, 판례 동향 등 3가지 핵심 이슈를 가상의 뉴스로 만들어서 매우 전문적이고 실무적인 톤으로 요약 브리핑해 주세요.
반드시 다음 형태의 마크다운으로 답변하세요. 앱 채팅창에서 자동 전송되는 '실시간 법령 개정 브리핑' 메시지입니다.

### 📢 주간 실시간 주요 건축/건설 법령 브리핑
**1. [법령/고시명] - 핵심 요약**
- 개정 사유: ...
- 실무 영향 (감리/CM/시공사 주의사항): ...

**2. [법령/고시명] - 핵심 요약**
- ...

**3. [주요 판례/동향] - 핵심 요약**
- ...

**💡 총평 및 AI 변호사 조언**: ...`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      res.json({ briefing: response.text });
    } catch (error) {
      console.error("Error fetching law briefing:", error);
      res.status(500).json({ error: "Failed to fetch briefing" });
    }
  });

  // API route for Ordinance Risk Analysis
  app.post("/api/analyze-ordinance-risk", async (req, res) => {
    try {
      const { location, usage, scale } = req.body;
      if (!location || !usage || !scale) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `사용자가 입력한 건축 프로젝트 조건을 바탕으로, 해당 지자체(조례) 및 건축법상 발생할 수 있는 잠재적 위반 리스크(건폐율/용적률 위반, 주차장 설치 기준, 일조권 사선제한 등)를 분석하여 JSON 형태로 반환해 주세요.

[프로젝트 조건]
- 대지위치: ${location}
- 건축물 용도: ${usage}
- 건축 규모: ${scale}

반드시 JSON 형식으로만 응답해야 합니다.
응답 포맷:
{
  "summary": "전반적인 리스크 총평 요약 (2-3문장)",
  "risks": [
    {
      "category": "리스크 분류 (예: 건폐율/용적률, 주차장, 일조권 등)",
      "severity": "위험도 (High, Medium, Low)",
      "description": "구체적인 리스크 예상 내용 (지자체 조례 특성 반영)",
      "recommendation": "법적 리스크 방어를 위한 실무적 제안"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let jsonResp = response.text || "{}";
      res.json(JSON.parse(jsonResp));
    } catch (error) {
      console.error("Error analyzing ordinance risk:", error);
      res.status(500).json({ error: "Failed to analyze risk" });
    }
  });

  // API route for Comparing Laws/Precedents
  app.post("/api/compare-laws", async (req, res) => {
    try {
      const { law1, law2 } = req.body;
      if (!law1 || !law2) {
        return res.status(400).json({ error: "Both law1 and law2 are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = `당신은 최고 수준의 건축/건설 법률 전문가입니다. 사용자가 제공한 두 개의 법령 또는 판례를 분석하여 핵심적인 차이점을 마크다운 표(Table) 형태로 요약 비교해 주세요.

비교 대상 1: ${law1}
비교 대상 2: ${law2}

비교 항목은 최소한 다음 내용을 포함해야 합니다:
- '목적/취지'
- '적용 범위 (대상)'
- '주요 차이점'
- '건축/건설 실무적 유의사항'

마크다운 표 형식으로만 깔끔하게 답변을 구성하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      res.json({ comparisonText: response.text });
    } catch (error) {
      console.error("Error comparing laws:", error);
      res.status(500).json({ error: "Failed to compare laws" });
    }
  });

  // API route for News
  app.get("/api/news", async (req, res) => {
    try {
      const newsResponse = await axios.get("https://news.google.com/rss/search?q=%EA%B1%B4%EC%B6%95%EB%B2%95+%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80+%EA%B1%B4%EC%B6%95%EA%B7%9C%EC%A0%95&hl=ko&gl=KR&ceid=KR:ko", {
        responseType: 'text'
      });
      const parser = new XMLParser();
      const newsJson = parser.parse(newsResponse.data);
      
      let articles = [];
      if (newsJson.rss && newsJson.rss.channel && newsJson.rss.channel.item) {
        const items = Array.isArray(newsJson.rss.channel.item) ? newsJson.rss.channel.item : [newsJson.rss.channel.item];
        articles = items.slice(0, 7).map((item: any) => ({
          title: item.title,
          link: item.link
        }));
      }
      
      res.json({ articles });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // In-memory cache for multi-ministry RAG context
  const ragCache = new Map<string, string>();

  // Async multi-ministry RAG fetcher (Simulated)
  async function fetchMultiMinistryContext(query: string): Promise<string> {
    const keywords = [
      { trigger: ['안전', '사고', '노무', '사망', '현장소장', '처벌'], source: '고용노동부(안전)', content: '[중대재해처벌법 및 산업안전보건법 관련 판례/지침] 사업주 또는 경영책임자등이 안전 및 보건 확보의무를 위반하여 중대산업재해에 이르게 한 경우 처벌 대상이 됨. 현장소장의 양벌규정 적용 가능성 높음.' },
      { trigger: ['소음', '진동', '분진', '민원', '환경'], source: '환경부(소음/진동)', content: '[소음·진동관리법 및 중앙환경분쟁조정위원회 례] 특정공사 사전신고 대상 건설공사에서 발생하는 소음 진동으로 인한 민원 발생 시, 규제기준 초과 시 과태료 및 공사중지 명령 가능. 방음벽 설치 등 적극적 저감대책 필요.' },
      { trigger: ['감리', 'CM', 'PM', '시방서', '공정'], source: '국토교통부(감리/CM)', content: '[건설기술진흥법 및 KCS 표준시방서] 감리자는 시공자가 설계도서 및 시방서에 따라 적합하게 시공하는지 확인해야 하며, 중대한 결함 발생 시 공사중지명령을 내릴 의무가 있음.' },
      { trigger: ['토목', '지반', '싱크홀', '굴착'], source: '국토교통부(지하안전)', content: '[지하안전관리에 관한 특별법] 깊이 10미터 이상 굴착공사를 수반하는 건설공사 시 지하안전평가를 의무적으로 실시하여야 하며, 지반침하 방지대책을 수립해야 함.' }
    ];

    let additionalContext = "";
    
    for (const kw of keywords) {
      if (kw.trigger.some(t => query.includes(t))) {
        // Check cache
        const cacheKey = `mock_api_${kw.source}`;
        if (ragCache.has(cacheKey)) {
          additionalContext += `\n[${kw.source} API Cache Hit] ${ragCache.get(cacheKey)}`;
        } else {
          // Simulate async network request
          await new Promise(resolve => setTimeout(resolve, 300));
          ragCache.set(cacheKey, kw.content);
          additionalContext += `\n[${kw.source} API Data] ${kw.content}`;
        }
      }
    }
    
    return additionalContext;
  }

  // API route for Vision AI (Image Analysis)
  app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const prompt = "이 이미지(현장 사진이나 구청 공문 등)를 텍스트로 판독(OCR)하고, 해당 내용에서 발견되는 건축법적 리스크나 실무적 쟁점을 상세히 분석해 줘.";

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          prompt,
          {
            inlineData: {
              data: req.file.buffer.toString("base64"),
              mimeType: req.file.mimetype
            }
          }
        ]
      });

      res.json({ result: response.text });
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // API route for Document Generation
  app.post("/api/generate-document", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const conversationHistory = messages.map((m: any) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.text}`).join('\n\n');

      const prompt = `다음은 사용자와 AI 간의 건축/법률 관련 대화 내역입니다. 이 대화의 맥락(사건 개요, 관련 법령 등)을 완벽히 분석하여, 정형화된 '내용증명 양식' 또는 '행정 민원 답변서 양식'을 작성해 주세요. 
반드시 마크다운(Markdown) 포맷으로 깔끔하게 작성해야 하며, 빈칸(예: [발신인 이름], [날짜])을 두어 사용자가 바로 채워 쓸 수 있도록 실무적으로 완벽한 공문서 형태를 띠어야 합니다.

[대화 내역]
${conversationHistory}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });

      res.json({ document: response.text });
    } catch (error) {
      console.error("Error generating document:", error);
      res.status(500).json({ error: "Failed to generate document" });
    }
  });

  // API route for Gemini
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, uploadedContext, persona = 'expert', locationContext = '' } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }

      // Extract the last user message for RAG querying
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      let multiMinistryContext = "";
      if (lastUserMessage) {
        multiMinistryContext = await fetchMultiMinistryContext(lastUserMessage.text);
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let systemInstruction = "";

      if (persona === 'instructor') {
        systemInstruction = `[Role & Purpose]
당신은 '친절한 건축법 1타 강사 및 해설서 저자'입니다.
딱딱한 법조문 나열이나 어려운 법률 용어를 피하고, 시중의 '건축법규 해설집'처럼 일상적인 비유와 예시를 들어 아주 쉽게 풀어서 답변해야 합니다.
건축기사 시험이나 자격증 시험에 자주 출제되는 빈출 포인트나 함정을 콕 집어주는 방식으로 설명하세요.
마치 수험생이나 기초가 부족한 초보자에게 과외를 해주듯이 친근하고 이해하기 쉬운 어투(~해요, ~습니다)를 사용하세요.

[Core Capabilities]
1. 어려운 개념의 일상화: 건폐율, 용적률, 대수선, 일조권 등 어려운 단어를 일상 생활의 예시(피자 조각, 이불 덮기 등)로 비유하여 설명합니다.
2. 기사 시험 빈출 포인트 강조: "이 부분은 기사 시험에서 오답으로 자주 나오는 함정이에요!", "이 숫자는 무조건 암기하셔야 합니다!" 같은 강사 멘트를 활용하세요.

[Strict Constraints]
1. 절대 법정 변호사나 로펌 실무자처럼 딱딱하게 굴지 마세요.
2. 판례 번호나 조항(예: 제44조 제1항)을 나열하기보다 그 의미를 요약해서 전달하세요.
3. [UI_COMPONENT: PERMIT_TIMELINE] 출력은 허용되나, 그 외 로톡 연계나 무거운 리스크 경고 포맷은 이 모드에서는 생략합니다.`;
      } else {
        systemInstruction = `[Role & Purpose]
당신은 대한민국 건축법, 지자체 조례, 타 부처(환경/안전/소방) 법령, 건축 분쟁 판례에 통달한 'AI Total Construction Risk Management 컨설턴트'입니다. 
단순히 '건축법'만 보지 않고, 현장의 실질적인 CM/PM(공정, 원가, 품질 관리) 및 감리 관점에서 리스크를 종합적으로 분석합니다.
당신의 목표는 건축학도, 설계자, 시공사, 감리자, 건물주 등 건설 생태계 참여자들이 설계부터 시공, 완공 후 환경/노무 민원까지 전방위적인 법적 리스크를 완벽히 방어할 수 있도록 돕는 것입니다.

[Mega Platform Core Directives]
1. Multi-Ministry Cross-check: 건축법과 타 법(소방, 토목, 환경, 노동) 간의 충돌 지점이나 사각지대가 있다면 반드시 짚어주어 완벽한 방어 논리를 제공하세요.
2. Safety First (중대재해): 중대재해처벌법, 산업안전보건법 등 현장 소장 및 건축주가 형사 처벌을 받을 수 있는 치명적 안전/노무 리스크가 감지되면 최우선으로 경고하세요.
3. CM/PM Perspective: 법을 넘어 현장의 공정, 원가, 품질 관리에 미치는 파급 효과를 함께 분석하세요.

[Cross-check Alert UI Trigger]
- 타 법령 간의 충돌 리스크, 또는 중대재해처벌법 등 치명적 안전/노무 리스크가 감지되면, **반드시 응답의 최상단 첫 줄에** 다음과 같은 형식으로 정확히 한 줄만 경고 문구를 출력하세요. (프론트엔드에서 파싱할 목적입니다.)
[CROSS_CHECK: (경고할 핵심 내용 1줄 요약)]

[Core Capabilities]
1. 투트랙 법률 조언: 바쁜 실무자를 위한 '3줄 핵심 요약'과, 정확한 대응을 위한 '자세한 심층 법률 소견서'를 함께 제공합니다.
[Additional Module 1: 로톡(LawTalk) 연계용 브리핑 리포트 자동 생성]
- 트리거: 앞선 분석에서 [리스크 등급]이 '보통' 또는 '매우 높음'이 나오거나, 사용자가 "변호사 상담받을게", "로톡 연결해 줘" 등의 의도를 보일 때 반드시 활성화됩니다.
- 출력 지침: AI 소견서 출력이 끝난 후, 하단에 사용자가 복사하기 쉽도록 다음 구조의 [브리핑 리포트]와 [체크리스트]를 덧붙여 출력합니다.

--- (출력 포맷 시작) ---
🚨 [리스크 신호등]: (🟢 낮음 / 🟡 보통 / 🔴 매우 높음) - (사유 1줄 요약)

📋 [변호사 제출용 1장 요약 브리핑] 
*(아래 내용을 복사하여 로톡 변호사 상담 시 그대로 붙여넣으세요. 상황 설명을 반복할 필요가 없습니다.)*
- 사건 개요: (사용자의 현재 상황 2~3줄 요약)
- 핵심 쟁점: (건축법적, 실무적 쟁점 명확화)
- 관련 법령/규정: (분석에 사용된 주요 법령 및 지자체 조례)
- 현재 프로젝트 단계: (설계 전 / 인허가 중 / 시공 중 / 완공 후 분쟁 등)

✅ [상담 전 필수 서류 체크리스트] 
*(변호사 상담 전 아래 서류를 준비하시면 5만 원의 상담 시간을 200% 활용할 수 있습니다.)*
- [ ] (필요 서류 1 - 예: 건축허가서, 현장 사진)
- [ ] (필요 서류 2 - 예: 해당 부분 설계 도면)
- [ ] (필요 서류 3 - 예: 공사도급계약서 등 사안에 맞는 맞춤 서류)

*(안내: 앱 하단의 '리포트 복사하고 로톡으로 이동' 버튼을 눌러 건축 전문 변호사를 찾아보세요.)*
--- (출력 포맷 끝) ---

[Additional Module 2: 앱 백엔드 연동을 위한 메타데이터 (히스토리 & 푸시 알림용)]
- 트리거: 모든 답변의 맨 마지막에 앱의 시스템(DB)이 읽어갈 수 있도록 데이터 태그를 출력합니다. 이 데이터는 사용자의 [내 사건 보관함] 자동 분류와 [지자체 조례 변동 알림 Push] 기능에 사용됩니다.
- 출력 지침: 답변 최하단에 아래 형식으로 메타데이터를 출력합니다.

[App_System_Metadata]
- Archive_Folder: #(지역명)_#(프로젝트성격) (예: #마포구_상가신축, #영덕군_리모델링)
- Law_Issue_Tag: #(핵심법적쟁점) (예: #일조권사선제한, #건폐율위반, #하자보수)
- Region_Track: (질문에 포함된 특정 지자체 명칭. 없으면 '전국'. 예: 서울특별시 마포구)

[Additional Module 3: 자동 툴팁 생성용 마크다운 작성]
- 트리거: 답변 본문에 전문 건축/법률 용어(건폐율, 용적률, 대지안의 공지 등)가 등장할 때
- 출력 지침: 사용자가 마우스를 올렸을 때 실무적 정의를 볼 수 있도록 반드시 마크다운 링크의 title 속성을 활용해 다음과 같은 포맷으로 작성하세요. 
  작성 포맷: \`[전문용어](# "해당 용어의 쉽고 실무적인 정의")\`
  (예시: "따라서 [건폐율](# "전체 대지면적 중에서 건물이 차지하는 바닥면적의 비율")의 제한을 받게 되며...")
  주의: '#' 뒤에 반드시 띄어쓰기를 한 번 하고 큰따옴표를 사용하세요.

2. 건축 용어 실무 번역: 법제처의 어려운 법률 용어(Legalese)를 누구나 쉽게 이해할 수 있는 일상 언어 및 건축 현장 실무 용어로 풀어 해설합니다.
3. 사전/사후 맞춤 가이드: 건축 전(건폐율, 용적률, 주차대수, 일조권 등) 사전 검토와 건축 후(하자, 공사비 증액, 민원, 판례 분석) 분쟁 대응 방안을 제시합니다.

[Strict Constraints - 매우 중요]
1. 확실하지 않은 정보 생성 금지: 존재하지 않는 법령이나 판례를 절대 지어내지 않습니다.
2. [지정된 필수 거절 문구]: 판례가 없거나, 정보가 부족하거나, AI가 단정 짓기 위험한 중대 소송 사안의 경우 절대 추측하지 말고 다음 문구를 토씨 하나 틀리지 않고 출력하십시오:
   "해당 사안에 대해서는 아직까지 명확한 판례가 확인되지 않거나 전문 변호인의 상담이 필요한 부분입니다. 치명적인 법적 리스크를 방지하기 위해 전문 변호사와의 직접적인 상담을 권장합니다."
3. 비건축 분야 거절: 건축, 건설, 부동산 개발과 무관한 일반 민/형사 질문은 단호히 거절합니다.
4. e-KBC 반영 필수: 기술적(구조, 소방, 재료 등) 질문이나 한국건축규정(e-KBC) 관련 질문 시, 반드시 e-KBC 기술 표준 및 설계 기준을 최우선으로 반영하여 실무적으로 답변하십시오.
5. 인허가 절차 타임라인 트리거: 사용자가 '건축허가 절차'나 '인허가 과정'에 대해 질문하는 경우, 텍스트 답변의 맨 마지막에 반드시 "[UI_COMPONENT: PERMIT_TIMELINE]" 이라는 문자열을 추가하십시오. 프론트엔드가 이를 감지하여 시각적 타임라인 UI를 렌더링합니다.

[Output Format (답변 구조)]
모든 답변은 반드시 아래 3가지 단계 구조로 출력하십시오:

📌 [1. 3줄 핵심 요약]
- 결론 및 핵심 대응 방향을 3개의 불릿포인트로 간결하게 정리

📖 [2. 심층 법률 소견서]
■ 사안 분석 및 관련 법령: 적용되는 법률, 시행령, 지자체 조례 조항 명시
■ 쉬운 법률 용어 해설: 답변에 사용된 어려운 법률 용어를 실무/일상 용어로 풀이 (예: '대지안의 공지' -> 건물을 지을 때 이웃집이나 도로에서 띄워야 하는 최소 거리)
■ 상세 법리 및 판례 분석: (건축 후 분쟁인 경우) 유사 판례의 승소/패소 요인 및 과실 비율 분석
■ 단계별 실무 대응 가이드: 건축 전/후 상황에 맞춘 구체적인 행동 지침 (증거 자료 확보, 인허가 서류 점검 등)

⚖️ [3. AI 1차 필터링 및 로톡(LawTalk) 연계 안내]
- [리스크 등급]: (낮음 / 보통 / 매우 높음)
- [로톡 연계 안내]: 리스크가 '보통' 이상이거나 판례가 없는 경우, 지정된 필수 거절 문구와 함께 "로톡(LawTalk) 건축 전문 변호사 상담을 통해 확정적 법률 자문을 받아보시는 것을 추천합니다." 출력`;
      }

      if (uploadedContext) {
        systemInstruction += `\n\n[사용자 업로드 자료 (RAG)]\n사용자가 제공한 문서 자료가 있습니다. 이 자료를 우선적으로 분석하고, 답변 시 반드시 "제가 가진 법령 데이터와 업로드해주신 자료에 따르면..." 이라는 문구로 시작하십시오. 자료 내용은 다음과 같습니다:\n${uploadedContext}`;
      }
      
      if (multiMinistryContext) {
        systemInstruction += `\n\n[다부처 타법령 연계 데이터 (RAG API)]\n사용자 질의의 맥락을 파악하여 관련 부처의 데이터를 가져왔습니다. 이 데이터를 기반으로 타법령 충돌 여부 및 추가 리스크를 분석하십시오:\n${multiMinistryContext}`;
      }

      if (locationContext) {
        systemInstruction += `\n\n[현장 주소 기반 타겟팅]\n현재 사용자가 지정한 현장 주소(지번)는 "${locationContext}" 입니다. 이 지역의 용도지역/조례를 최우선으로 고려하여 답변하세요.`;
      }

      // Get the latest user message
      const latestUserMessageText = messages[messages.length - 1]?.text || "";

      // 1. Extract keyword for law search
      const keywordResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `다음 사용자 질문에서 국가법령정보센터 API 검색에 사용할 가장 핵심적인 건축/법률 명사 키워드 1개만 추출해줘. 부연 설명 없이 단답형으로만 출력해. (예: 건폐율, 일조권, 대수선, 건축허가)\n\n질문: ${latestUserMessageText}`
      });
      const keyword = keywordResponse.text.trim();

      // 2. Fetch from law.go.kr API for both Laws and Precedents
      let ragContext = "검색된 법령 정보가 없습니다.";
      let precContext = "검색된 판례 정보가 없습니다.";
      
      try {
        const [lawResponse, precResponse] = await Promise.all([
          axios.get(`https://www.law.go.kr/DRF/lawSearch.do?OC=archi_law_ai_2026&target=law&type=XML&query=${encodeURIComponent(keyword)}`, { responseType: 'text' }),
          axios.get(`https://www.law.go.kr/DRF/lawSearch.do?OC=archi_law_ai_2026&target=prec&type=XML&query=${encodeURIComponent(keyword)}`, { responseType: 'text' })
        ]);
        
        const parser = new XMLParser();
        
        // Parse Laws
        const lawJson = parser.parse(lawResponse.data);
        if (lawJson.LawSearch && lawJson.LawSearch.law) {
          const laws = Array.isArray(lawJson.LawSearch.law) ? lawJson.LawSearch.law : [lawJson.LawSearch.law];
          ragContext = laws.slice(0, 3).map((l: any) => `- 법령명: ${l.법령명}\n  시행일자: ${l.시행일자}\n  소관부처: ${l.소관부처}\n  법령ID: ${l.법령ID}`).join("\n\n");
        }

        // Parse Precedents
        const precJson = parser.parse(precResponse.data);
        if (precJson.PrecSearch && precJson.PrecSearch.prec) {
          const precs = Array.isArray(precJson.PrecSearch.prec) ? precJson.PrecSearch.prec : [precJson.PrecSearch.prec];
          precContext = precs.slice(0, 3).map((p: any) => `- 사건명: ${p.사건명}\n  사건번호: ${p.사건번호}\n  선고일자: ${p.선고일자}\n  법원명: ${p.법원명}\n  사건종류명: ${p.사건종류명}`).join("\n\n");
        }
      } catch (err) {
        console.error("Failed to fetch law API:", err);
        ragContext = "법령 및 판례 검색 API 호출에 실패했습니다.";
      }

      const contents = messages.map((msg: any, index: number) => {
        if (index === messages.length - 1) {
          // Append context to the final user message
          return {
            role: "user",
            parts: [{ text: `[시스템 RAG 검색 컨텍스트 (키워드: ${keyword})]\n\n<관련 법령>\n${ragContext}\n\n<관련 판례>\n${precContext}\n\n[사용자 원래 질문]\n${msg.text}` }]
          };
        }
        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        };
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to generate response." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
