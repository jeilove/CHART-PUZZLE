"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-white p-6 text-center">
      <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="#fb7185" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 className="text-2xl font-black mb-2 tracking-tight">시스템 오류가 발생했습니다</h2>
      <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
        화면을 렌더링하는 중 문제가 발생했습니다.<br />
        아래 버튼을 눌러 다시 시도하거나,<br />
        잠시 후 다시 접속해 주세요.
      </p>
      <div className="space-y-3 w-full max-w-[200px]">
        <Button 
          onClick={() => reset()}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-2xl shadow-xl shadow-rose-500/20"
        >
          다시 시도하기
        </Button>
        <button 
          onClick={() => window.location.href = "/"}
          className="w-full py-3 text-xs text-gray-500 hover:text-white transition-colors"
        >
          홈으로 이동
        </button>
      </div>
      <p className="mt-12 text-[10px] text-gray-600 font-mono tracking-tighter uppercase">
        Error ID: {error.digest || "N/A"}
      </p>
    </div>
  );
}
