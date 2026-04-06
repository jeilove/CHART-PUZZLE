"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Play, ChevronLeft, ChevronRight, Loader2, Star, Menu, X, Trash2, 
  GripVertical, Plus, Edit3, Check, CheckSquare, Square, Filter, ChevronDown,
  Bell, LayoutGrid, TrendingUp, LogIn, LogOut, User as UserIcon
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { PuzzleGame } from "@/components/puzzle/PuzzleGame";
import { motion, AnimatePresence } from "framer-motion";
import StockHeatmap from "@/components/ui/StockHeatmap";
import { TriggerAnalysis } from "@/components/ui/TriggerAnalysis";

// 1.1.0: TradingView 히트맵 위젯 컴포넌트 (v2.8.7: React.memo 적용)
const TradingViewHeatmapWidget = React.memo(function TradingViewHeatmapWidget({ dataSource }: { dataSource: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // 이미 같은 데이터 소스로 위젯이 있다면 스킵 (깜빡임 방지)
    if (container.querySelector(`[data-source="${dataSource}"]`)) return;

    container.innerHTML = "";
    
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.setAttribute("data-source", dataSource); // 트래킹용 속성 추가
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    wrapper.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "exchanges": [],
      "dataSource": dataSource,
      "grouping": "sector",
      "blockSize": "market_cap_basic",
      "blockColor": "change",
      "locale": "kr",
      "symbolUrl": "",
      "colorTheme": "dark",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": "100%",
      "height": "100%"
    });

    script.onerror = () => {};
    wrapper.appendChild(script);

    if (isMounted.current && containerRef.current) {
      containerRef.current.appendChild(wrapper);
    }

    return () => {
      isMounted.current = false;
      try {
        if (container && wrapper.parentNode === container) {
          container.removeChild(wrapper);
        }
      } catch (_) {}
    };
  }, [dataSource]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black/20 overflow-hidden" />
  );
});

