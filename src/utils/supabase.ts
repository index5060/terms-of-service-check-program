import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 접속 정보가 올바르게 기입되었는지 검증 (http/https로 시작하며 기본 플레이스홀더가 아님)
const isConfigured = 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-supabase-project-id');

// 설정이 정상적이면 실제 Supabase Client를 생성하고,
// 미설정 상태이면 프론트엔드가 크래시(Runtime Error) 나지 않도록 가상 Mock Client(Proxy)를 바인딩함
export const supabase = (isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({}, {
      get: () => {
        // 모든 메서드 체이닝을 받아내어 빈 데이터와 안전한 에러 객체 반환
        return () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
              single: () => Promise.resolve({ data: null, error: { message: 'Supabase가 구성되지 않았습니다.' } }),
              order: () => Promise.resolve({ data: [] })
            }),
            order: () => Promise.resolve({ data: [] })
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'Supabase가 구성되지 않았습니다.' } })
            })
          }),
          then: (resolve: (val: unknown) => void) => resolve({ data: null, error: { message: 'Supabase가 구성되지 않았습니다.' } })
        });
      }
    }) as unknown)) as SupabaseClient;
