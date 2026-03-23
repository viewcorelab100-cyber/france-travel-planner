# Plan: 플랫폼 마이그레이션 (단일 HTML → Next.js)

> 작성일: 2026-02-24
> 상태: Approved
> 대상: 프랑스 여행 플래너 → 다중 사용자 여행 플래너 서비스

---

## 1. 배경 및 목적

현재 프랑스 여행 플래너는 **단일 index.html** 파일(~1,050줄)에 CSS·HTML·JS가 모두 포함된 구조다. 이 상태로는:
- 코드 재사용/유지보수가 어렵다
- 타인에게 공유 시 URL 하나로 접근 불가 (파일 전달 필요)
- 다른 여행지 확장이 불가능하다
- Instagram 컨텐츠로 활용하기 어렵다

**목표**: Next.js App Router 기반으로 마이그레이션하여:
1. **Phase 1**: 정적 사이트로 Vercel 배포 (공유 가능한 URL)
2. **Phase 2 (미래)**: 다중 사용자 서비스로 확장 가능한 구조

## 2. 마이그레이션 범위

### 2.1 데이터 분리 (JSON)
현재 index.html에 하드코딩된 모든 데이터를 JSON 파일로 분리:

| 상수명 | 항목 수 | 분리 파일 |
|--------|---------|-----------|
| DAYS | 11 | `src/data/days.json` |
| MUSEUMS | 14 | `src/data/museums.json` |
| FOODS | 30 | `src/data/foods.json` |
| TOURS | 11 | `src/data/tours.json` |
| SPOTS | 21 | `src/data/spots.json` |
| ZT | 37쌍 | `src/data/zone-travel.json` |
| ZONE_ORDER | 2도시 | `src/data/zones.json` |
| MAJOR_TRANSIT | 1 | `src/data/transit.json` |
| SUPPLIES | 2그룹 | `src/data/supplies.json` |
| TIPS | 5카테고리 | `src/data/tips.json` |
| MUSEUM_INFO | 2도시 | `src/data/museum-info.json` |
| TYPE_EMOJI 등 상수 | - | `src/data/constants.ts` |

### 2.2 컴포넌트 분해 (React)

| 컴포넌트 | 역할 | 원본 함수 |
|----------|------|-----------|
| `BottomNav` | 하단 네비게이션 | `.nav-item` 이벤트 |
| `Timeline` | 날짜별 타임라인 | `renderTL()` |
| `DayCard` | 개별 날짜 카드 | 타임라인 내 날짜 |
| `DaySheet` | 일정 상세 바텀시트 | `openDay()` |
| `AddSheet` | 일정 추가 바텀시트 | `renderAS()` |
| `CourseSheet` | 코스 보기 바텀시트 | `openCourse()` |
| `ContentPage` | 컨텐츠 목록 페이지 | `renderContent()` |
| `ContentCard` | 개별 컨텐츠 카드 | ccard 렌더링 |
| `CustomForm` | 직접 추가 폼 | 커스텀 입력 |
| `TransitCard` | 대규모 이동 카드 | transit 렌더링 |
| `Checklist` | 준비물 체크리스트 | `renderChk()` |
| `TipsPage` | 팁 페이지 | `renderTips()` |
| `BottomSheet` | 공통 바텀시트 | `.sheet` / `.overlay` |

### 2.3 유틸리티 분리

| 파일 | 함수들 |
|------|--------|
| `src/utils/maps.ts` | `gmap()`, `gmapDir()` |
| `src/utils/course.ts` | `findItem()`, `getZone()`, `getGmap()`, `sortByZone()`, `parseDur()`, `zoneTravelMin()`, `fmtTime()` |
| `src/utils/schedule.ts` | 스마트 스케줄링 로직 (openCourse 핵심) |

### 2.4 상태 관리

| 현재 | Phase 1 | Phase 2 (미래) |
|------|---------|----------------|
| localStorage (`ftp_v3`) | zustand + localStorage persist | Supabase/DB |
| `S.sch` (일정) | `useScheduleStore` | API |
| `S.food` (맛집 상태) | `useFoodStatusStore` | API |
| `S.chk` (체크리스트) | `useChecklistStore` | API |
| `S.custom` (직접 추가) | `useCustomStore` | API |

