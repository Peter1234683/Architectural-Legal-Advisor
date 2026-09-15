/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Scale, Building2, AlertTriangle, BookOpen, Clock, Loader2, Scale as ScaleIcon, Folder, FileText, ChevronRight, MessageSquare, Plus, Bell, ShieldCheck, Ruler, Gavel, Sun, Menu, X, Download, Library, UploadCloud, Search, HardHat, ClipboardList, Leaf, Hammer, Camera, Mic, MapPin, FileSignature } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

type NewsArticle = {
  title: string;
  link: string;
};

const PermitTimeline = () => {
  const steps = [
    {
      title: "1단계: 건축계획 및 사전승인 (심의)",
      duration: "약 2주 ~ 4주 소요",
      docs: ["건축계획서", "대지 범위 및 소유권 증명 서류", "건축 사전결정 신청서"]
    },
    {
      title: "2단계: 건축허가 신청",
      duration: "약 2주 ~ 6주 소요",
      docs: ["기본설계도서", "대지 소유권/사용권 증명 서류", "인접 대지주 동의서(필요시)"]
    },
    {
      title: "3단계: 착공신고",
      duration: "약 1주 ~ 2주 소요",
      docs: ["실시설계도서", "공사/감리 계약서 사본", "유해위험방지계획서"]
    },
    {
      title: "4단계: 사용승인 (준공)",
      duration: "약 1주 ~ 3주 소요",
      docs: ["공사완료도서", "감리완료보고서", "각종 필증 (소방, 통신 등)"]
    }
  ];

  return (
    <div className="mt-6 mb-2 p-5 bg-white border border-neutral-200 rounded-2xl shadow-sm">
      <h3 className="text-sm font-bold text-neutral-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#D4AF37]" />
        표준 인허가 절차 및 소요 기간
      </h3>
      <div className="relative border-l-2 border-neutral-200 ml-3 space-y-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-6">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#121212] border-4 border-[#D4AF37]"></div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm font-bold text-neutral-800">{step.title}</h4>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8962A] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md w-fit">
                <Clock className="w-3.5 h-3.5" /> {step.duration}
              </span>
              <div className="mt-2 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 mb-1.5 block">필수 제출 서류</span>
                <ul className="space-y-1">
                  {step.docs.map((doc, dIdx) => (
                    <li key={dIdx} className="text-xs text-neutral-700 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Scanner Modal */}
      {contractScanData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-600" />
                AI 독소조항 스캔 결과
              </h2>
              <button onClick={() => setContractScanData(null)} className="p-2 text-neutral-500 hover:text-neutral-800 rounded-full hover:bg-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-[3] overflow-y-auto p-6 md:p-8 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap font-serif border-b md:border-b-0 md:border-r border-neutral-200 bg-white">
                {renderHighlightedText(contractScanData.text, contractScanData.clauses)}
              </div>
              
              <div className="flex-[2] overflow-y-auto bg-slate-50 p-6 flex flex-col gap-4">
                <h3 className="font-bold text-neutral-800 mb-2 border-b border-neutral-200 pb-2">
                  발견된 위험 조항 ({contractScanData.clauses.length}건)
                </h3>
                {contractScanData.clauses.length === 0 ? (
                  <div className="text-center text-neutral-500 py-10">위험 조항이 발견되지 않았습니다.</div>
                ) : (
                  contractScanData.clauses.map((clause, idx) => (
                    <div 
                      key={idx}
                      onMouseEnter={() => setSelectedClauseIndex(idx)}
                      onMouseLeave={() => setSelectedClauseIndex(null)}
                      className={`p-4 rounded-xl border transition-all cursor-default ${selectedClauseIndex === idx ? 'bg-white border-red-400 shadow-md ring-1 ring-red-400' : 'bg-white border-neutral-200 shadow-sm hover:border-red-300'}`}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-700 text-sm">독소조항 의심</h4>
                          <p className="text-xs text-neutral-600 line-clamp-3 italic mt-1 font-serif bg-neutral-100 p-1.5 rounded">"{clause.originalText}"</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-3 pt-3 border-t border-neutral-100">
                        <div>
                          <span className="text-xs font-bold text-neutral-700 mb-1 block">⚠️ 진단 사유</span>
                          <p className="text-xs text-neutral-600 leading-relaxed">{clause.reason}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#D4AF37] mb-1 block">💡 수정 제안</span>
                          <p className="text-xs text-neutral-700 font-medium bg-[#D4AF37]/10 p-2 rounded-lg leading-relaxed">{clause.suggestedRevision}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'library'>('chat');
  const [megaDomain, setMegaDomain] = useState<'design' | 'construction' | 'supervision' | 'environment'>('design');
  const [libraryMode, setLibraryMode] = useState<'expert' | 'basic'>('expert');
  const [libraryCategory, setLibraryCategory] = useState('전체');
  const [basicLibraryCategory, setBasicLibraryCategory] = useState('전체');
  const [aiPersona, setAiPersona] = useState<'expert' | 'instructor'>('expert');
  const [uploadedDocs, setUploadedDocs] = useState<{name: string, text: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanningContract, setIsScanningContract] = useState(false);
  const [contractScanData, setContractScanData] = useState<{
    text: string;
    clauses: { originalText: string; reason: string; suggestedRevision: string }[];
  } | null>(null);
  const [selectedClauseIndex, setSelectedClauseIndex] = useState<number | null>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isGeneratingRisk, setIsGeneratingRisk] = useState(false);
  const [riskFormData, setRiskFormData] = useState({ location: '', usage: '', scale: '' });
  const [riskReportData, setRiskReportData] = useState<{
    summary: string;
    risks: { category: string; severity: string; description: string; recommendation: string }[];
  } | null>(null);

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareFormData, setCompareFormData] = useState({ law1: '', law2: '' });
  const [compareResult, setCompareResult] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: '안녕하세요. 저는 대한민국 건축법, 한국건축규정(e-KBC), 지자체 조례 및 판례에 통달한 **AI 건축 전문 변호사 및 실무 컨설턴트**입니다.\n\n**건축 전(설계/시공 합법성 검토)** 단계부터 **건축 후(법적 분쟁 및 민원 초기 대응)** 상황까지 관련 법령과 판례를 바탕으로 정확한 실무 가이드를 제공해 드립니다.\n\n어떤 도움이 필요하신가요?',
    },
  ]);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Message[]>([]);
  const [cmChecklists, setCmChecklists] = useState<{title: string, date: string, checkedItems: string[]}[]>([]);

  const toggleBookmark = (msg: Message) => {
    setBookmarkedMessages(prev => {
      const exists = prev.find(m => m.id === msg.id);
      if (exists) return prev.filter(m => m.id !== msg.id);
      return [...prev, msg];
    });
  };
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [locationContext, setLocationContext] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  const handleMicClick = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleCompareLaws = async () => {
    if (!compareFormData.law1 || !compareFormData.law2) return;
    setIsComparing(true);
    setCompareResult(null);
    try {
      const res = await fetch('/api/compare-laws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compareFormData),
      });
      if (!res.ok) throw new Error('Failed to compare');
      const data = await res.json();
      setCompareResult(data.comparisonText);
    } catch (error) {
      console.error(error);
      setCompareResult("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsComparing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `📸 [이미지 분석 요청] ${file.name}` }]);
    setIsAnalyzingImage(true);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to analyze image');
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: data.result }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: '이미지 분석 중 오류가 발생했습니다.' }]);
    } finally {
      setIsAnalyzingImage(false);
      setIsLoading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const fetchLiveBriefing = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: '주요 건축 법령 개정 사항이나 국토교통부 고시 정보를 실시간으로 검색하여 브리핑해 줘.' }]);
    
    try {
      const res = await fetch('/api/law-briefing');
      if (!res.ok) throw new Error('Failed to fetch briefing');
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: data.briefing }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: '실시간 브리핑을 가져오는 중 오류가 발생했습니다.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (messages.length < 2) return;
    setIsGeneratingDoc(true);
    try {
      const res = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error('Failed to generate document');
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `[자동 생성된 문서 양식]\n\n${data.document}` }]);
    } catch (err) {
      console.error(err);
      alert('문서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsLoading(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // A4 ratio is ~1.414, calculate the scaled image height
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Add subsequent pages if the report is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save('건축_법률_자문_보고서.pdf');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          if (data.articles && data.articles.length > 0) {
            setNews(data.articles);
          }
        }
      } catch (err) {
        console.error("Failed to fetch news", err);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 4000); // Change news every 4 seconds
    return () => clearInterval(interval);
  }, [news.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const uploadedContext = uploadedDocs.map(d => `[문서명: ${d.name}]\n${d.text}`).join('\n\n');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, text }) => ({ role, text })),
          uploadedContext: uploadedContext || undefined,
          persona: aiPersona,
          locationContext: locationContext || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '⚠️ 죄송합니다. 서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedDocs(prev => [...prev, { name: data.name, text: data.text }]);
        alert(`'${data.name}' 파일이 성공적으로 업로드되어 AI 지식베이스에 추가되었습니다.`);
      } else {
        alert('파일 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleContractScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    setIsScanningContract(true);
    setContractScanData(null);
    setSelectedClauseIndex(null);

    try {
      const res = await fetch('/api/scan-contract', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to scan contract');
      const data = await res.json();
      setContractScanData({
        text: data.text,
        clauses: data.analysis.clauses || []
      });
    } catch (err) {
      console.error(err);
      alert('독소조항 스캔 중 오류가 발생했습니다.');
    } finally {
      setIsScanningContract(false);
      if (contractInputRef.current) contractInputRef.current.value = '';
    }
  };

  const renderHighlightedText = (text: string, clauses: { originalText: string }[]) => {
    let elements: (string | JSX.Element)[] = [text];
    
    clauses.forEach((clause, idx) => {
      const searchStr = clause.originalText.trim();
      if (!searchStr || searchStr.length < 5) return;
      
      const newElements: (string | JSX.Element)[] = [];
      elements.forEach((el) => {
        if (typeof el === 'string') {
          const parts = el.split(searchStr);
          parts.forEach((part, i) => {
            newElements.push(part);
            if (i < parts.length - 1) {
              newElements.push(
                <mark 
                  key={`${idx}-${i}`} 
                  className={`px-1 rounded cursor-pointer transition-colors ${selectedClauseIndex === idx ? 'bg-red-300 text-red-900 shadow-sm' : 'bg-red-200/60 text-red-800'}`}
                  onMouseEnter={() => setSelectedClauseIndex(idx)}
                  onMouseLeave={() => setSelectedClauseIndex(null)}
                >
                  {searchStr}
                </mark>
              );
            }
          });
        } else {
          newElements.push(el);
        }
      });
      elements = newElements;
    });

    return elements;
  };

  const mockLibrary = [
    { id: 1, title: '2025 일조권 사선제한 침해 판례 모음', category: '핵심 대법원 판례집', desc: '주거지역 내 신축 공사로 인한 일조권 침해 손해배상 청구 사례 및 대법원 기준' },
    { id: 2, title: '국토부 표준 민간건설공사 도급계약서', category: '표준 도급/설계 계약서', desc: '물가변동 배제 특약 등 독소조항 해설 및 작성 가이드라인' },
    { id: 3, title: 'e-KBC 내진설계 및 구조안전 기준', category: 'e-KBC 구조/기술 표준', desc: '최신 한국건축규정에 따른 지역별 적설하중 및 지진하중 설계 실무' },
    { id: 4, title: '수도권 주요 지자체 주차장 조례', category: '지자체 조례 체크리스트', desc: '서울/경기 지역 오피스텔 및 상가 신축 시 부설주차장 설치 기준 요약' },
    { id: 5, title: '공사비 미지급 및 유치권 행사 판례', category: '핵심 대법원 판례집', desc: '하도급 대금 체불 시 적법한 유치권 행사 요건 및 판례 동향' },
  ];

  const filteredLibrary = mockLibrary.filter(item => 
    (libraryCategory === '전체' || item.category === libraryCategory) &&
    (item.title.includes(searchQuery) || item.desc.includes(searchQuery))
  );

  const mockBasicLibrary = [
    { id: 101, title: '2024년 1회차 건축기사 법규 기출', category: '기출문제 DB', desc: '큐넷 공개 문제 기반 (건축법, 주택법, 국토계획법 등)' },
    { id: 102, title: '2023년 2회차 건축기사 법규 기출', category: '기출문제 DB', desc: '자주 틀리는 오답 노트 포함 (용적률, 건폐율 등)' },
    { id: 103, title: '왕초보 건폐율/용적률 완벽 해설', category: '기초 법규 해설', desc: '부동산 초보자도 이해할 수 있는 1타 강사식 쉬운 풀이' },
    { id: 104, title: '대수선 vs 증축 vs 개축 헷갈리지 않기', category: '기초 법규 해설', desc: '기사 시험 단골 출제! 용어의 정확한 개념 정리' },
  ];

  const filteredBasicLibrary = mockBasicLibrary.filter(item => 
    (basicLibraryCategory === '전체' || item.category === basicLibraryCategory) &&
    (item.title.includes(searchQuery) || item.desc.includes(searchQuery))
  );

  const startBasicChat = (topic: string) => {
    setAiPersona('instructor');
    setActiveTab('chat');
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: '안녕하세요! 친절한 건축법 1타 강사입니다 🧑‍🏫\n\n' + topic + '에 대해 궁금하신 점이 있나요? 딱딱한 법조문 대신 이해하기 쉽게 설명해 드릴게요!'
    }]);
  };

  const handleGenerateRiskReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskFormData.location || !riskFormData.usage || !riskFormData.scale) return;
    
    setIsGeneratingRisk(true);
    try {
      const res = await fetch('/api/analyze-ordinance-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(riskFormData),
      });
      if (!res.ok) throw new Error('Failed to generate risk report');
      const data = await res.json();
      setRiskReportData(data);
    } catch (err) {
      console.error(err);
      alert('리스크 보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingRisk(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (내 사건 보관함) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#121212] text-neutral-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 border-r border-neutral-900 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg">
              <Scale className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">건축 법무 대시보드</h1>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-neutral-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col border-b border-neutral-800 p-2 gap-2">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <MessageSquare className="w-4 h-4" /> AI 상담
            </button>
            <button 
              onClick={() => { setActiveTab('library'); setLibraryMode('expert'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-sm font-semibold rounded-lg transition-colors ${(activeTab === 'library' && libraryMode === 'expert') ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <Library className="w-4 h-4" /> 도서관
            </button>
          </div>
          <button 
            onClick={() => { setActiveTab('library'); setLibraryMode('basic'); }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-2 text-sm font-semibold rounded-lg transition-colors ${(activeTab === 'library' && libraryMode === 'basic') ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-500 hover:text-neutral-300 border border-neutral-800/50 border-dashed'}`}
          >
            <BookOpen className="w-4 h-4" /> 기초 법규 및 기사 해설
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#D4AF37] hover:bg-[#C5A028] text-neutral-900 text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> 새 법률 자문 시작
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-neutral-800">
          <h2 className="text-xs font-semibold text-neutral-500 mb-3 px-2">나의 핵심 법리 노트</h2>
          <div className="space-y-1 mb-8">
            {bookmarkedMessages.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-neutral-500 bg-neutral-800/30 rounded-lg border border-neutral-800/50">
                별표(★)를 눌러 중요한<br/>법률 답변을 스크랩하세요.
              </div>
            ) : (
              bookmarkedMessages.map((msg, idx) => (
                <button key={idx} className="w-full flex items-center gap-3 px-3 py-2.5 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm text-left group transition-colors border border-transparent hover:border-neutral-700">
                  <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                  <span className="flex-1 truncate text-xs">{msg.text.substring(0, 20)}...</span>
                </button>
              ))
            )}
          </div>

          <h2 className="text-xs font-semibold text-neutral-500 mb-3 px-2">내 사건 보관함 (진행 중)</h2>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-neutral-800/80 text-[#D4AF37] rounded-lg text-sm text-left group border border-neutral-700/50">
              <Folder className="w-4 h-4 text-[#D4AF37]" />
              <span className="flex-1 truncate font-medium">마포구 상가 신축 현장</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]/70" />
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-300 rounded-lg text-sm text-left group transition-colors">
              <Folder className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400" />
              <span className="flex-1 truncate">A시공사 하도급 분쟁</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-300 rounded-lg text-sm text-left group transition-colors">
              <Folder className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400" />
              <span className="flex-1 truncate">영덕군 펜션 리모델링</span>
            </button>
          </div>

          <h2 className="text-xs font-semibold text-neutral-500 mb-3 px-2 mt-8">이전 자문 내역</h2>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-300 rounded-lg text-sm text-left transition-colors group">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-400" />
              <span className="truncate">일조권 사선제한 질의</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-300 rounded-lg text-sm text-left transition-colors group">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-400" />
              <span className="truncate">용도변경 허가 절차</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Top Banner (실시간 뉴스/업데이트) */}
        <header className="flex-none bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center gap-4 z-10 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeTab === 'chat' && aiPersona === 'instructor' && (
              <span className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 mr-2">
                🎓 1타 강사 모드
              </span>
            )}
            <span className="bg-[#D4AF37]/10 text-[#B8962A] border border-[#D4AF37]/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <Bell className="w-3 h-3" /> 실시간 업데이트
            </span>
          </div>
          
          <div className="flex-1 overflow-hidden relative h-6 flex items-center">
            <AnimatePresence mode="wait">
              {news.length > 0 ? (
                <motion.a
                  key={currentNewsIndex}
                  href={news[currentNewsIndex].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="text-sm text-neutral-600 font-medium truncate w-full absolute left-0 hover:text-[#D4AF37] hover:underline"
                >
                  {news[currentNewsIndex].title}
                </motion.a>
              ) : (
                 <p className="text-sm text-neutral-400 font-medium truncate w-full absolute left-0">
                   최신 뉴스를 불러오는 중입니다...
                 </p>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Location Context Bar */}
        {activeTab === 'chat' && (
          <div className="flex-none bg-slate-50 border-b border-neutral-200 px-4 sm:px-6 py-2.5 flex items-center z-10 shadow-inner">
            <div className="max-w-3xl mx-auto w-full flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <input 
                type="text" 
                placeholder="현장 주소(지번)를 입력하세요 (예: 서울특별시 마포구 서교동)" 
                value={locationContext}
                onChange={(e) => setLocationContext(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-neutral-700 placeholder-neutral-400"
              />
            </div>
          </div>
        )}

        {/* Chat Container */}
        {activeTab === 'chat' ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 bg-[#FAFAFA]">
              <div className="max-w-3xl mx-auto space-y-8">
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                let displayText = message.text;
                let region = null;
                
                let hasTimeline = false;
                
                let crossCheckAlert = null;

                if (message.role === 'model') {
                  const crossCheckMatch = displayText.match(/\[CROSS_CHECK:\s*(.+?)\]/);
                  if (crossCheckMatch) {
                    crossCheckAlert = crossCheckMatch[1].trim();
                    displayText = displayText.replace(crossCheckMatch[0], '').trim();
                  }

                  if (displayText.includes('[UI_COMPONENT: PERMIT_TIMELINE]')) {
                    hasTimeline = true;
                    displayText = displayText.replace('[UI_COMPONENT: PERMIT_TIMELINE]', '');
                  }
                  
                  const metaIndex = displayText.indexOf('[App_System_Metadata]');
                  if (metaIndex !== -1) {
                    const metaText = displayText.substring(metaIndex);
                    displayText = displayText.substring(0, metaIndex).trim();
                    const match = metaText.match(/Region_Track:\s*([^\n]+)/);
                    if (match) {
                      region = match[1].trim();
                    }
                  } else {
                    const match = displayText.match(/Region_Track:\s*([^\n]+)/);
                    if (match) {
                      region = match[1].trim();
                    }
                  }
                }
                
                const isValidRegion = region && region !== '전국' && !region.includes('없음') && region !== '(없음)';

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-[#121212] text-white rounded-2xl rounded-tr-sm px-5 py-4 shadow-md'
                          : 'bg-white border border-neutral-200 shadow-sm rounded-2xl rounded-tl-sm px-6 py-5 text-neutral-800'
                      }`}
                    >
                      {crossCheckAlert && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 shadow-sm">
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-red-700 mb-0.5">⚠️ 타법령 충돌 및 중대재해 리스크 경고</h4>
                            <p className="text-sm font-medium text-red-900 leading-snug">{crossCheckAlert}</p>
                          </div>
                        </div>
                      )}

                      {message.role === 'model' && (
                        <div className="flex items-center justify-between mb-3 text-neutral-800 font-semibold text-sm">
                          <div className="flex items-center gap-2">
                            {aiPersona === 'instructor' ? (
                              <BookOpen className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <ScaleIcon className="w-4 h-4 text-[#D4AF37]" />
                            )}
                            <span>{aiPersona === 'instructor' ? 'AI 1타 강사 해설' : 'AI 건축·법무 소견'}</span>
                          </div>
                          <button 
                            onClick={() => toggleBookmark(message)}
                            className="p-1 text-neutral-400 hover:text-[#D4AF37] transition-colors"
                            title="핵심 법리 노트에 스크랩하기"
                          >
                            <svg className={`w-5 h-5 ${bookmarkedMessages.find(m => m.id === message.id) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className={`prose prose-sm sm:prose-base max-w-none ${
                        message.role === 'user' 
                          ? 'prose-p:text-white/95 prose-headings:text-white prose-strong:text-white' 
                          : 'prose-p:text-neutral-700 prose-headings:text-neutral-900 prose-strong:text-neutral-900 prose-li:text-neutral-700'
                      }`}>
                        <Markdown
                          components={{
                            a: ({ node, href, title, children, ...props }) => {
                              if (href === '#' && title) {
                                return (
                                  <span className="relative group inline-block cursor-help text-neutral-900 font-semibold border-b border-dashed border-neutral-400 hover:text-[#D4AF37] transition-colors">
                                    {children}
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs p-3 bg-neutral-900 text-white text-xs font-normal rounded-lg shadow-lg z-50 whitespace-normal leading-relaxed pointer-events-none">
                                      {title}
                                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></span>
                                    </span>
                                  </span>
                                );
                              }
                              return (
                                <a href={href} title={title} className="text-[#D4AF37] hover:text-[#B8962A] hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props}>
                                  {children}
                                </a>
                              );
                            }
                          }}
                        >
                          {displayText}
                        </Markdown>
                      </div>
                      
                      {hasTimeline && <PermitTimeline />}
                      
                      {isValidRegion && (
                        <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-neutral-400" />
                            해당 지역 자치법규 확인
                          </span>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(region + ' 건축조례 site:elis.go.kr')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-semibold rounded-lg hover:bg-neutral-100 hover:border-[#D4AF37]/50 hover:text-[#B8962A] transition-all shadow-sm"
                          >
                            {region} 건축조례 바로가기
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {messages.length > 1 && !isLoading && !isGeneratingDoc && messages[messages.length - 1].role === 'model' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <button 
                  onClick={handleGenerateDocument}
                  className="w-full sm:max-w-[75%] mt-2 mb-4 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-[#D4AF37] hover:bg-[#D4AF37]/5 text-[#B8962A] font-bold rounded-xl shadow-sm hover:shadow-md transition-all group"
                >
                  <FileSignature className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  📄 이 사안으로 내용증명/공문서 자동 생성하기
                </button>
              </motion.div>
            )}
            {isGeneratingDoc && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="w-full sm:max-w-[75%] mt-2 mb-4 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border border-neutral-200 text-[#D4AF37] font-bold rounded-xl shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  공문서 양식 작성 중...
                </div>
              </motion.div>
            )}

            {isLoading && !isAnalyzingImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl rounded-tl-sm px-6 py-5 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                  <span className="text-sm font-medium text-neutral-500">관련 법령 및 국가법령정보(RAG)를 검색·검토 중입니다...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-none bg-white border-t border-neutral-200 p-4 sm:p-6 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto">
            {/* Mega Dashboard Tabs */}
            {messages.length === 1 && (
              <div className="mb-4">
                <div className="flex bg-neutral-100 p-1 rounded-xl mb-3 shadow-inner">
                  <button onClick={() => setMegaDomain('design')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${megaDomain === 'design' ? 'bg-white text-[#D4AF37] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    <Building2 className="w-4 h-4" /> 설계/인허가
                  </button>
                  <button onClick={() => setMegaDomain('construction')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${megaDomain === 'construction' ? 'bg-white text-orange-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    <HardHat className="w-4 h-4" /> 시공/안전
                  </button>
                  <button onClick={() => setMegaDomain('supervision')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${megaDomain === 'supervision' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    <ClipboardList className="w-4 h-4" /> 감리/CM
                  </button>
                  <button onClick={() => setMegaDomain('environment')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${megaDomain === 'environment' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    <Leaf className="w-4 h-4" /> 환경/민원
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={fetchLiveBriefing} 
                    className="col-span-2 flex items-center justify-center gap-2 p-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md group text-center mb-1"
                  >
                    <Bell className="w-5 h-5 group-hover:animate-swing" />
                    주간 실시간 건축/건설 법령 개정 브리핑 (국토교통부 연동)
                  </button>
                  <button 
                    onClick={() => setIsCompareModalOpen(true)} 
                    className="col-span-2 flex items-center justify-center gap-2 p-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md group text-center mb-1"
                  >
                    <Scale className="w-5 h-5 group-hover:animate-pulse" />
                    AI 판례 및 법령 교차 비교 분석 (Table 요약)
                  </button>
                  {megaDomain === 'design' && (
                    <>
                      <button onClick={() => setIsRiskModalOpen(true)} className="col-span-2 flex items-center justify-center gap-2 p-3 text-xs font-semibold text-[#D4AF37] bg-[#121212] hover:bg-black border border-[#D4AF37]/30 rounded-xl transition-all shadow-md group text-center">
                        <FileText className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                        📄 지자체 조례 리스크 자동 진단 보고서 생성
                      </button>
                      <button onClick={() => sendMessage('마포구 상가 신축 건에 대한 인허가 리스크 및 법적 제한사항을 사전 검토해 주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-[#D4AF37] group text-center hover:text-[#B8962A]">
                        <ShieldCheck className="w-5 h-5 text-neutral-400 group-hover:text-[#D4AF37] transition-transform" />
                        인허가 사전 검토
                      </button>
                      <button onClick={() => sendMessage('내진설계, 방화구획 등 KBC(한국건축규정) 구조 및 재료 규정을 검색해 주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-[#D4AF37] group text-center hover:text-[#B8962A]">
                        <Ruler className="w-5 h-5 text-neutral-400 group-hover:text-[#D4AF37] transition-transform" />
                        KBC 기술 규정 검색
                      </button>
                    </>
                  )}
                  {megaDomain === 'construction' && (
                    <>
                      <button onClick={() => sendMessage('건설 현장에서 중대재해처벌법을 대비하기 위한 안전보건관리체계 구축 방안과 핵심 리스크를 알려주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-orange-500 group text-center hover:text-orange-600">
                        <AlertTriangle className="w-5 h-5 text-neutral-400 group-hover:text-orange-500 transition-transform" />
                        중대재해/안전보건
                      </button>
                      <button onClick={() => sendMessage('건설근로자 노무 규정 및 임금 체불 발생 시 하도급법에 따른 대응 방안을 설명해 주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-orange-500 group text-center hover:text-orange-600">
                        <Hammer className="w-5 h-5 text-neutral-400 group-hover:text-orange-500 transition-transform" />
                        건설 노무/임금체불
                      </button>
                    </>
                  )}
                  {megaDomain === 'supervision' && (
                    <>
                      <button onClick={() => sendMessage('건설기술진흥법에 따른 책임감리원의 권한 및 공사중지명령 발동 요건에 대해 알려주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-blue-500 group text-center hover:text-blue-600">
                        <Gavel className="w-5 h-5 text-neutral-400 group-hover:text-blue-500 transition-transform" />
                        감리원 권한/책임
                      </button>
                      <button onClick={() => sendMessage('KCS(표준시방서)에 따른 현장 품질관리 및 공정관리 실패 시 CM/PM의 법적 책임은 어떻게 되나요?')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-blue-500 group text-center hover:text-blue-600">
                        <ClipboardList className="w-5 h-5 text-neutral-400 group-hover:text-blue-500 transition-transform" />
                        품질/공정 관리 리스크
                      </button>
                    </>
                  )}
                  {megaDomain === 'environment' && (
                    <>
                      <button onClick={() => sendMessage('소음진동관리법에 따른 건설현장 소음 규제 기준 및 인근 주민 환경분쟁조정위원회 민원 대응 방안을 알려주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-emerald-500 group text-center hover:text-emerald-600">
                        <Sun className="w-5 h-5 text-neutral-400 group-hover:text-emerald-500 transition-transform" />
                        환경 민원/소음 분쟁
                      </button>
                      <button onClick={() => sendMessage('지하안전관리에 관한 특별법에 따른 굴착공사 시 지하안전평가 기준과 싱크홀 방지 대책을 정리해 주세요.')} className="flex flex-col items-center justify-center gap-1.5 p-3 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all hover:shadow-sm hover:border-emerald-500 group text-center hover:text-emerald-600">
                        <Folder className="w-5 h-5 text-neutral-400 group-hover:text-emerald-500 transition-transform" />
                        토목/지하안전평가
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {uploadedDocs.length > 0 && (
              <div className="mb-3 px-1 flex flex-wrap gap-2">
                {uploadedDocs.map((doc, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121212] border border-[#D4AF37]/30 text-xs font-medium text-[#D4AF37]">
                    <FileText className="w-3 h-3" />
                    {doc.name} (RAG 적용 중)
                  </span>
                ))}
              </div>
            )}
            
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 bg-[#FAFAFA] border border-neutral-300 rounded-2xl p-2 transition-shadow focus-within:ring-1 focus-within:ring-[#D4AF37] focus-within:border-[#D4AF37] focus-within:bg-white"
            >
              <input 
                type="file" 
                ref={imageInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isLoading}
                className="flex-none p-3.5 text-neutral-400 hover:text-[#D4AF37] disabled:opacity-50 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="건축법, KBC 규정, 지자체 조례 또는 분쟁 상황을 자유롭게 입력해 주세요..."
                className="w-full max-h-48 min-h-[52px] bg-transparent border-none resize-none focus:ring-0 px-2 py-3 text-neutral-900 placeholder:text-neutral-400 text-[15px] leading-relaxed scrollbar-thin outline-none"
                rows={1}
              />
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`flex-none p-3.5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400 hover:text-[#D4AF37] disabled:opacity-50'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-none p-3.5 bg-[#121212] text-[#D4AF37] rounded-xl hover:bg-[#2A2A2A] disabled:opacity-50 disabled:hover:bg-[#121212] transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            {/* Footer / LawTalk Link */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
               <p className="text-[11px] text-neutral-400 font-medium text-center sm:text-left flex-1">
                 ⚠️ 본 서비스는 AI를 활용한 기초 법률 검토 도구입니다. 정확한 사실관계에 따른 확정적 법률 해석은 대한변호사협회 등록 건축 전문 변호사와 상담하시기 바랍니다.
               </p>
               
               <div className="flex-none flex items-center gap-2">
                 <button
                   onClick={generatePDF}
                   disabled={messages.length <= 1 || isLoading}
                   className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#121212] border border-neutral-300 text-xs font-bold rounded-lg hover:bg-neutral-50 hover:border-[#D4AF37] hover:text-[#B8962A] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                 >
                   <Download className="w-3.5 h-3.5" />
                   PDF 다운로드
                 </button>
                 <a
                   href="https://www.lawtalk.co.kr/"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-1.5 px-4 py-2 bg-[#121212] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-bold rounded-lg hover:bg-[#D4AF37] hover:text-[#121212] transition-all shadow-sm"
                   onClick={() => {
                     const lastModelMsg = messages.filter(m => m.role === 'model').pop();
                     if (lastModelMsg && lastModelMsg.text.includes('[변호사 제출용 1장 요약 브리핑]')) {
                       navigator.clipboard.writeText(lastModelMsg.text).catch(() => {});
                     }
                   }}
                 >
                   <FileText className="w-3.5 h-3.5" />
                   리포트 복사 및 로톡 연결
                 </a>
               </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-hidden">
            {/* Library Search & Filter Header */}
            <div className="bg-white px-6 py-6 border-b border-neutral-200">
              <div className="max-w-5xl mx-auto">
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={libraryMode === 'expert' ? "어떤 건축 현장(프로젝트)의 법적 리스크를 검토하시겠습니까? (예: 상가 신축 주차장 기준, 공사비 미지급 판례)" : "건축기사 기출문제 년도, 혹은 궁금한 건축 기초 용어를 검색해보세요."}
                    className={`w-full bg-[#FAFAFA] border border-neutral-300 rounded-xl px-12 py-4 text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-1 shadow-sm transition-all ${libraryMode === 'expert' ? 'focus:border-[#D4AF37] focus:ring-[#D4AF37]' : 'focus:border-indigo-500 focus:ring-indigo-500'}`}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {libraryMode === 'expert' ? (
                    ['전체', '핵심 대법원 판례집', '표준 도급/설계 계약서', 'e-KBC 구조/기술 표준', '지자체 조례 체크리스트', '감리/CM 체크리스트'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setLibraryCategory(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          libraryCategory === cat 
                            ? 'bg-[#121212] text-[#D4AF37] shadow-md border border-[#D4AF37]/30' 
                            : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-[#D4AF37]/50 hover:text-[#B8962A]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))
                  ) : (
                    ['전체', '기출문제 DB', '기초 법규 해설'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBasicLibraryCategory(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          basicLibraryCategory === cat 
                            ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' 
                            : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-indigo-500/50 hover:text-indigo-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Library Grid */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                
                {libraryMode === 'expert' ? (
                  <>
                    {libraryCategory === '표준 도급/설계 계약서' && (
                      <div className="col-span-2 sm:col-span-3 lg:col-span-4 mb-4">
                        <div 
                          onClick={() => contractInputRef.current?.click()}
                          className="group cursor-pointer flex flex-col items-center justify-center p-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-dashed border-red-300 rounded-xl hover:border-red-500 hover:shadow-md transition-all relative overflow-hidden"
                        >
                          {isScanningContract ? (
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                              <h3 className="text-base font-bold text-red-800">AI가 계약서의 독소조항을 분석 중입니다...</h3>
                            </div>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-full bg-white text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm border border-red-200">
                                <Search className="w-6 h-6" />
                              </div>
                              <h3 className="text-base font-bold text-red-800 text-center mb-2">🔍 계약서 독소조항 스캔 (AI 파일 분석)</h3>
                              <p className="text-sm text-red-600/80 text-center px-4">표준 도급 계약서나 하도급 계약서(PDF/TXT)를 업로드하면 AI가 불공정 약관을 스캔하고 수정안을 제안합니다.</p>
                            </>
                          )}
                          <input 
                            type="file" 
                            ref={contractInputRef} 
                            className="hidden" 
                            accept=".pdf,.txt" 
                            onChange={handleContractScan} 
                            disabled={isScanningContract}
                          />
                        </div>
                      </div>
                    )}

                    {libraryCategory === '감리/CM 체크리스트' && (
                      <div className="col-span-2 sm:col-span-3 lg:col-span-4 mb-4">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                            <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                              <ClipboardList className="w-5 h-5 text-blue-600" />
                              신규 공정 단계별 체크리스트 작성
                            </h3>
                          </div>
                          <div className="p-6">
                            <p className="text-sm text-neutral-600 mb-4">작성할 공정 단계를 선택하고 점검 완료 시 대화창으로 내보내어 법적 기록으로 남길 수 있습니다.</p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                  onClick={() => {
                                    const items = ['안전관리계획서 승인 여부', '품질관리계획서 적정성', '착공신고서류 검토', '현장대리인 선임계 검토'];
                                    const checklistText = `■ 감리/CM 체크리스트 점검 완료 보고\n- 공정 단계: 착공 전 사전 준비\n- 점검 일시: ${new Date().toLocaleString('ko-KR')}\n- 점검 항목:\n` + items.map(i => `  [v] ${i}`).join('\n');
                                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: checklistText }]);
                                    setActiveTab('chat');
                                  }}>
                                  착공 전 사전 준비 완료보고
                                </button>
                                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                  onClick={() => {
                                    const items = ['흙막이 지보공 시공 상세도 승인', '계측기 설치 적정성', '주변 구조물 안전점검', '비산먼지 발생 억제조치'];
                                    const checklistText = `■ 감리/CM 체크리스트 점검 완료 보고\n- 공정 단계: 토공사 및 흙막이\n- 점검 일시: ${new Date().toLocaleString('ko-KR')}\n- 점검 항목:\n` + items.map(i => `  [v] ${i}`).join('\n');
                                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: checklistText }]);
                                    setActiveTab('chat');
                                  }}>
                                  토공사/흙막이 완료보고
                                </button>
                                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                  onClick={() => {
                                    const items = ['철근 배근 간격 및 이음 길이', '거푸집 동바리 안전성 검토', '콘크리트 타설 전 청소 상태', '레미콘 송장 확인'];
                                    const checklistText = `■ 감리/CM 체크리스트 점검 완료 보고\n- 공정 단계: 골조 공사 (철근/콘크리트)\n- 점검 일시: ${new Date().toLocaleString('ko-KR')}\n- 점검 항목:\n` + items.map(i => `  [v] ${i}`).join('\n');
                                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: checklistText }]);
                                    setActiveTab('chat');
                                  }}>
                                  골조 공사 (RC) 완료보고
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group cursor-pointer flex flex-col items-center justify-center p-6 bg-[#FAFAFA] border-2 border-dashed border-neutral-300 rounded-xl hover:border-[#D4AF37] hover:bg-white transition-all h-[240px]"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#121212] text-[#D4AF37] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md border border-[#D4AF37]/30">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-800 text-center mb-1">새 실무 레퍼런스 업로드</h3>
                      <p className="text-xs text-neutral-500 text-center px-2">로펌 내부 판례집, 가이드라인 등 PDF/TXT 첨부</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.txt" 
                        onChange={handleFileUpload} 
                      />
                    </div>

                    {filteredLibrary.map((item) => (
                      <div key={item.id} className="group relative flex flex-col bg-[#1A1A1A] rounded-r-xl rounded-l-sm border-y border-r border-[#D4AF37]/30 shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all h-[240px] cursor-pointer">
                        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-b from-[#0a0a0a] via-[#121212] to-[#0a0a0a] border-r border-[#D4AF37]/20 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.5)] flex flex-col items-center py-4">
                          <div className="w-4 h-0.5 bg-[#D4AF37]/40 mb-1"></div>
                          <div className="w-4 h-0.5 bg-[#D4AF37]/40 mb-auto"></div>
                          <div className="w-4 h-0.5 bg-[#D4AF37]/40 mt-auto"></div>
                          <div className="w-4 h-0.5 bg-[#D4AF37]/40 mt-1"></div>
                        </div>
                        <div className="flex-1 pl-12 p-5 flex flex-col">
                          <span className="text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase mb-2">{item.category}</span>
                          <h3 className="text-sm font-bold text-white leading-snug mb-3 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="w-8 h-[1px] bg-[#D4AF37]/30 mb-3"></div>
                          <p className="text-xs text-neutral-400 line-clamp-3 mt-auto leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {filteredBasicLibrary.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => startBasicChat(`[${item.title}]`)}
                        className="group relative flex flex-col bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden hover:shadow-lg transition-all h-[240px] cursor-pointer hover:border-indigo-300"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                        <div className="flex-1 p-5 flex flex-col">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mb-1 bg-indigo-50 inline-block px-2 py-0.5 rounded-full self-start">{item.category}</span>
                          <h3 className="text-sm font-bold text-neutral-900 leading-snug mt-2 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-neutral-500 line-clamp-3 mt-auto leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <div className="bg-indigo-50/50 p-3 text-[10px] font-semibold text-indigo-600 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          클릭하여 1타 강사 해설 보기
                        </div>
                      </div>
                    ))}
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden PDF Report Container */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}>
        <div ref={reportRef} className="bg-white p-12 font-sans text-black w-full">
          <div className="flex items-center justify-between border-b-2 border-[#121212] pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#121212] tracking-tight">건축 법률 자문 요약 보고서</h1>
              <p className="text-sm font-medium text-neutral-500 mt-2">AI Architect Legal Consultant</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-800">발급일시</p>
              <p className="text-sm text-neutral-600">{new Date().toLocaleString('ko-KR')}</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {messages.filter(m => m.id !== '1').map((msg, idx) => {
              // Remove system hidden texts for the PDF
              let cleanText = msg.text.replace(/\[App_System_Metadata\][\s\S]*/, '').replace(/\[UI_COMPONENT: PERMIT_TIMELINE\]/, '');
              
              return (
                <div key={idx} className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                  <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${msg.role === 'user' ? 'text-blue-800' : 'text-[#B8962A]'}`}>
                    {msg.role === 'user' ? '■ 의뢰인 질의 내용' : '■ AI 전문 법률 소견'}
                  </h2>
                  <div className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap">
                    <Markdown>{cleanText}</Markdown>
                  </div>
                </div>
              );
            })}
            
            {messages.length <= 1 && (
              <div className="text-center py-20 text-neutral-400">
                작성된 자문 내역이 없습니다.
              </div>
            )}
          </div>
          
          <div className="mt-12 pt-6 border-t border-neutral-200 text-center">
             <p className="text-xs text-neutral-500">
               본 보고서는 AI 보조 도구에 의해 작성된 요약본으로, 법적 효력을 갖는 공식 의견서가 아닙니다.<br/>
               확정적 법률 자문 및 소송 진행은 반드시 대한변호사협회 등록 전문 변호사와 상담하시기 바랍니다.
             </p>
          </div>
        </div>
      </div>

      {/* Ordinance Risk Modal */}
      {isRiskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[#121212] text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
                지자체 조례 위반 리스크 자동 진단
              </h2>
              <button onClick={() => { setIsRiskModalOpen(false); setRiskReportData(null); }} className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
              <div className="flex-[1] p-6 border-b md:border-b-0 md:border-r border-neutral-200 bg-white overflow-y-auto">
                <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  프로젝트 조건 입력
                </h3>
                <form onSubmit={handleGenerateRiskReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">대지위치 (지자체 포함)</label>
                    <input type="text" placeholder="예: 서울특별시 마포구 서교동" value={riskFormData.location} onChange={e => setRiskFormData({...riskFormData, location: e.target.value})} className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">건축물 용도</label>
                    <input type="text" placeholder="예: 근린생활시설, 다가구주택" value={riskFormData.usage} onChange={e => setRiskFormData({...riskFormData, usage: e.target.value})} className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">건축 규모</label>
                    <input type="text" placeholder="예: 지상 5층, 연면적 800㎡" value={riskFormData.scale} onChange={e => setRiskFormData({...riskFormData, scale: e.target.value})} className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none" required />
                  </div>
                  <button type="submit" disabled={isGeneratingRisk} className="w-full py-3 bg-[#121212] hover:bg-black text-[#D4AF37] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-50">
                    {isGeneratingRisk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isGeneratingRisk ? '리스크 분석 중...' : '리스크 보고서 생성'}
                  </button>
                </form>
              </div>
              
              <div className="flex-[2] p-6 overflow-y-auto">
                {!riskReportData ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                    <ShieldCheck className="w-12 h-12 mb-3 text-neutral-300" />
                    <p className="text-sm font-medium">좌측에 프로젝트 조건을 입력하시면,<br/>AI가 지자체 조례 기반 잠재 리스크를 분석합니다.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                      <h3 className="font-bold text-neutral-800 mb-2 border-b border-neutral-100 pb-2">📋 총평 요약</h3>
                      <p className="text-sm text-neutral-700 leading-relaxed">{riskReportData.summary}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        세부 조례 위반 리스크 ({riskReportData.risks?.length || 0}건)
                      </h3>
                      <div className="space-y-4">
                        {riskReportData.risks?.map((risk, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                risk.severity.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                                risk.severity.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {risk.severity} RISK
                              </span>
                              <h4 className="font-bold text-neutral-800 text-sm">{risk.category}</h4>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-bold text-neutral-500 mb-1 block">위험 내용</span>
                                <p className="text-sm text-neutral-700 leading-relaxed">{risk.description}</p>
                              </div>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <span className="text-xs font-bold text-blue-700 mb-1 block">💡 실무 방어 제안</span>
                                <p className="text-sm text-blue-900 leading-relaxed">{risk.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[#121212] text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#D4AF37]" />
                판례 및 법령 AI 교차 비교 분석
              </h2>
              <button onClick={() => setIsCompareModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
              <div className="flex-[1] p-6 border-b md:border-b-0 md:border-r border-neutral-200 bg-white overflow-y-auto min-w-[300px]">
                <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  비교 대상 입력
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">비교 대상 1 (법령 또는 판례)</label>
                    <textarea 
                      rows={4}
                      placeholder="예: 건축법 제11조 (건축허가)" 
                      value={compareFormData.law1} 
                      onChange={e => setCompareFormData({...compareFormData, law1: e.target.value})} 
                      className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">비교 대상 2 (법령 또는 판례)</label>
                    <textarea 
                      rows={4}
                      placeholder="예: 주택법 제15조 (사업계획의 승인)" 
                      value={compareFormData.law2} 
                      onChange={e => setCompareFormData({...compareFormData, law2: e.target.value})} 
                      className="w-full text-sm border border-neutral-300 rounded-lg p-2.5 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none resize-none" 
                    />
                  </div>
                  <button 
                    onClick={handleCompareLaws} 
                    disabled={isComparing || !compareFormData.law1 || !compareFormData.law2} 
                    className="w-full py-3 bg-[#121212] hover:bg-black text-[#D4AF37] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-50"
                  >
                    {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isComparing ? 'AI 교차 비교 중...' : '차이점 비교 분석'}
                  </button>
                </div>
              </div>
              
              <div className="flex-[2] p-6 overflow-y-auto bg-white">
                {!compareResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                    <Scale className="w-12 h-12 mb-3 text-neutral-300" />
                    <p className="text-sm font-medium text-center">좌측에 두 개의 법령이나 판례를 입력하시면,<br/>AI가 핵심 차이점을 표 형태로 요약 분석합니다.</p>
                  </div>
                ) : (
                  <div className="prose prose-sm sm:prose-base max-w-none prose-p:text-neutral-700 prose-headings:text-neutral-900 prose-strong:text-neutral-900 prose-table:w-full prose-table:border-collapse prose-th:bg-neutral-100 prose-th:border prose-th:border-neutral-300 prose-th:p-3 prose-td:border prose-td:border-neutral-300 prose-td:p-3">
                    <Markdown>{compareResult}</Markdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