// 1.1.0: 실시간 시장 데이터 연동 커스텀 히트맵 (v2.8.7: React.memo 적용)
const LiveMarketHeatmap = React.memo(function LiveMarketHeatmap({ type }: { type: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/market/heatmap?type=${type}&pages=2`);
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(`${type} data fetch error:`, e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  return <StockHeatmap title={type} data={data} loading={loading} />;
});

// 테스트를 위한 Mock 주가 데이터 (KOSPI 200/KOSDAQ 150 컨셉)
const MOCK_STOCK_DATA = Array.from({ length: 60 }, (_, i) => {
  const date = new Date(2024, 0, i + 1);
  return {
    time: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    open: 300 + Math.random() * 50,
    high: 350 + Math.random() * 50,
    low: 250 + Math.random() * 50,
    close: 300 + Math.random() * 50,
    volume: Math.floor(Math.random() * 100000) + 20000,
  };
});

interface Stock {
  name: string;
  symbol: string;
  industry?: string;
  price?: number;
  change?: number;
}

interface FavoriteGroup {
  id: string;
  name: string;
  stocks: Stock[];
}

const STOCK_LIST: (Stock & { industry: string })[] = [
  { name: "삼성전자", symbol: "005930", industry: "반도체·전기가전" },
  { name: "SK하이닉스", symbol: "000660", industry: "반도체·전기가전" },
  { name: "LG에너지솔루션", symbol: "373220", industry: "2차전지·에너지" },
  { name: "삼성바이오로직스", symbol: "207940", industry: "제약·바이오" },
  { name: "현대차", symbol: "005380", industry: "자동차" },
  { name: "기아", symbol: "000270", industry: "자동차" },
  { name: "셀트리온", symbol: "068270", industry: "제약·바이오" },
  { name: "KB금융", symbol: "105560", industry: "기타금융" },
  { name: "신한지주", symbol: "055550", industry: "기타금융" },
  { name: "POSCO홀딩스", symbol: "005490", industry: "금속" },
  { name: "NAVER", symbol: "035420", industry: "인터넷·플랫폼" },
  { name: "카카오", symbol: "035720", industry: "인터넷·플랫폼" },
  { name: "삼성물산", symbol: "028260", industry: "유통" },
  { name: "현대모비스", symbol: "012330", industry: "자동차부품" },
  { name: "포스코퓨처엠", symbol: "003670", industry: "화학" },
  { name: "LG화학", symbol: "051910", industry: "화학" },
  { name: "삼성SDI", symbol: "006400", industry: "2차전지·에너지" },
  { name: "에코프로비엠", symbol: "247540", industry: "2차전지·에너지" },
  { name: "에코프로", symbol: "086520", industry: "2차전지·에너지" },
  { name: "HLB", symbol: "028300", industry: "제약·바이오" },
  { name: "알테오젠", symbol: "196170", industry: "제약·바이오" },
  { name: "엔켐", symbol: "348370", industry: "화학" },
  { name: "리노공업", symbol: "058470", industry: "반도체·전기가전" },
  { name: "HPSP", symbol: "403870", industry: "반도체·전기가전" },
  { name: "레인보우로보틱스", symbol: "277810", industry: "기계·장비" },
  { name: "이오테크닉스", symbol: "039030", industry: "반도체·전기가전" },
  { name: "솔브레인", symbol: "357780", industry: "반도체·전기가전" },
  { name: "하나마이크론", symbol: "067310", industry: "반도체·전기가전" },
  { name: "주성엔지니어링", symbol: "036930", industry: "반도체·전기가전" },
  { name: "메디톡스", symbol: "086900", industry: "제약·바이오" },
  { name: "휴젤", symbol: "145020", industry: "제약·바이오" },
  { name: "클래시스", symbol: "214150", industry: "의료기기" },
  { name: "파마리서치", symbol: "214450", industry: "제약·바이오" },
  { name: "삼양식품", symbol: "003230", industry: "음식료·담배" },
  { name: "농심", symbol: "004370", industry: "음식료·담배" },
  { name: "오뚜기", symbol: "007310", industry: "음식료·담배" },
  { name: "대상", symbol: "001680", industry: "음식료·담배" },
  { name: "풀무원", symbol: "017810", industry: "음식료·담배" },
  { name: "CJ제일제당", symbol: "097950", industry: "음식료·담배" },
  { name: "하이트진로", symbol: "000080", industry: "음식료·담배" },
  { name: "빙그레", symbol: "005180", industry: "음식료·담배" },
  { name: "오리온", symbol: "271560", industry: "음식료·담배" },
  { name: "롯데칠성", symbol: "005300", industry: "음식료·담배" },
  { name: "한미약품", symbol: "128940", industry: "제약·바이오" },
  { name: "유한양행", symbol: "000100", industry: "제약·바이오" },
  { name: "종근당", symbol: "185750", industry: "제약·바이오" },
  { name: "대웅제약", symbol: "069620", industry: "제약·바이오" },
  { name: "녹십자", symbol: "006280", industry: "제약·바이오" },
  { name: "동국제약", symbol: "086450", industry: "제약·바이오" },
  { name: "보령", symbol: "003850", industry: "제약·바이오" },
  { name: "일양약품", symbol: "007570", industry: "제약·바이오" },
  { name: "대한항공", symbol: "003490", industry: "운송·창고" },
  { name: "아시아나항공", symbol: "020560", industry: "운송·창고" },
  { name: "제주항공", symbol: "089590", industry: "운송·창고" },
  { name: "진에어", symbol: "272450", industry: "운송·창고" },
  { name: "티웨이항공", symbol: "091810", industry: "운송·창고" },
  { name: "HMM", symbol: "011200", industry: "운송·창고" },
  { name: "팬오션", symbol: "028670", industry: "운송·창고" },
  { name: "대한해운", symbol: "005880", industry: "운송·창고" },
  { name: "CJ대한통운", symbol: "000120", industry: "운송·창고" },
  { name: "한진", symbol: "002320", industry: "운송·창고" },
  { name: "현대글로비스", symbol: "086280", industry: "운송·창고" },
  { name: "한국전력", symbol: "015760", industry: "전기·가스" },
  { name: "한국가스공사", symbol: "036460", industry: "전기·가스" },
  { name: "지역난방공사", symbol: "071320", industry: "전기·가스" },
  { name: "S-Oil", symbol: "010950", industry: "화학" },
  { name: "SK이노베이션", symbol: "096770", industry: "2차전지·에너지" },
  { name: "GS", symbol: "078930", industry: "기타금융" },
  { name: "HD현대", symbol: "267250", industry: "기타금융" },
  { name: "금호석유", symbol: "011780", industry: "화학" },
  { name: "롯데케미칼", symbol: "011170", industry: "화학" },
  { name: "대한유화", symbol: "006650", industry: "화학" },
  { name: "효성티앤씨", symbol: "298020", industry: "화학" },
  { name: "효성첨단소재", symbol: "298050", industry: "화학" },
  { name: "효성중공업", symbol: "298040", industry: "전기·전자" },
  { name: "효성기업", symbol: "002220", industry: "음식료·담배" },
  { name: "LS", symbol: "006260", industry: "기타금융" },
  { name: "LS ELECTRIC", symbol: "010120", industry: "전기·전자" },
  { name: "LX인터내셔널", symbol: "001120", industry: "유통" },
  { name: "두산", symbol: "000150", industry: "기타금융" },
  { name: "두산에너빌리티", symbol: "034020", industry: "기계·장비" },
  { name: "두산밥캣", symbol: "241560", industry: "기계·장비" },
  { name: "두산퓨얼셀", symbol: "336260", industry: "전기·전자" },
  { name: "한화", symbol: "000880", industry: "기타금융" },
  { name: "한화솔루션", symbol: "009830", industry: "화학" },
  { name: "한화에어로스페이스", symbol: "012450", industry: "운송장비·부품" },
  { name: "한화시스템", symbol: "272210", industry: "IT 서비스" },
  { name: "한화생명", symbol: "088350", industry: "보험" },
  { name: "한화손해보험", symbol: "000370", industry: "보험" },
  { name: "한화갤러리아", symbol: "452260", industry: "유통" },
  { name: "현대건설", symbol: "000720", industry: "건설" },
  { name: "GS건설", symbol: "006360", industry: "건설" },
  { name: "대우건설", symbol: "047040", industry: "건설" },
  { name: "DL이앤씨", symbol: "375500", industry: "건설" },
  { name: "HDC현대산업개발", symbol: "294870", industry: "건설" },
  { name: "금호건설", symbol: "002990", industry: "건설" },
  { name: "계룡건설", symbol: "013580", industry: "건설" },
  { name: "동부건설", symbol: "005960", industry: "건설" },
  { name: "태영건설", symbol: "009410", industry: "건설" },
  { name: "삼성증권", symbol: "016360", industry: "증권" },
  { name: "미래에셋증권", symbol: "006800", industry: "증권" },
  { name: "NH투자증권", symbol: "005940", industry: "증권" },
  { name: "한국금융지주", symbol: "071050", industry: "증권" },
  { name: "키움증권", symbol: "039490", industry: "증권" },
  { name: "메리츠금융지주", symbol: "138040", industry: "기타금융" },
  { name: "우리금융지주", symbol: "316140", industry: "기타금융" },
  { name: "기업은행", symbol: "024110", industry: "기타금융" },
  { name: "카카오뱅크", symbol: "323410", industry: "기타금융" },
  { name: "카카오페이", symbol: "377300", industry: "기타금융" },
  { name: "하이브", symbol: "352820", industry: "오락·문화" },
  { name: "JYP Ent.", symbol: "035900", industry: "오락·문화" },
  { name: "에스엠", symbol: "041510", industry: "오락·문화" },
  { name: "와이지엔터테인먼트", symbol: "122870", industry: "오락·문화" },
  { name: "CJ ENM", symbol: "035760", industry: "오락·문화" },
  { name: "스튜디오드래곤", symbol: "253450", industry: "오락·문화" },
  { name: "콘텐트리중앙", symbol: "036420", industry: "오락·문화" },
  { name: "아모레퍼시픽", symbol: "090430", industry: "화학" },
  { name: "LG생활건강", symbol: "051900", industry: "화학" },
  { name: "코스맥스", symbol: "192820", industry: "화학" },
  { name: "한국콜마", symbol: "161890", industry: "화학" },
  { name: "애경산업", symbol: "018250", industry: "화학" },
  { name: "에이블씨엔씨", symbol: "078520", industry: "화학" },
  { name: "클리오", symbol: "237880", industry: "화학" },
  { name: "강원랜드", symbol: "035250", industry: "오락·문화" },
  { name: "GKL", symbol: "114090", industry: "오락·문화" },
  { name: "파라다이스", symbol: "034230", industry: "오락·문화" },
  { name: "롯데쇼핑", symbol: "023530", industry: "유통" },
  { name: "이마트", symbol: "139480", industry: "유통" },
  { name: "현대백화점", symbol: "069960", industry: "유통" },
  { name: "신세계", symbol: "004170", industry: "유통" },
  { name: "GS리테일", symbol: "007070", industry: "유통" },
  { name: "BGF리테일", symbol: "282330", industry: "유통" },
  { name: "호텔신라", symbol: "008770", industry: "유통" },
  { name: "롯데하이마트", symbol: "071840", industry: "유통" },
  { name: "영원무역", symbol: "111770", industry: "섬유·의류" },
  { name: "F&F", symbol: "383220", industry: "섬유·의류" },
  { name: "한섬", symbol: "020000", industry: "섬유·의류" },
  { name: "LF", symbol: "093050", industry: "섬유·의류" },
  { name: "코오롱인더", symbol: "120110", industry: "화학" },
  { name: "휠라홀딩스", symbol: "081660", industry: "섬유·의류" },
  { name: "삼성카드", symbol: "029780", industry: "기타금융" },
  { name: "현대해상", symbol: "001450", industry: "보험" },
  { name: "DB손해보험", symbol: "005830", industry: "보험" },
  { name: "삼성생명", symbol: "032830", industry: "보험" },
  { name: "삼성화재", symbol: "000810", industry: "보험" },
  { name: "메리츠화재", symbol: "000060", industry: "보험" },
  { name: "현대건설기계", symbol: "267270", industry: "기계·장비" },
  { name: "현대두산인프라코어", symbol: "042670", industry: "기계·장비" },
  { name: "현대로템", symbol: "064350", industry: "운송장비·부품" },
  { name: "한국조선해양", symbol: "009540", industry: "조선" },
  { name: "삼성중공업", symbol: "010140", industry: "조선" },
  { name: "현대미포조선", symbol: "010620", industry: "조선" },
  { name: "대우조선해양", symbol: "042660", industry: "조선" },
  { name: "성광벤드", symbol: "014620", industry: "금속" },
  { name: "태광", symbol: "023160", industry: "금속" },
  { name: "포스코인터내셔널", symbol: "047050", industry: "유통" },
  { name: "현대위아", symbol: "011210", industry: "운송장비·부품" },
  { name: "한온시스템", symbol: "018880", industry: "운송장비·부품" },
  { name: "HL만도", symbol: "204320", industry: "운송장비·부품" },
  { name: "에스엘", symbol: "005850", industry: "운송장비·부품" },
  { name: "서연이화", symbol: "200880", industry: "운송장비·부품" },
  { name: "화신", symbol: "010690", industry: "운송장비·부품" },
  { name: "성우하이텍", symbol: "015750", industry: "운송장비·부품" },
  { name: "현대일렉트릭", symbol: "267260", industry: "전기·전자" },
  { name: "LS전선아시아", symbol: "229640", industry: "기타금융" },
  { name: "일진전기", symbol: "103590", industry: "전기·전자" },
  { name: "대한전선", symbol: "001440", industry: "전기·전자" },
  { name: "가온전선", symbol: "000500", industry: "전기·전자" },
  { name: "대덕전자", symbol: "353200", industry: "반도체·전기가전" },
  { name: "심텍", symbol: "222800", industry: "반도체·전기가전" },
  { name: "코리아서키트", symbol: "006810", industry: "반도체·전기가전" },
  { name: "이수페타시스", symbol: "007660", industry: "반도체·전기가전" },
  { name: "삼성전기", symbol: "009150", industry: "전기·전자" },
  { name: "LG이노텍", symbol: "011070", industry: "전기·전자" },
  { name: "LG디스플레이", symbol: "034220", industry: "전기·전자" },
  { name: "OCI", symbol: "010060", industry: "화학" },
  { name: "OCI홀딩스", symbol: "456040", industry: "지주회사" },
  { name: "한화에어로스페이스", symbol: "012450", industry: "운송장비·부품" },
  { name: "KAI", symbol: "047810", industry: "운송장비·부품" },
  { name: "LIG넥스원", symbol: "079550", industry: "금속" },
  { name: "한화시스템", symbol: "272210", industry: "IT 서비스" },
  { name: "현대로템", symbol: "064350", industry: "운송장비·부품" },
  { name: "풍산", symbol: "103140", industry: "금속" },
  { name: "세아베스틸지주", symbol: "001430", industry: "금속" },
  { name: "고려아연", symbol: "010130", industry: "금속" },
  { name: "풍산홀딩스", symbol: "005810", industry: "금속" },
  { name: "동양피스톤", symbol: "092780", industry: "운송장비·부품" },
  { name: "삼기", symbol: "122350", industry: "운송장비·부품" },
  { name: "대성엘텍", symbol: "025440", industry: "운송장비·부품" },
  { name: "엠씨넥스", symbol: "091620", industry: "IT 서비스" },
  { name: "해성디에스", symbol: "195870", industry: "반도체·전기가전" },
  { name: "티엘비", symbol: "353050", industry: "반도체·전기가전" },
  { name: "비에이치", symbol: "090460", industry: "전기·전자" },
  { name: "인터플렉스", symbol: "051370", industry: "전기·전자" },
  { name: "대주전자재료", symbol: "078600", industry: "화학" },
  { name: "천보", symbol: "278280", industry: "화학" },
  { name: "나노신소재", symbol: "121600", industry: "화학" },
  { name: "대성하이텍", symbol: "129920", industry: "기계·장비" },
  { name: "넥스트칩", symbol: "396270", industry: "반도체·전기가전" },
  { name: "가온칩스", symbol: "399720", industry: "반도체·전기가전" },
  { name: "에이디테크놀로지", symbol: "200710", industry: "반도체·전기가전" },
  { name: "코아시아", symbol: "045970", industry: "반도체·전기가전" },
  { name: "칩스앤미디어", symbol: "094360", industry: "IT 서비스" },
  { name: "오픈엣지테크놀로지", symbol: "394280", industry: "IT 서비스" },
  { name: "텔레칩스", symbol: "054450", industry: "반도체·전기가전" },
  { name: "동운아나텍", symbol: "094170", industry: "반도체·전기가전" },
  { name: "픽셀플러스", symbol: "087600", industry: "반도체·전기가전" },
  { name: "라온텍", symbol: "417840", industry: "반도체·전기가전" },
  { name: "기가비스", symbol: "420770", industry: "반도체·전기가전" },
  { name: "티이엠씨", symbol: "425390", industry: "반도체·전기가전" },
  { name: "피에스케이", symbol: "319660", industry: "기계·장비" },
  { name: "유진테크", symbol: "084370", industry: "기계·장비" },
  { name: "원익IPS", symbol: "240810", industry: "기계·장비" },
  { name: "테스", symbol: "095610", industry: "기계·장비" },
  { name: "케이씨텍", symbol: "281820", industry: "기계·장비" },
  { name: "에이피티씨", symbol: "089970", industry: "기계·장비" },
  { name: "넥스틴", symbol: "348210", industry: "기계·장비" },
  { name: "오로스테크놀로지", symbol: "322310", industry: "기계·장비" },
  { name: "파크시스템스", symbol: "140860", industry: "기계·장비" },
  { name: "한미반도체", symbol: "042700", industry: "기계·장비" },
  { name: "인텍플러스", symbol: "064290", industry: "기계·장비" },
  { name: "펨트론", symbol: "168360", industry: "기계·장비" },
  { name: "제이티", symbol: "089790", industry: "기계·장비" },
  { name: "유니테스트", symbol: "086390", industry: "기계·장비" },
  { name: "엑시콘", symbol: "092870", industry: "기계·장비" },
  { name: "네오셈", symbol: "253590", industry: "기계·장비" },
  { name: "와이아이케이", symbol: "232140", industry: "기계·장비" },
  { name: "티에스이", symbol: "131290", industry: "기계·장비" },
  { name: "마이크로컨텍솔", symbol: "098120", industry: "기계·장비" },
  { name: "마이크로투나노", symbol: "424980", industry: "기계·장비" },
  { name: "샘씨엔에스", symbol: "252990", industry: "기계·장비" },
  { name: "월덱스", symbol: "101160", industry: "비금속" },
  { name: "하나머티리얼즈", symbol: "166090", industry: "비금속" },
  { name: "티씨케이", symbol: "064760", industry: "비금속" },
  { name: "케이엔제이", symbol: "272110", industry: "비금속" },
  { name: "원익QnC", symbol: "074600", industry: "비금속" },
  { name: "금양", symbol: "001570", industry: "화학" },
  { name: "에코프로머티", symbol: "450080", industry: "금속" },
  { name: "두산테스나", symbol: "131970", industry: "반도체·전기가전" },
  { name: "네패스", symbol: "033640", industry: "반도체·전기가전" },
  { name: "엘비세미콘", symbol: "061970", industry: "반도체·전기가전" },
  { name: "SFA반도체", symbol: "036540", industry: "반도체·전기가전" },
  { name: "하나금융지주", symbol: "086790", industry: "기타금융" },
  { name: "두산로보틱스", symbol: "454910", industry: "기계·장비" },
  { name: "한진칼", symbol: "180640", industry: "기타금융" },
  { name: "한미사이언스", symbol: "008930", industry: "기타금융" },
  { name: "코스모신소재", symbol: "005070", industry: "화학" },
  { name: "코스모화학", symbol: "005420", industry: "화학" },
  { name: "포스코DX", symbol: "022100", industry: "IT 서비스" },
  { name: "현대제철", symbol: "004020", industry: "금속" },
  { name: "DB하이텍", symbol: "000990", industry: "반도체·전기가전" }
];

// v1.7.5: 스파크라인 SVG 경로 생성 헬퍼 (v2.10.26: 전역 스코프로 이동하여 ReferenceError 해결)
const getSparklinePath = (prices: number[], width: number = 100, height: number = 20, maxPoints?: number) => {
  if (!prices || prices.length < 2) return "M0,10 L100,10";
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  
  // maxPoints가 주어지면 (예: 1D 그래프의 경우 390분), 현재 데이터 수와 무관하게 
  // 시간 흐름에 따라 그래프가 채워지도록 X좌표를 계산함 (v2.10.25)
  const points = prices.map((p, i) => {
    const divisor = maxPoints ? (maxPoints - 1) : (prices.length - 1);
    const x = (i / divisor) * width;
    const y = height - ((p - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  return `M${points.join(" L")}`;
};

// v2.10.26 긴급 복구: 즐겨찾기 소멸 및 렌더링 중단 원인(getSparklinePath 호출 오류) 해결
function SearchResultItem({ 
  stock, onSelect, onGame, onWarp, onCloud, isFavorite, onToggleFavorite, sparklineData = {}, intradayData = {}, small = false
}: { 
  stock: any, onSelect: () => void, onGame: () => void, onWarp: () => void, onCloud: () => void, isFavorite: boolean, onToggleFavorite: (e: any) => void, sparklineData?: any, intradayData?: any, small?: boolean
}) {
  return (
    <div className={`bg-white/5 border border-white/5 rounded-3xl ${small ? "p-3 sm:p-4" : "p-4 sm:p-5"} flex items-center justify-between group transition-all hover:bg-white/10 hover:border-white/10 shadow-lg relative overflow-hidden h-[72px] sm:h-auto`}>
      {/* 종목 기본 정보 (좌측) */}
      <div className="flex flex-col gap-0.5 cursor-pointer flex-1 min-w-0 pr-2 sm:pr-4" onClick={onSelect}>
        <p className={`${small ? "text-[11px]" : "text-[13px]"} font-black text-white leading-tight group-hover:text-rose-400 transition-colors uppercase truncate whitespace-nowrap`}>
          {stock.name}
        </p>
        {!small && stock.symbol && (
          <span className="hidden sm:inline text-[10px] text-gray-500 font-bold opacity-50 uppercase tracking-tighter">
            {stock.symbol}
          </span>
        )}
      </div>

      {/* 액션 및 데이터 영역 (우측 밀착) */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* 기능 아이콘 (v2.10.21) */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <button onClick={onSelect} className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Chart">
            <img src="/icons/v3_chart.png" alt="Chart" className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] object-contain" />
          </button>
          <button onClick={onCloud} className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95" title="Word Cloud">
            <img src="/icons/v17_trigger.png" alt="Cloud" className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] object-contain scale-[1.1]" />
          </button>
          <button onClick={onWarp} className="hidden sm:flex w-[28px] h-[28px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 items-center justify-center transition-all hover:scale-110 active:scale-95" title="Time Warp">
            <img src="/icons/v3_warp.png" alt="Warp" className="w-[14px] h-[14px] object-contain" />
          </button>
        </div>

        {/* 시장 지표 (Sparklines) */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 border-l border-white/5 pl-1.5 sm:pl-4 ml-0.5 sm:ml-0">
          {(() => {
            const p1d = intradayData[stock.symbol] || [];
            const p20d = sparklineData[stock.symbol] || [];
            
            if (p1d.length < 2 || p20d.length < 2) {
              return (
                <div className="flex items-center gap-2 opacity-20">
                  <div className="w-[30px] h-[18px] bg-white/5 rounded-sm" />
                  <div className="w-[35px] h-[18px] bg-white/5 rounded-sm" />
                </div>
              );
            }
            
            const prevClose1d = p20d.length >= 2 ? p20d[p20d.length - 2] : p1d[0];
            const maxVal1d = Math.max(...p1d, prevClose1d);
            const minVal1d = Math.min(...p1d, prevClose1d);
            const range1d = maxVal1d - minVal1d || 1;
            const b1d = ((maxVal1d - prevClose1d) / range1d) * 100;
            const s1d = getSparklinePath(p1d, 100, 20, 390); // 390분 기준 진행형 그래프

            const open20d = p20d[0];
            const maxVal20d = Math.max(...p20d);
            const minVal20d = Math.min(...p20d);
            const range20d = maxVal20d - minVal20d || 1;
            const b20d = ((maxVal20d - open20d) / range20d) * 100;
            const s20d = getSparklinePath(p20d);

            return (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-[6px] text-gray-500 font-bold opacity-30 mb-0.5">1D</span>
                  <svg className="w-[32px] sm:w-[38px] h-[18px] sm:h-[22px]" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <line x1="0" y1={b1d / 5} x2="100" y2={b1d / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.1" />
                    <path d={s1d} fill="none" stroke={Number(p1d[p1d.length-1]) >= prevClose1d ? "#f43f5e" : "#3b82f6"} strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[6px] text-gray-500 font-bold opacity-30 mb-0.5">20D</span>
                  <svg className="w-[38px] sm:w-[45px] h-[18px] sm:h-[22px]" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <line x1="0" y1={b20d / 5} x2="100" y2={b20d / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.1" />
                    <path d={s20d} fill="none" stroke={Number(p20d[p20d.length-1]) >= open20d ? "#f43f5e" : "#3b82f6"} strokeWidth="2" />
                  </svg>
                </div>
              </>
            );
          })()}
        </div>

        {/* 주가 변동률 */}
        {(() => {
          const p1d = intradayData[stock.symbol] || [];
          const p20d = sparklineData[stock.symbol] || [];
          const prevClose1d = p20d.length >= 2 ? p20d[p20d.length - 2] : p1d[0];
          const latest1d = p1d[p1d.length - 1];
          const changeVal = latest1d !== undefined && prevClose1d !== undefined 
            ? ((latest1d - prevClose1d) / prevClose1d * 100).toFixed(2)
            : (stock.change !== undefined ? stock.change : "---");
          const isPos = changeVal === "---" ? true : Number(changeVal) >= 0;

          return (
            <div className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black shrink-0 ${isPos ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"}`}>
              {isPos && changeVal !== "---" ? "+" : ""}{changeVal}%
            </div>
          );
        })()}

        {/* 즐겨찾기 별 */}
        <button 
          onClick={onToggleFavorite}
          className="p-1 sm:p-2 text-gray-600 hover:text-yellow-500 transition-all active:scale-90 shrink-0"
        >
          <Star className={isFavorite ? "fill-yellow-500 text-yellow-500" : ""} size={small ? 14 : 18} />
        </button>
      </div>
    </div>
  );
}

function ProjectApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [view, setView] = useState<"HOME" | "GAME" | "CHART" | "TRIGGER">("HOME");
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [miniSearchStr, setMiniSearchStr] = useState("");
  const [isMiniSearchOpen, setIsMiniSearchOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockData, setStockData] = useState<any[]>([]); // v2.9.10: 초기 데이터를 빈 배열로 설정하여 가상데이터 노출 방지
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  
  // v0.6.0 신규 상태
  const [selectedSearchSymbols, setSelectedSearchSymbols] = useState<string[]>([]);
  const [targetAddGroupId, setTargetAddGroupId] = useState<string>("");
  const [activeFilterGroupId, setActiveFilterGroupId] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [ungroupedStocks, setUngroupedStocks] = useState<Stock[]>([]);
  
  // v2.10.42 전종목 검색 렌더링 무결성 최종 확보 및 버전 동기화 
  useEffect(() => {
    console.log("%c Stock Chart Puzzle %c v2.10.42 ", 
      "background:#f43f5e; color:white; font-weight:bold; padding:4px 8px; border-radius:4px 0 0 4px;",
      "background:#1c2128; color:#9ca3af; font-weight:bold; padding:4px 8px; border-radius:0 4px 4px 0;"
    );
  }, []);

  const [isTimeWarpTriggered, setIsTimeWarpTriggered] = useState(false);
  const [isSearchFullScreen, setIsSearchFullScreen] = useState(false);
  const [initialFlipped, setInitialFlipped] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [newsStockName, setNewsStockName] = useState("");
  const [newsStockSymbol, setNewsStockSymbol] = useState("");

  // v1.1.0 홈 화면 아코디언 상태
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "all": true });
  const [searchExpandedGroups, setSearchExpandedGroups] = useState<Record<string, boolean>>({});
  const [isMarketExpanded, setIsMarketExpanded] = useState(true);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [lastRemovedFavoriteLocation, setLastRemovedFavoriteLocation] = useState<Record<string, string>>({});
  const [searchBaseStocks, setSearchBaseStocks] = useState<Stock[]>([]);
  const [searchGroupSnapshot, setSearchGroupSnapshot] = useState<Record<string, string>>({}); // symbol -> groupId
  const [newGroupInputOpen, setNewGroupInputOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  // v2.7.0: 스파크라인(20D 일봉) 및 당일 분봉(1D) 데이터 캐시 상태 (v2.10.26: 누락 복구)
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const [intradayData, setIntradayData] = useState<Record<string, number[]>>({});
  // v1.6.3: 새 그룹 이름 입력 상태 (v2.10.26: 누락 복구)
  const [newGroupName, setNewGroupName] = useState("");
  // v2.10.28: DB sync 안전화 - 실제 데이터 로드가 완료된 후에만 sync 허용
  const [isFavoritesLoaded, setIsFavoritesLoaded] = useState(false);

  // v1.8.0: 10분 주기 자동 갱신 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 10 * 60 * 1000); // 10분
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = useMemo(() => {
    // [v1.6.7] 검색어가 없을 때는 초기 스냅샷(searchBaseStocks)을 사용하여 리스트 안정성 확보
    if (!searchTerm) {
      return searchBaseStocks;
    }

    const term = searchTerm.toLowerCase().trim();
    const filteredBase = STOCK_LIST.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.symbol.includes(term) ||
      (s.industry && s.industry.toLowerCase().includes(term))
    );

    const uniqueStocks = new Map();
    // 1. 하드코딩 리스트 (기본 종목)
    filteredBase.forEach(s => uniqueStocks.set(s.symbol, s));
    // 2. API 검색 결과 (엘앤에프 등 전종목 - 하드코딩 리스트보다 우선하여 덮어씀)
    apiResults.forEach(s => uniqueStocks.set(s.symbol, s));

    return Array.from(uniqueStocks.values()).slice(0, 40);
  }, [searchTerm, searchBaseStocks, apiResults]);

  // v2.7.0: 미니 차트(스파크라인) 및 당일 분봉 데이터 일괄 로드 (디바운싱 및 의존성 최적화)
  useEffect(() => {
    const fetchSparklines = async () => {
      const allSymbols = [
        ...ungroupedStocks.map(s => s.symbol),
        ...favoriteGroups.flatMap(g => g.stocks.map(s => s.symbol)),
        ...filteredStocks.map(s => s.symbol)
      ].filter((v, i, a) => a.indexOf(v) === i); // 중복 제거

      if (allSymbols.length === 0) return;

      // 20D 데이터는 없는 것만 로드하되, 오전 9시~9시 10분 사이에는 전수 갱신 (v2.10.25)
      const now = new Date();
      const is9AM = now.getHours() === 9 && now.getMinutes() <= 10;
      const missingSymbols = is9AM ? allSymbols : allSymbols.filter(s => !sparklineData[s]);
      
      // 1D 데이터는 10분 주기 갱신 시 전수 재로드, 그 외엔 없는 것만 로드
      // (lastRefresh가 변경되면 fetchSparklines가 다시 실행되므로 logic 유지)
      const targetIntradaySymbols = allSymbols; // 10분 마다 트리거되므로 항상 최신화

      // Batch 20D (Sparklines)
      if (missingSymbols.length > 0) {
        try {
          const res = await fetch(`/api/stock/sparkline/batch?symbols=${missingSymbols.join(",")}&timeframe=day&count=20`);
          if (res.ok) {
            const result = await res.json();
            setSparklineData(prev => ({ ...prev, ...result }));
          }
        } catch (e) {}
      }

      // Batch 1D (Intraday)
      if (targetIntradaySymbols.length > 0) {
        try {
          // 캐시 무력화를 위해 t=Date.now() 추가 및 no-store 보장
          const res = await fetch(`/api/stock/sparkline/batch?symbols=${targetIntradaySymbols.join(",")}&timeframe=minute&count=400&t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const result = await res.json();
            setIntradayData(prev => ({ ...prev, ...result }));
          }
        } catch (e) {}
      }
    };

    // 타율 형 데이터인 경우 실시간 반영을 위해 0ms 딜레이, 검색 엔진인 경우 부하 방지를 위해 300ms 딜레이
    const delay = (searchTerm && searchTerm.length > 0) ? 300 : 0;
    const timeoutId = setTimeout(fetchSparklines, delay);
    return () => clearTimeout(timeoutId);
  }, [ungroupedStocks, favoriteGroups, filteredStocks, searchTerm, lastRefresh]);


  // URL 네비게이션 헬퍼: router.push만 담당하며 setView 등은 아래 useEffect에서 처리
  const navigate = React.useCallback((v: string, s?: string, w: boolean = false, f: boolean = false) => {
    const params = new URLSearchParams();
    params.set("view", v);
    if (s) params.set("s", s);
    params.set("w", w ? "1" : "0");
    params.set("f", f ? "1" : "0"); // v2.10.9: 워드클라우드 상태 연동
    setIsDrawerOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  // URL 파라미터 감지 및 상태 동기화 (navigate의 유일한 처리 지점)
  React.useEffect(() => {
    const v = searchParams.get("view");
    const s = searchParams.get("s");   // navigate에서 "s"로 씀
    const w = searchParams.get("w") === "1";  // navigate에서 "w"로 씀
    const f = searchParams.get("f") === "1";  // v2.10.9: flip 상태 추가

    const targetView = (v && ["HOME", "GAME", "CHART", "TRIGGER"].includes(v)) ? v as "HOME" | "GAME" | "CHART" | "TRIGGER" : "HOME";
    
    setView(targetView);
    setIsTimeWarpTriggered(w);
    setInitialFlipped(f); // 상태 동기화
    
    // [v2.10.9] 홈으로 돌아오면 상태 초기화
    if (!v || v === "HOME") {
      setIsTimeWarpTriggered(false);
      setInitialFlipped(false);
    }

    if (s) {
      const allStocks = [...STOCK_LIST, ...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
      const found = allStocks.find(st => st.symbol === s);
      if (found && (!selectedStock || selectedStock.symbol !== s)) {
        setSelectedStock(found);
        const loadData = async () => {
          try {
            const res = await fetch(`/api/stock/${s}?t=${Date.now()}`);
            if (res.ok) {
              const result = await res.json();
              if (result.data) setStockData(result.data);
            }
          } catch (e) {}
        };
        loadData();
      }
    }
  }, [searchParams]);

  const { data: session, status } = useSession();

  // v2.9.7: DB 연동 및 Vercel 404 안정화 (force-dynamic)
  useEffect(() => {
    const loadFavorites = async () => {
      // 1. 로그인 상태인 경우 DB에서 먼저 가져옴
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/user/sync");
          if (res.ok) {
            const data = await res.json();
            if (data.favoriteGroups.length > 0 || data.ungroupedStocks.length > 0) {
              // DB 그룹이 비어있는 깡통(stocks: [])인지, 실제 종목이 있는지 검사
              const hasStocksInDB = data.ungroupedStocks.length > 0 || data.favoriteGroups.some((g: any) => g.stocks && g.stocks.length > 0);
              
              if (hasStocksInDB) {
                setFavoriteGroups(data.favoriteGroups);
                setUngroupedStocks(data.ungroupedStocks);
                if (data.favoriteGroups.length > 0) setTargetAddGroupId(data.favoriteGroups[0].id);
                setIsFavoritesLoaded(true); // DB 로드 완료 - sync guard 해제
                return; // DB 데이터 로드 성공 시 로컬스토리지 무시
              }
            }
          }
        } catch (e) {
          console.error("DB Load failed:", e);
        }
      }

      // 2. 비로그인이거나 DB 데이터가 없는 경우 로컬스토리지 사용
      const savedGroups = localStorage.getItem("puzzle-favorite-groups");
      const oldFavs = localStorage.getItem("puzzle-favorites");
      const savedUngrouped = localStorage.getItem("puzzle-ungrouped-stocks");

      // localStorage에 데이터가 하나라도 있으면 로드 (v2.10.27: 흐름 버그 수정)
      const hasLocalData = savedGroups || savedUngrouped || oldFavs;

      if (hasLocalData) {
        if (savedUngrouped) {
          setUngroupedStocks(JSON.parse(savedUngrouped));
        }
        if (savedGroups) {
          const parsed = JSON.parse(savedGroups);
          setFavoriteGroups(parsed);
          if (parsed.length > 0) setTargetAddGroupId(parsed[0].id);
        } else if (oldFavs) {
          // 구버전 호환: puzzle-favorites 키를 ungrouped로 마이그레이션
          const parsedOld = JSON.parse(oldFavs);
          const compat = Array.isArray(parsedOld) ? parsedOld : [];
          setUngroupedStocks(compat);
          localStorage.setItem("puzzle-ungrouped-stocks", JSON.stringify(compat));
        }
        setIsFavoritesLoaded(true);
        return; // localStorage 데이터 로드 성공 시 template 로드 불필요
      }

      // v2.9.8: 컴플리트 제3자(신규 비로그인 방문자)인 경우 관리자 템플릿 로드
      try {
        const res = await fetch("/api/market/default-favorites");
        if (res.ok) {
          const data = await res.json();
          if (data.favoriteGroups.length > 0 || data.ungroupedStocks.length > 0) {
            const groupsToSet = data.favoriteGroups.length > 0 ? data.favoriteGroups : [{ id: "default", name: "관리자 추천 그룹", stocks: [] }];
            setFavoriteGroups(groupsToSet);
            if (data.ungroupedStocks) setUngroupedStocks(data.ungroupedStocks);
            setTargetAddGroupId(groupsToSet[0].id);
            setIsFavoritesLoaded(true); // 관리자 템플릿 로드 완료 - sync guard 해제
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load default templates:", e);
      }

      // 모든 것에 실패한 완전 초기 텅 빈 상태
      const initialGroups: FavoriteGroup[] = [{ id: "default", name: "기본 그룹", stocks: [] }];
      setFavoriteGroups(initialGroups);
      setTargetAddGroupId("default");
    };

    if (status !== "loading") {
      loadFavorites();
    }
  }, [status]);

  // v2.8.9: 즐겨찾기 변경 시 DB와 자동 동기화 (데스크톱/모바일 동시 연동)
  // v2.10.28: isFavoritesLoaded guard 추가 - 로딩 완료 전 빈 배열 push로 DB 데이터 소실 방지
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isFavoritesLoaded) return; // 로드 완료 전에는 절대 push하지 않음
    if (favoriteGroups.length === 0 && ungroupedStocks.length === 0) return; // 빈 상태 push 금지
    
    const sync = async () => {
      try {
        await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favoriteGroups, ungroupedStocks })
        });
      } catch (e) {
        console.error("Sync failed:", e);
      }
    };

    const timeoutId = setTimeout(sync, 1000);
    return () => clearTimeout(timeoutId);
  }, [favoriteGroups, ungroupedStocks, status, isFavoritesLoaded]);

  const saveUngrouped = (stocks: Stock[]) => {
    setUngroupedStocks(stocks);
    localStorage.setItem("puzzle-ungrouped-stocks", JSON.stringify(stocks));
  };

  const saveGroups = (groups: FavoriteGroup[]) => {
    setFavoriteGroups(groups);
    localStorage.setItem("puzzle-favorite-groups", JSON.stringify(groups));
  };

  const addGroup = () => {
    const newGroup: FavoriteGroup = {
      id: Date.now().toString(),
      name: "새 그룹",
      stocks: []
    };
    saveGroups([newGroup, ...favoriteGroups]);
  };

  const deleteGroup = (id: string) => {
    if (favoriteGroups.length <= 1) {
      alert("최소 하나의 그룹은 유지되어야 합니다.");
      return;
    }
    const newGroups = favoriteGroups.filter(g => g.id !== id);
    saveGroups(newGroups);
    
    // 삭제한 그룹이 현재 필터링 중이라면 필터 초기화
    if (activeFilterGroupId === id) {
      setActiveFilterGroupId(null);
    }
    
    // 타겟 추가 그룹이 삭제되었다면 첫 번째 그룹으로 변경
    if (targetAddGroupId === id && newGroups.length > 0) {
      setTargetAddGroupId(newGroups[0].id);
    }
  };

  const startEditGroup = (group: FavoriteGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const finishEditGroup = () => {
    if (!editingGroupId) return;
    const newGroups = favoriteGroups.map(g => 
      g.id === editingGroupId ? { ...g, name: editingGroupName || "이름 없는 그룹" } : g
    );
    saveGroups(newGroups);
    setEditingGroupId(null);
  };

  const smartToggleFavorite = (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. 현재 즐겨찾기 상태 확인
    const inUngrouped = ungroupedStocks.find(s => s.symbol === stock.symbol);
    const inGroup = favoriteGroups.find(g => g.stocks.some(s => s.symbol === stock.symbol));
    
    if (inUngrouped || inGroup) {
      // 이미 즐겨찾기임 -> 해제 (Toggle Off)
      const location = inUngrouped ? "ungrouped" : inGroup?.id || "ungrouped";
      setLastRemovedFavoriteLocation(prev => ({ ...prev, [stock.symbol]: location }));
      
      if (inUngrouped) {
        saveUngrouped(ungroupedStocks.filter(s => s.symbol !== stock.symbol));
      } else if (inGroup) {
        saveGroups(favoriteGroups.map(g => g.id === inGroup.id ? { ...g, stocks: g.stocks.filter(s => s.symbol !== stock.symbol) } : g));
      }
    } else {
      // 즐겨찾기 아님 -> 복구 혹은 신규 추가
      const lastLocation = lastRemovedFavoriteLocation[stock.symbol];
      if (lastLocation) {
        // 이전 위치로 복구
        if (lastLocation === "ungrouped") {
          saveUngrouped([...ungroupedStocks, stock]);
        } else {
          saveGroups(favoriteGroups.map(g => g.id === lastLocation ? { ...g, stocks: [...g.stocks, stock] } : g));
        }
      } else {
        // 첫 추가 -> 그룹 드로어 열기
        setSelectedSearchSymbols([stock.symbol]);
        setIsGroupSelectorOpen(true);
      }
    }
  };

  const toggleFavorite = (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation();
    const isExist = ungroupedStocks.find(s => s.symbol === stock.symbol);

    if (isExist) {
      saveUngrouped(ungroupedStocks.filter(s => s.symbol !== stock.symbol));
    } else {
      saveUngrouped([...ungroupedStocks, stock]);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // v0.6.0 일괄 추가 로직
  const handleMultiAdd = () => {
    if (selectedSearchSymbols.length === 0 || !targetAddGroupId) return;
    
    // 현재 필터링된 검색 결과에서 실제 주식 객체 추출
    const stocksToAdd = filteredStocks.filter(s => selectedSearchSymbols.includes(s.symbol));
    
    if (targetAddGroupId === "ungrouped") {
      const existingSymbols = ungroupedStocks.map(s => s.symbol);
      const uniqueNewStocks = stocksToAdd.filter(s => !existingSymbols.includes(s.symbol));
      saveUngrouped([...ungroupedStocks, ...uniqueNewStocks]);
    } else {
      const newGroups = favoriteGroups.map(g => {
        if (g.id === targetAddGroupId) {
          const existingSymbols = g.stocks.map(s => s.symbol);
          const uniqueNewStocks = stocksToAdd.filter(s => !existingSymbols.includes(s.symbol));
          return { ...g, stocks: [...g.stocks, ...uniqueNewStocks] };
        }
        return g;
      });
      saveGroups(newGroups);
    }
    
    setSelectedSearchSymbols([]);
  };

  const toggleSearchSelection = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSearchSymbols(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const deleteFavorite = (symbol: string, groupId: string) => {
    const newGroups = favoriteGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          stocks: g.stocks.filter(s => s.symbol !== symbol)
        };
      }
      return g;
    });
    saveGroups(newGroups);
  };

  const selectStock = async (name: string, symbol: string, mode: "GAME" | "CHART" | "TRIGGER" = "GAME", w = false, f = false) => {
    // API 호출 및 기본적인 상태 변경 수행 후 URL 업데이트
    setIsLoading(true);
    setIsDrawerOpen(false);
    setIsTimeWarpTriggered(w);
    setInitialFlipped(f);

    try {
      const response = await fetch(`/api/stock/${symbol}?t=${Date.now()}`);
      if (!response.ok) throw new Error("API 실패");
      const result = await response.json();
      if (result.data) setStockData(result.data);
    } catch (e) {
      setStockData([]); // v2.10.0: 가상데이터 노출 방지를 위해 에러 시에도 빈 데이터 세팅
    } finally {
      setSelectedStock({ name, symbol });
      setIsLoading(false);
      // URL 업데이트 (useEffect에서 setView 등을 최종 처리)
      navigate(mode, symbol, w, f);
    }
  };

  const flatFavorites = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];

  const handlePrevFavorite = () => {
    if (flatFavorites.length === 0 || !selectedStock) return;
    const currentIndex = flatFavorites.findIndex(f => f.symbol === selectedStock.symbol);
    const prevIndex = (currentIndex - 1 + flatFavorites.length) % flatFavorites.length;
    const prevStock = flatFavorites[prevIndex];
    selectStock(prevStock.name, prevStock.symbol, view === "GAME" ? "GAME" : "CHART");
  };

  const handleNextFavorite = () => {
    if (flatFavorites.length === 0 || !selectedStock) return;
    const currentIndex = flatFavorites.findIndex(f => f.symbol === selectedStock.symbol);
    const nextIndex = (currentIndex + 1) % flatFavorites.length;
    const nextStock = flatFavorites[nextIndex];
    selectStock(nextStock.name, nextStock.symbol, view === "GAME" ? "GAME" : "CHART");
  };

  // [v1.6.7] 검색 전용 베이스 종목 및 그룹 맵핑 스냅샷
  React.useEffect(() => {
    if (isSearchFullScreen && !searchTerm) {
      const currentUngrouped = [...ungroupedStocks];
      const currentGroups = [...favoriteGroups];
      
      const allFavs = Array.from(new Map([
        ...currentUngrouped,
        ...currentGroups.flatMap(g => g.stocks)
      ].map(s => [s.symbol, s])).values());
      
      const newMapping: Record<string, string> = {};
      currentUngrouped.forEach(s => { newMapping[s.symbol] = "ungrouped"; });
      currentGroups.forEach(g => {
        g.stocks.forEach(s => { newMapping[s.symbol] = g.id; });
      });

      setSearchBaseStocks(prev => {
        const merged = Array.from(new Map([...prev, ...allFavs].map(s => [s.symbol, s])).values());
        return merged;
      });
      
      setSearchGroupSnapshot(prev => ({ ...newMapping, ...prev }));
    }
  }, [isSearchFullScreen, searchTerm]); // favoriteGroups 의존성 제거하여 세션 중 위치 고정
  React.useEffect(() => {
    if (searchTerm.length >= 1) {
      const fetchApiSearch = async () => {
        setIsSearchLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
          if (res.ok) {
            const data = await res.json();
            setApiResults(data.results || []);
          }
        } catch (e) {} finally {
          setIsSearchLoading(false);
        }
      };
      
      const timeoutId = setTimeout(fetchApiSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setApiResults([]);
      setIsSearchLoading(false);
    }
  }, [searchTerm]);



  return (
    <>
      <main className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F08080]/5 rounded-full blur-[140px]" />
      
      {view === "HOME" && (
        <label className="sr-only">Home Menu</label>
      )}

      {/* 즐겨찾기 드로어 (Drawer) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[340px] bg-[#161b22] border-r border-white/10 z-[110] p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500 fill-yellow-500" size={20} />
                  <h2 className="text-xl font-black text-white">즐겨찾기</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={addGroup} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-[#F08080] transition-colors" title="그룹 추가">
                    <Plus size={20} />
                  </button>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* 그룹 필터 칩 */}
              <div className="flex flex-wrap gap-2 mb-8 pr-2">
                <button 
                  onClick={() => setActiveFilterGroupId(null)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${!activeFilterGroupId ? 'bg-[#F08080] border-[#F08080] text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  전체보기
                </button>
                {favoriteGroups.map(g => (
                  <button 
                    key={g.id}
                    onClick={() => {
                      setActiveFilterGroupId(g.id);
                      console.log("Filtering by:", g.name, g.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${activeFilterGroupId === g.id ? 'bg-[#F08080] border-[#F08080] text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                    {g.name} <span className="opacity-50 ml-1">({g.stocks.length})</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {/* 미분류 즐겨찾기 섹션 */}
                <div className="space-y-3">
                  <div className="px-1">
                    <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest italic">미분류 (Ungrouped)</h3>
                  </div>
                  <div className="space-y-1.5 ml-1">
                    {ungroupedStocks.length > 0 ? (
                      ungroupedStocks.map((fav) => (
                        <div key={`ungrouped-${fav.symbol}`} className="group relative flex items-center bg-white/10 hover:bg-white/20 border border-rose-500/20 rounded-2xl transition-all overflow-hidden shadow-lg shadow-rose-500/5">
                          <button 
                            onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                            className="flex-1 py-3 px-4 text-left"
                          >
                            <p className="font-bold text-slate-200 text-sm leading-tight mb-0.5 group-hover:text-rose-400 transition-colors">{fav.name}</p>
                            <p className="text-[10px] text-rose-400/60 font-black tracking-tight uppercase">Fast Access</p>
                          </button>
                          <button 
                            onClick={() => saveUngrouped(ungroupedStocks.filter(s => s.symbol !== fav.symbol))}
                            className="p-4 text-slate-500 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/10 italic">
                        <p className="text-[9px]">직접 추가한 종목이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {favoriteGroups
                  .map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between px-1 group/header">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input 
                            value={editingGroupName} 
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && finishEditGroup()}
                            className="h-8 bg-black/40 border-white/20 text-xs text-white"
                            autoFocus
                          />
                          <button onClick={finishEditGroup} className="text-emerald-400"><Check size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{group.name}</h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                            <button onClick={() => startEditGroup(group)} className="p-1 text-white/20 hover:text-white"><Edit3 size={12} /></button>
                            <button onClick={() => deleteGroup(group.id)} className="p-1 text-white/20 hover:text-rose-400"><Trash2 size={12} /></button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1.5 ml-1">
                      {group.stocks.length > 0 ? (
                        group.stocks.map((fav) => (
                          <div key={`${group.id}-${fav.symbol}`} className="group relative flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all overflow-hidden">
                            <button 
                              onClick={() => selectStock(fav.name, fav.symbol, "CHART")}
                              className="flex-1 py-3 px-4 text-left"
                            >
                              <p className="font-bold text-slate-200 text-sm leading-tight mb-0.5">{fav.name}</p>
                              <p className="text-[10px] text-white/30 font-medium tracking-tight">시장 데이터 분석 완료</p>
                            </button>
                            <button 
                              onClick={() => {
                                console.log(`Deleting ${fav.symbol} from group ${group.id}`);
                                deleteFavorite(fav.symbol, group.id);
                              }}
                              className="p-4 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/10">
                          <p className="text-[10px]">이 그룹에 종목이 없습니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {favoriteGroups.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                    <Star size={32} className="mb-4 opacity-10" />
                    <p className="text-sm">등록된 즐겨찾기가 없습니다.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-tighter">VIBE CODING • CHART PUZZLE v2.10.31</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* 1. 홈 화면 (Persistent Rendering): 히트맵 및 위젯의 상시 마운트를 유지하여 화면 전환 시 버벅임과 재로딩 완전 박멸 */}
      <div className={view === "HOME" ? "z-10 w-full flex flex-col items-center h-full overflow-hidden" : "hidden h-0"}>
        <motion.div 
          animate={{ opacity: view === "HOME" ? 1 : 0 }} 
          transition={{ duration: 0.4 }} 
          className="w-full max-w-lg flex flex-col items-center px-4 pt-4 pb-32 overflow-y-auto no-scrollbar h-full"
        >
            
            {/* 1. 상단 검색바 섹션 */}
            <div className="w-full mb-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    placeholder="Search for news or tickers..." 
                    value={searchTerm}
                    onFocus={() => setIsSearchFullScreen(true)}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedSearchSymbols([]);
                    }}
                    className="w-full h-12 bg-[#1c2128] border-transparent rounded-2xl pl-12 text-sm focus-visible:ring-0 placeholder:text-gray-500"
                  />
                </div>
                {/* 2.8.8: Google 로그인/로그아웃 버튼 */}
                <button 
                  onClick={() => session ? signOut() : signIn("google")}
                  className="w-12 h-12 bg-[#1c2128] border-transparent rounded-2xl flex items-center justify-center hover:bg-[#2d333b] transition-all relative group/user"
                  title={session ? "로그아웃" : "구글 로그인"}
                >
                  {session?.user?.image ? (
                    <div className="relative">
                      <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#1c2128] rounded-full" />
                    </div>
                  ) : (
                    <LogIn size={20} className="text-gray-400 group-hover/user:text-[#F08080] transition-colors" />
                  )}
                </button>
              </div>

              {/* 검색 결과 오버레이 */}
              <AnimatePresence>
                {isSearchFullScreen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="fixed inset-0 bg-[#0d1117] z-1000 flex flex-col p-6 overflow-hidden"
                  >
                    {/* 상단 검색 컨트롤 헤더 */}
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => {
                          setIsSearchFullScreen(false);
                          setSearchTerm("");
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                          autoFocus
                          placeholder="어떤 종목을 찾으시나요?" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-14 bg-white/5 border-white/10 rounded-3xl pl-14 text-lg font-bold text-white focus-visible:ring-0 placeholder:text-gray-600 shadow-2xl"
                        />
                        {isSearchLoading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-rose-500" size={20} />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* 그룹화된 검색 결과 리스트 */}
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20">
                      {filteredStocks.length > 0 ? (
                        <>
                          {/* 1. 검색 결과 리스트 (v2.10.39: 장벽 없이 전체 노출) */}
                          <div className="space-y-3">
                            <div className="px-1 mb-2">
                              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] italic">검색 결과</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10">
                              {filteredStocks.map((stock) => (
                                <SearchResultItem 
                                  key={stock.symbol} 
                                  stock={stock} 
                                  isFavorite={ungroupedStocks.some(f => f.symbol === stock.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === stock.symbol))}
                                  onSelect={() => selectStock(stock.name, stock.symbol, "CHART", false, false)}
                                  onGame={() => selectStock(stock.name, stock.symbol, "GAME", false, false)}
                                  onWarp={() => selectStock(stock.name, stock.symbol, "CHART", true, false)}
                                  onCloud={() => selectStock(stock.name, stock.symbol, "CHART", false, true)}
                                  onToggleFavorite={(e) => smartToggleFavorite(stock, e)}
                                  sparklineData={sparklineData}
                                  intradayData={intradayData}
                                />
                              ))}
                            </div>
                          </div>

                          {/* 2. 기존 그룹별 매핑이 필요한 경우에 대비한 공간 (필요 시 확장) */}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

            {/* 2. 시장 정보 히트맵 섹션 (아코디언 적용 및 1행 3열 레이아웃) */}
            <div className="w-full mb-10 px-1">
              <button 
                onClick={() => setIsMarketExpanded(!isMarketExpanded)}
                className="w-full flex items-center justify-between group mb-4"
              >
                <div className="flex items-center gap-2 text-[10px] font-black text-[#F08080] uppercase tracking-widest pl-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  MARKET OVERVIEW (KST)
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-500 transition-transform duration-300 ${isMarketExpanded ? "rotate-0" : "-rotate-90"}`} 
                />
              </button>

              {isMarketExpanded && (
                <div className="grid grid-cols-1 gap-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {[
                    { name: "S&P 500", type: "SPX500", mode: "widget" },
                    { name: "KOSPI", type: "KOSPI", mode: "custom" },
                    { name: "KOSDAQ", type: "KOSDAQ", mode: "custom" }
                  ].map((index, idx) => (
                    <div key={idx} className="bg-[#1c2128] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col h-[240px]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-black text-gray-400 tracking-wider uppercase">{index.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[9px] text-gray-500 font-bold">LIVE</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative">
                        {index.mode === "widget" ? (
                          <TradingViewHeatmapWidget dataSource={index.type} />
                        ) : (
                          <LiveMarketHeatmap type={index.type} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 즐겨찾기 아코디언 섹션 */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">PORTFOLIOS & WATCHLISTS</h3>
                <button title="Options" className="p-1 text-gray-600 hover:text-white"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
              </div>

              {/* 전체보기 아코디언 */}
              <div className="bg-[#1c2128] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <button 
                  onClick={() => toggleAccordion("all")}
                  className="w-full px-5 py-4 flex items-center justify-between group"
                >
                  <span className="text-sm font-black text-white">My List (전체)</span>
                  <div className={`p-1.5 bg-white/5 rounded-full transition-transform duration-300 ${expandedGroups["all"] ? "rotate-180" : ""}`}>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
                  </div>
                </button>
                <AnimatePresence>
                  {expandedGroups["all"] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-2 sm:px-5 pb-4 space-y-1 border-t border-white/5">
                        {ungroupedStocks.length > 0 ? ungroupedStocks.map((fav) => (
                          <div key={fav.symbol} className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/5 -mx-2 sm:-mx-5 px-2 sm:px-5 transition-colors group/item relative h-[72px]">
                             {/* 종목명 영역: flex-1 + min-w-0 으로 공간 확보 후 truncate */}
                             <div className="flex flex-col cursor-pointer flex-1 min-w-0 pr-2" onClick={() => selectStock(fav.name, fav.symbol, "CHART", false, false)}>
                               <p className="text-[11px] font-black text-slate-100 leading-tight group-hover/item:text-rose-400 transition-colors uppercase truncate whitespace-nowrap">
                                 {fav.name}
                               </p>
                               <span className="hidden sm:inline text-[9px] text-gray-500 font-bold opacity-40 uppercase tracking-tighter">
                                 {fav.symbol}
                               </span>
                             </div>

                             {/* 우측 아이콘 및 정보 영역: shrink-0 으로 고정 크기 유지 */}
                             <div className="flex items-center gap-1.5 sm:gap-6 shrink-0">
                                {/* 4종 숏컷 아이콘 - 모바일 최적화 (v2.10.12) */}
                                <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "CHART", false, false)}
                                    className="w-[26px] h-[26px] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Chart"
                                  >
                                    <img src="/icons/v3_chart.png" alt="Chart" className="w-full h-full object-contain p-1" />
                                  </button>
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "GAME", false, false)}
                                    className="hidden sm:block w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Puzzle"
                                  >
                                    <img src="/icons/v3_puzzle.png" alt="Puzzle" className="w-full h-full object-contain p-1.5" />
                                  </button>
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "CHART", true, false)}
                                    className="hidden sm:block w-8 h-8 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Time Warp"
                                  >
                                    <img src="/icons/v3_warp.png" alt="Warp" className="w-full h-full object-contain p-1.5" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectStock(fav.name, fav.symbol, "CHART", false, true);
                                    }}
                                    className="w-[26px] h-[26px] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Word Cloud"
                                  >
                                    <img src="/icons/v17_trigger.png" alt="Cloud" className="w-full h-full object-contain p-1 scale-[1.1]" />
                                  </button>
                                </div>

                              <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                                <div className="flex items-center gap-1 sm:gap-4 group-hover/item:opacity-100 transition-opacity">
                                  {/* 차트 영역 (1D, 20D) */}
                                  <div className="flex flex-row items-center gap-1 sm:gap-3">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[6px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">1D</span>
                                      {(() => {
                                        const prices = intradayData[fav.symbol] || [];
                                        const dailyPrices = sparklineData[fav.symbol] || [];
                                        if (prices.length < 2) return <div className="w-[45px] h-[26px] bg-white/5 rounded-lg animate-pulse" />;
                                        
                                        const prevClose = dailyPrices.length >= 2 ? dailyPrices[dailyPrices.length - 2] : prices[0];
                                        const min = Math.min(...prices, prevClose);
                                        const max = Math.max(...prices, prevClose);
                                        const range = max - min || 1;
                                        const baseline = ((max - prevClose) / range) * 100;
                                        const gradId = `grad-1d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                        const strokePath = getSparklinePath(prices, 100, 20, 390); // 390분 기준 진행형 그래프
                                        
                                        return (
                                          <svg className="w-[45px] h-[26px]" viewBox="0 0 100 20" preserveAspectRatio="none">
                                            <defs>
                                              <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset={`${baseline}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                <stop offset={`${baseline}%`} stopColor="#3b82f6" stopOpacity="1" />
                                              </linearGradient>
                                            </defs>
                                            <line x1="0" y1={baseline / 5} x2="100" y2={baseline / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.3" />
                                            <path d={strokePath} fill="none" stroke={`url(#${gradId})`} strokeWidth="1.5" />
                                          </svg>
                                        );
                                      })()}
                                    </div>
                                    
                                    <div className="flex flex-col items-center border-l border-white/10 pl-3">
                                      <span className="text-[6px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">20D</span>
                                      {(() => {
                                        const prices = sparklineData[fav.symbol] || [];
                                        if (prices.length < 2) return <div className="w-[45px] h-[26px] bg-white/5 rounded-lg animate-pulse" />;
                                        const open20 = prices[0];
                                        const min20 = Math.min(...prices);
                                        const max20 = Math.max(...prices);
                                        const range20 = max20 - min20 || 1;
                                        const baseline20 = ((max20 - open20) / range20) * 100;
                                        const gradId20 = `grad-20d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                        const strokePath20 = getSparklinePath(prices);
                                        
                                        return (
                                          <svg className="w-[45px] h-[26px]" viewBox="0 0 100 20" preserveAspectRatio="none">
                                            <defs>
                                              <linearGradient id={gradId20} x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset={`${baseline20}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                <stop offset={`${baseline20}%`} stopColor="#3b82f6" stopOpacity="1" />
                                              </linearGradient>
                                            </defs>
                                            <line x1="0" y1={baseline20 / 5} x2="100" y2={baseline20 / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.2" />
                                            <path d={strokePath20} fill="none" stroke={`url(#${gradId20})`} strokeWidth="1.5" />
                                          </svg>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end flex-shrink-0">
                                  {(() => {
                                    const prices = sparklineData[fav.symbol] || [];
                                    const latest = prices[prices.length - 1];
                                    const prev = prices[prices.length - 2];
                                    const change = prev ? ((latest - prev) / prev * 100).toFixed(2) : (fav.change || 0);
                                    const isUp = Number(change) >= 0;
                                    return (
                                      <div className={`${isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"} text-[10px] font-black px-1 py-0.5 rounded-md whitespace-nowrap`}>
                                        {isUp ? "+" : ""}{change}%
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="py-6 text-center text-[11px] text-gray-600 italic">추가된 종목이 없습니다.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 그룹별 아코디언 */}
              {favoriteGroups.map(group => (
                <div key={group.id} className="bg-[#1c2128] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <button 
                    onClick={() => toggleAccordion(group.id)}
                    className="w-full px-5 py-4 flex items-center justify-between group"
                  >
                    <span className="text-sm font-black text-white">{group.name}</span>
                    <div className={`p-1.5 bg-white/5 rounded-full transition-transform duration-300 ${expandedGroups[group.id] ? "rotate-180" : ""}`}>
                      <ChevronDown size={14} className="text-gray-400 group-hover:text-white" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedGroups[group.id] && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-2 sm:px-5 pb-4 space-y-1 border-t border-white/5">
                          {group.stocks.length > 0 ? group.stocks.map((fav) => (
                            <div key={fav.symbol} className="flex items-center justify-between py-4 border-b border-white/5 hover:bg-white/5 -mx-2 sm:-mx-5 px-2 sm:px-5 transition-colors group/item relative h-[72px]">
                              {/* 종목명 영역: flex-1 + min-w-0 으로 공간 확보 후 truncate */}
                              <div className="flex flex-col cursor-pointer flex-1 min-w-0 pr-2" onClick={() => selectStock(fav.name, fav.symbol, "CHART", false, false)}>
                                <p className="text-[11px] font-black text-slate-100 leading-tight group-hover/item:text-rose-400 transition-colors uppercase truncate whitespace-nowrap">
                                  {fav.name}
                                </p>
                                <span className="hidden sm:inline text-[9px] text-gray-500 font-bold opacity-40 uppercase tracking-tighter">
                                  {fav.symbol}
                                </span>
                              </div>

                              {/* 우측 아이콘 및 정보 영역: shrink-0 으로 고정 크기 유지 */}
                              <div className="flex items-center gap-1.5 sm:gap-6 shrink-0">
                                {/* 4종 숏컷 아이콘 - 모바일 최적화 (v2.10.12) */}
                                <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "CHART", false, false)}
                                    className="w-[24px] h-[24px] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Chart"
                                  >
                                    <img src="/icons/v3_chart.png" alt="Chart" className="w-full h-full object-contain p-[3px]" />
                                  </button>
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "GAME", false, false)}
                                    className="hidden sm:block w-7 h-7 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Puzzle"
                                  >
                                    <img src="/icons/v3_puzzle.png" alt="Puzzle" className="w-full h-full object-contain p-1" />
                                  </button>
                                  <button 
                                    onClick={() => selectStock(fav.name, fav.symbol, "CHART", true, false)}
                                    className="hidden sm:block w-7 h-7 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Time Warp"
                                  >
                                    <img src="/icons/v3_warp.png" alt="Warp" className="w-full h-full object-contain p-1" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectStock(fav.name, fav.symbol, "CHART", false, true);
                                    }}
                                    className="w-[24px] h-[24px] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/5"
                                    title="Word Cloud"
                                  >
                                    <img src="/icons/v17_trigger.png" alt="Cloud" className="w-full h-full object-contain p-[2px] scale-[1.1]" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                                  <div className="flex items-center gap-1 sm:gap-4 group-hover/item:opacity-100 transition-opacity">
                                    {/* 차트 영역 (1D, 20D) */}
                                    <div className="flex flex-row items-center gap-1 sm:gap-3">
                                      <div className="flex flex-col items-center">
                                        <span className="text-[6px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">1D</span>
                                        {(() => {
                                          const prices = intradayData[fav.symbol] || [];
                                          const dailyPrices = sparklineData[fav.symbol] || [];
                                          if (prices.length < 2) return <div className="w-[45px] h-[26px] bg-white/5 rounded-lg animate-pulse" />;
                                          const prevClose = dailyPrices.length >= 2 ? dailyPrices[dailyPrices.length - 2] : prices[0];
                                          const min = Math.min(...prices, prevClose);
                                          const max = Math.max(...prices, prevClose);
                                          const range = max - min || 1;
                                          const baseline = ((max - prevClose) / range) * 100;
                                          const gradId = `grad-group-1d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                          const strokePath = getSparklinePath(prices);
                                          
                                          return (
                                            <svg className="w-[45px] h-[26px]" viewBox="0 0 100 20" preserveAspectRatio="none">
                                              <defs>
                                                <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                                                  <stop offset={`${baseline}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                  <stop offset={`${baseline}%`} stopColor="#3b82f6" stopOpacity="1" />
                                                </linearGradient>
                                              </defs>
                                              <line x1="0" y1={baseline / 5} x2="100" y2={baseline / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.3" />
                                              <path d={getSparklinePath(prices, 100, 20, 390)} fill="none" stroke={`url(#${gradId})`} strokeWidth="1.5" />
                                            </svg>
                                          );
                                        })()}
                                      </div>
                                      <div className="flex flex-col items-center border-l border-white/10 pl-3">
                                        <span className="text-[6px] text-gray-500 font-black opacity-30 uppercase mb-0.5 tracking-tight">20D</span>
                                        {(() => {
                                          const prices = sparklineData[fav.symbol] || [];
                                          if (prices.length < 2) return <div className="w-[45px] h-[26px] bg-white/5 rounded-lg animate-pulse" />;
                                          const open20 = prices[0];
                                          const min20 = Math.min(...prices);
                                          const max20 = Math.max(...prices);
                                          const range20 = max20 - min20 || 1;
                                          const baseline20 = ((max20 - open20) / range20) * 100;
                                          const gradId20 = `grad-group-20d-${fav.symbol}-${Math.random().toString(36).substr(2, 4)}`;
                                          const strokePath20 = getSparklinePath(prices);
                                          
                                          return (
                                            <svg className="w-[45px] h-[26px]" viewBox="0 0 100 20" preserveAspectRatio="none">
                                              <defs>
                                                <linearGradient id={gradId20} x1="0%" y1="0%" x2="0%" y2="100%">
                                                  <stop offset={`${baseline20}%`} stopColor="#f43f5e" stopOpacity="1" />
                                                  <stop offset={`${baseline20}%`} stopColor="#3b82f6" stopOpacity="1" />
                                                </linearGradient>
                                              </defs>
                                              <line x1="0" y1={baseline20 / 5} x2="100" y2={baseline20 / 5} stroke="white" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.2" />
                                              <path d={strokePath20} fill="none" stroke={`url(#${gradId20})`} strokeWidth="1.5" />
                                            </svg>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end flex-shrink-0">
                                    {(() => {
                                      const prices = sparklineData[fav.symbol] || [];
                                      const latest = prices[prices.length - 1];
                                      const prev = prices[prices.length - 2];
                                      const change = prev ? ((latest - prev) / prev * 100).toFixed(2) : (fav.change || 0);
                                      const isUp = Number(change) >= 0;
                                      return (
                                        <div className={`${isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"} text-[10px] font-black px-1 py-0.5 rounded-md whitespace-nowrap`}>
                                          {isUp ? "+" : ""}{change}%
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="py-6 text-center text-[11px] text-gray-600 italic">그룹에 등록된 종목이 없습니다.</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

        </motion.div>
      </div>
      
      {/* 2. 기타 기능 화면 (Conditional Rendering): 전환 애니메이션 무결성 유지 */}
      <AnimatePresence mode="wait">
        {view === "GAME" ? (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-5xl flex flex-col items-center">
            {/* Global Search Header for Game View */}
            <div className="w-full mb-6 sticky top-0 z-[6000] px-1 group">
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/50 to-blue-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                 <div className="relative flex items-center bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <div className="pl-4 pr-2 text-emerald-400 opacity-60">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="분석할 종목을 입력하세요"
                      value={miniSearchStr}
                      onChange={(e) => {
                        setMiniSearchStr(e.target.value);
                        setSearchTerm(e.target.value); // Sync with global filter logic
                      }}
                      onFocus={() => setIsMiniSearchOpen(true)}
                      className="bg-transparent border-none focus:ring-0 text-white text-sm w-full py-3 font-bold placeholder:text-gray-500 tracking-tight"
                    />
                    {miniSearchStr && (
                      <button onClick={() => setMiniSearchStr("")} className="px-3 text-gray-500 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    )}
                 </div>
                 
                 {/* Mini Search Dropdown */}
                 {isMiniSearchOpen && miniSearchStr && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-3xl max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-3xl z-[7000]">
                      <div className="p-3 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">SEARCH RESULTS</span>
                      </div>
                      {filteredStocks.length > 0 ? (
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          {filteredStocks.slice(0, 8).map((s) => (
                            <SearchResultItem 
                              key={s.symbol}
                              stock={s}
                              isFavorite={ungroupedStocks.some(f => f.symbol === s.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === s.symbol))}
                              onSelect={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "GAME", false, false); }}
                              onGame={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "GAME", false, false); }}
                              onWarp={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", true, false); }}
                              onCloud={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", false, true); }}
                              onToggleFavorite={(e) => smartToggleFavorite(s, e)}
                              sparklineData={sparklineData}
                              intradayData={intradayData}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-gray-600 italic text-sm">결과가 없습니다</div>
                      )}
                    </div>
                 )}
               </div>
            </div>

            <div className="w-full bg-[#0d1117]/60 border border-white/10 rounded-[3rem] p-4 sm:p-8 backdrop-blur-3xl relative pb-24 shadow-3xl min-h-[400px] sm:min-h-[75vh]">
              <div className="absolute top-6 left-6 z-[1000]">
                <button 
                  onClick={() => navigate("HOME")}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 flex items-center gap-2 border border-white/5 shadow-xl"
                >
                  <ChevronLeft size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">EXIT</span>
                </button>
              </div>
              <div className="pt-8">
                <PuzzleGame 
                  stockData={stockData} 
                  gridSize={2} 
                  stockName={selectedStock?.name} 
                  stockSymbol={selectedStock?.symbol} 
                  key={`${puzzleKey}-${selectedStock?.symbol}`}
                  initialFlipped={initialFlipped}
                  isSearchFullScreen={isSearchFullScreen}
                  onBackToSearch={() => setView("HOME")}
                />
              </div>
            </div>
          </motion.div>
        ) : view === "TRIGGER" ? (
          <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-5xl flex flex-col items-center">
            {/* Global Search Header for Trigger View */}
            <div className="w-full mb-6 sticky top-0 z-[6000] px-1 group">
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-indigo-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                 <div className="relative flex items-center bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <div className="pl-4 pr-2 text-blue-400 opacity-60">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="트리거 클라우드 검색"
                      value={miniSearchStr}
                      onChange={(e) => {
                        setMiniSearchStr(e.target.value);
                        setSearchTerm(e.target.value); // Sync with global filter logic
                      }}
                      onFocus={() => setIsMiniSearchOpen(true)}
                      className="bg-transparent border-none focus:ring-0 text-white text-sm w-full py-3 font-bold placeholder:text-gray-500 tracking-tight"
                    />
                 </div>
                 {isMiniSearchOpen && miniSearchStr && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d1117] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl max-h-[70vh] overflow-y-auto backdrop-blur-3xl z-[7000] animate-in fade-in slide-in-from-top-4 duration-300">
                       <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center px-6">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TRIGGER SEARCH</span>
                         <X size={14} className="text-gray-500 cursor-pointer" onClick={() => setIsMiniSearchOpen(false)} />
                       </div>
                       {filteredStocks.length > 0 ? (
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          {filteredStocks.slice(0, 8).map((s) => (
                            <SearchResultItem 
                              key={s.symbol}
                              stock={s}
                              isFavorite={ungroupedStocks.some(f => f.symbol === s.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === s.symbol))}
                              onSelect={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "TRIGGER", false, false); }}
                              onGame={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "GAME", false, false); }}
                              onWarp={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", true, false); }}
                              onCloud={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", false, true); }}
                              onToggleFavorite={(e) => smartToggleFavorite(s, e)}
                              sparklineData={sparklineData}
                              intradayData={intradayData}
                            />
                          ))}
                        </div>
                       ) : (
                        <div className="py-10 text-center text-gray-600 italic">결과가 없습니다</div>
                       )}
                    </div>
                 )}
               </div>
            </div>

            <div className="w-full bg-[#0d1117]/60 border border-white/10 rounded-[3rem] p-4 sm:p-8 backdrop-blur-3xl relative pb-24 shadow-3xl min-h-[400px] sm:min-h-[75vh]">
              <div className="absolute top-6 left-6 z-[1000]">
                <button onClick={() => navigate("HOME")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl">
                  <ChevronLeft size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">EXIT</span>
                </button>
              </div>
              <div className="pt-16">
                <TriggerAnalysis />
              </div>
            </div>
          </motion.div>
        ) : view === "CHART" ? (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 w-full max-w-5xl flex flex-col items-center">
            {/* Global Search Header for Chart View */}
            <div className="w-full mb-6 sticky top-0 z-[6000] px-1 group">
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/50 to-orange-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                 <div className="relative flex items-center bg-[#0d1117]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                    <div className="pl-4 pr-2 text-rose-400 opacity-60">
                      <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="종목 실시간 차트 검색"
                      value={miniSearchStr}
                      onChange={(e) => {
                        setMiniSearchStr(e.target.value);
                        setSearchTerm(e.target.value); // Sync with global filter logic
                      }}
                      onFocus={() => setIsMiniSearchOpen(true)}
                      className="bg-transparent border-none focus:ring-0 text-white text-sm w-full py-3 font-bold placeholder:text-gray-500 tracking-tight"
                    />
                 </div>
                 {isMiniSearchOpen && miniSearchStr && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d1117] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl max-h-[70vh] overflow-y-auto backdrop-blur-3xl z-[7000] animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center px-6">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CHART SEARCH</span>
                         <X size={14} className="text-gray-500 cursor-pointer" onClick={() => setIsMiniSearchOpen(false)} />
                       </div>
                       {filteredStocks.length > 0 ? (
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          {filteredStocks.slice(0, 8).map((s) => (
                            <SearchResultItem 
                              key={s.symbol}
                              stock={s}
                              isFavorite={ungroupedStocks.some(f => f.symbol === s.symbol) || favoriteGroups.some(g => g.stocks.some(gs => gs.symbol === s.symbol))}
                              onSelect={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", isTimeWarpTriggered, false); }}
                              onGame={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "GAME", false, false); }}
                              onWarp={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", true, false); }}
                              onCloud={() => { setMiniSearchStr(""); setIsMiniSearchOpen(false); selectStock(s.name, s.symbol, "CHART", false, true); }}
                              onToggleFavorite={(e) => smartToggleFavorite(s, e)}
                              sparklineData={sparklineData}
                              intradayData={intradayData}
                            />
                          ))}
                        </div>
                       ) : (
                        <div className="py-10 text-center text-gray-600 italic">결과가 없습니다</div>
                       )}
                    </div>
                 )}
               </div>
            </div>

            <div className="w-full min-h-[400px] sm:min-h-[75vh] h-auto bg-[#0d1117]/60 border border-white/10 rounded-[3rem] p-4 sm:p-8 backdrop-blur-3xl relative pb-24 shadow-3xl">
              <div className="absolute top-6 left-6 z-[1000]">
                <button onClick={() => navigate("HOME")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl">
                  <ChevronLeft size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">EXIT</span>
                </button>
              </div>
              <div className="pt-8">
                <PuzzleGame 
                  stockData={stockData} 
                  isOnlyChart={true} 
                  stockName={selectedStock?.name} 
                  stockSymbol={selectedStock?.symbol} 
                  isTimeWarpTriggered={isTimeWarpTriggered}
                  onPrevFavorite={handlePrevFavorite}
                  onNextFavorite={handleNextFavorite}
                  hasMultipleFavorites={flatFavorites.length > 1}
                  initialFlipped={initialFlipped}
                  key={`${puzzleKey}-${selectedStock?.symbol}`}
                  isSearchFullScreen={isSearchFullScreen}
                  onBackToSearch={() => setView("HOME")}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>


      <footer className="mt-48 py-20 text-[10px] text-white/20 tracking-widest font-mono uppercase z-10 text-center w-full pb-32">VIBE CODING • CHART PUZZLE v2.10.26</footer>

      {/* 범용 하단 탭바 (Bottom Tab Bar) */}
      <div className="fixed bottom-0 inset-x-0 z-[5000] px-4 pb-6 pointer-events-none">
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          className="max-w-md mx-auto bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-around shadow-3xl pointer-events-auto"
        >
          {/* 홈으로 */}
          <button 
            onClick={() => navigate("HOME")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "HOME" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v11_home.png" alt="HOME" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* 차트보기 */}
          <button 
            onClick={() => {
              if (!selectedStock) {
                const flatFavs = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
                if (flatFavs.length > 0) {
                  selectStock(flatFavs[0].name, flatFavs[0].symbol, "CHART", false, false);
                  return;
                }
                alert("분석할 종목을 선택하거나 즐겨찾기를 추가해 주세요!");
                return;
              }
              navigate("CHART", selectedStock.symbol, false, false);
              setIsTimeWarpTriggered(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "CHART" && !isTimeWarpTriggered ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_chart.png" alt="CHART" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* 차트퍼즐 */}
          <button 
            onClick={() => {
              if (view === "GAME") {
                setPuzzleKey(prev => prev + 1);
              }
              if (!selectedStock) {
                const flatFavs = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
                if (flatFavs.length > 0) {
                  selectStock(flatFavs[0].name, flatFavs[0].symbol, "GAME", false, false);
                  return;
                }
                alert("퍼즐을 진행할 종목을 선택하거나 즐겨찾기를 추가해 주세요!");
                return;
              }
              navigate("GAME", selectedStock.symbol, false, false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "GAME" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_puzzle.png" alt="PUZZLE" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* 타임워프 */}
          <button 
            onClick={() => {
              if (!selectedStock) {
                const flatFavs = [...ungroupedStocks, ...favoriteGroups.flatMap(g => g.stocks)];
                if (flatFavs.length > 0) {
                  selectStock(flatFavs[0].name, flatFavs[0].symbol, "CHART", true, false);
                  return;
                }
                alert("타임워프를 실행할 종목을 선택하거나 즐겨찾기를 추가해 주세요!");
                return;
              }
              navigate("CHART", selectedStock.symbol, true, false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isTimeWarpTriggered ? "bg-white/15 ring-1 ring-white/20 shadow-lg shadow-rose-500/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_warp.png" alt="WARP" className="w-full h-full object-contain" />
            </div>
          </button>

          {/* 트리거 */}
          <button 
            onClick={() => navigate("TRIGGER")}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${view === "TRIGGER" ? "bg-white/15 ring-1 ring-white/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
          >
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
              <img src="/icons/v3_trigger.png" alt="TRIGGER" className="w-full h-full object-contain" />
            </div>
          </button>
        </motion.div>
      </div>
    </main>

    {/* 프리미엄 그룹 선택 바텀 시트 */}
    <AnimatePresence>
      {isGroupSelectorOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsGroupSelectorOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000]"
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 inset-x-0 bg-[#1c2128] border-t border-white/10 rounded-t-[2.5rem] z-[5001] p-8 pb-12 shadow-2xl overflow-hidden max-w-lg mx-auto"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 opacity-50" />
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white tracking-tight">Select lists</h2>
              <button 
                onClick={() => setIsGroupSelectorOpen(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-8 overflow-y-auto max-h-[300px] no-scrollbar">
              {/* v1.6.3: 미분류 저장 옵션 추가 */}
              <button 
                onClick={() => setTargetAddGroupId("ungrouped")}
                className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all border ${targetAddGroupId === "ungrouped" ? 'bg-[#F08080]/10 border-[#F08080] text-[#F08080]' : 'bg-white/5 border-white/5 text-gray-400 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex items-center gap-3">
                  <Star size={16} />
                  <span className="font-bold text-sm">My List (미분류 저장)</span>
                </div>
                {targetAddGroupId === "ungrouped" && <Check size={18} />}
              </button>

              {favoriteGroups.map(group => (
                <button 
                  key={group.id}
                  onClick={() => {
                    setTargetAddGroupId(group.id);
                    // 즉시 실행하거나 Done 버튼으로 실행
                  }}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all border ${targetAddGroupId === group.id ? 'bg-[#F08080]/10 border-[#F08080] text-[#F08080]' : 'bg-white/5 border-white/5 text-gray-400 opacity-60 hover:opacity-100'}`}
                >
                  <span className="font-bold text-sm">{group.name}</span>
                  {targetAddGroupId === group.id && <Check size={18} />}
                </button>
              ))}

              {newGroupInputOpen ? (
                <div className="flex items-center gap-2 p-2">
                  <Input 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="New list name..."
                    className="flex-1 bg-black/40 border-white/10 h-11 rounded-xl text-sm"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (newGroupName) {
                        const id = Date.now().toString();
                        saveGroups([{ id, name: newGroupName, stocks: [] }, ...favoriteGroups]);
                        setTargetAddGroupId(id);
                        setNewGroupName("");
                        setNewGroupInputOpen(false);
                      }
                    }}
                    className="p-3 bg-[#F08080] text-white rounded-xl shadow-lg shadow-[#F08080]/20"
                  >
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setNewGroupInputOpen(true)}
                  className="w-full p-4 flex items-center gap-3 text-gray-500 hover:text-white transition-colors group"
                >
                  <div className="w-5 h-5 flex items-center justify-center border border-dashed border-gray-600 rounded group-hover:border-white">
                    <Plus size={14} />
                  </div>
                  <span className="text-sm font-bold">Create new list</span>
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                handleMultiAdd();
                setIsGroupSelectorOpen(false);
              }}
              className="w-full py-4 bg-[#F08080] text-white rounded-2xl text-sm font-black tracking-widest shadow-xl shadow-[#F08080]/20 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

// v1.3.0: URL 내비게이션(뒤로가기 지원)을 위한 Suspense 래퍼
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    }>
      <ProjectApp />
    </Suspense>
  );
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  );
}
