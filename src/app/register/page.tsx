"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.user) {
        // 회원가입 성공 후 자동 로그인이 되거나 메일 인증이 필요할 수 있음
        // 여기서는 로그인 페이지로 이동하거나 성공 메시지 표시
        router.push("/login?message=회원가입이 완료되었습니다. 로그인을 진행해 주세요.");
      }
    } catch (err) {
      setError("서버와의 통신에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4 font-sans antialiased text-[#333]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-center mb-8 gap-2 font-bold text-2xl text-[#00c73c] tracking-tight">
          <span className="bg-[#00c73c] text-white w-8 h-8 rounded-lg flex items-center justify-center text-lg">N</span>
          메모 회원가입
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">이름</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00c73c]/20 focus:border-[#00c73c] transition-all"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00c73c]/20 focus:border-[#00c73c] transition-all"
              placeholder="example@memo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00c73c]/20 focus:border-[#00c73c] transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#00c73c] hover:bg-[#00b336] text-white font-bold rounded-xl py-3.5 mt-2 transition-colors shadow-lg shadow-[#00c73c]/20"
          >
            시작하기
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6 font-medium">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#00c73c] hover:underline font-bold">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