## 3. 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | SSG/SSR 전환 유연, 미래 API Routes 활용 |
| 언어 | TypeScript | 타입 안전성, 데이터 구조 명확화 |
| 스타일 | Tailwind CSS | 기존 CSS 변수 체계와 유사, 빠른 구현 |
| 상태 | Zustand + persist | 단순, localStorage 연동 |
| 배포 | Vercel | Next.js 최적화, 무료 |
| 패키지 매니저 | pnpm | 빠름, 디스크 효율 |

## 4. 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (Bottom Nav 포함)
│   ├── page.tsx            # 타임라인 페이지 (메인)
│   ├── content/
│   │   └── page.tsx        # 컨텐츠 페이지
│   ├── checklist/
│   │   └── page.tsx        # 체크리스트 페이지
│   └── tips/
│       └── page.tsx        # 팁 페이지
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── BottomSheet.tsx
│   ├── timeline/
│   │   ├── Timeline.tsx
│   │   ├── DayCard.tsx
│   │   ├── DaySheet.tsx
│   │   ├── AddSheet.tsx
│   │   └── CourseSheet.tsx
│   ├── content/
│   │   ├── ContentCard.tsx
│   │   ├── CustomForm.tsx
│   │   └── TransitCard.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Toast.tsx
│       └── CategoryTabs.tsx
├── data/
│   ├── days.json
│   ├── museums.json
│   ├── foods.json
│   ├── tours.json
│   ├── spots.json
│   ├── zone-travel.json
│   ├── zones.json
│   ├── transit.json
│   ├── supplies.json
│   ├── tips.json
│   ├── museum-info.json
│   └── constants.ts
├── stores/
│   ├── schedule.ts
│   ├── food-status.ts
│   ├── checklist.ts
│   └── custom.ts
├── utils/
│   ├── maps.ts
│   ├── course.ts
│   └── schedule.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

## 5. 구현 순서

| 단계 | 작업 | 산출물 |
|------|------|--------|
| 1 | Next.js 프로젝트 초기화 + Tailwind 설정 | 빈 프로젝트 실행 확인 |
| 2 | 데이터 JSON 분리 + TypeScript 타입 정의 | `src/data/`, `src/types/` |
| 3 | 유틸리티 함수 마이그레이션 | `src/utils/` |
| 4 | Zustand 스토어 구성 | `src/stores/` |
| 5 | 공통 컴포넌트 (BottomNav, BottomSheet, Toast) | `src/components/layout/`, `ui/` |
| 6 | 타임라인 페이지 (메인) | Timeline, DayCard, DaySheet, AddSheet |
| 7 | 코스 보기 기능 | CourseSheet |
| 8 | 컨텐츠 페이지 | ContentPage, ContentCard, CustomForm |
| 9 | 체크리스트 + 팁 페이지 | Checklist, Tips |
| 10 | 스타일 정리 + Vercel 배포 | 라이브 URL |

## 6. 기존 기능 보존 (1:1 매핑)

모든 기존 기능이 마이그레이션 후에도 동작해야 함:
- [x] 날짜별 일정 추가/삭제
- [x] 코스 보기 (스마트 스케줄링)
- [x] 구글맵 딥링크
- [x] 맛집 상태 관리 (후보/먹음/패스)
- [x] 준비물 체크리스트
- [x] 팁 페이지
- [x] 커스텀 장소 추가
- [x] 대규모 이동 교통 카드
- [x] 카테고리/도시 필터링

## 7. Phase 2 확장 포인트 (미래)

| 확장 | 준비된 구조 |
|------|-------------|
| 다중 여행 | `data/` → API endpoint로 전환 |
| 사용자 인증 | Next.js Auth.js + Supabase |
| 공유 URL | `/trip/[id]` 동적 라우트 |
| 다른 도시 | JSON 데이터만 추가 |
| Instagram 연동 | OG 메타태그 + 공유 이미지 |

---

> 다음 단계: `/pdca design platform-migration`
