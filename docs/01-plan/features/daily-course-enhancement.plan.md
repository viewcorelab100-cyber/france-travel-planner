# Plan: 일일 코스 & UX 개선

> 작성일: 2026-02-24
> 상태: Approved
> 대상: 프랑스 여행 플래너 (index.html)

---

## 1. 배경 및 목적

현재 여행 플래너는 날짜별 일정 **추가/삭제**만 가능하다. 사용자가 일정을 추가한 뒤에도 "하루를 어떤 순서로 돌아야 하는지", "이동 수단과 비용은 얼마인지"를 직접 파악해야 한다. 또한 콘텐츠 카드에 이미지가 없어 시각적 매력이 부족하고, 니스→파리 같은 대규모 이동에 대한 교통 안내가 부재하다.

## 2. 요구사항 요약

| # | 기능 | 설명 |
|---|------|------|
| F1 | **하루 코스 자동 생성** | 날짜별 일정 추가 후 "코스 보기" 버튼을 누르면, 추가된 장소들을 **최적 동선**으로 정렬하고 장소 간 **이동 방법(도보/버스/지하철)**과 **예상 비용**을 표시 |
| F2 | **날짜별 버튼 2개** | 타임라인의 각 날짜 카드에 "일정 추가" / "코스 보기" 버튼 분리 |
| F3 | **콘텐츠 카드 대표 이미지** | 미술관/맛집/투어/관광지 카드에 대표 이미지 표시 |
| F4 | **대규모 이동 교통 제안** | 니스→파리 등 지역 간 이동이 있는 날짜에 교통수단(TGV/OUIGO/비행기) 비교 정보 자동 표시 |

## 3. 기능별 상세

### F1: 하루 코스 자동 생성

**문제**: 일정에 장소를 추가해도 최적 방문 순서를 모름
**해결** (v2 - 구글맵 딥링크 방식):
- 각 장소에 **지역 그룹(zone)** 태그를 부여
- 같은 zone끼리 묶어서 **동선 순서를 자동 정렬**
- 이동 정보는 직접 계산하지 않고 **구글맵 딥링크로 위임**:
  - `https://www.google.com/maps/dir/?api=1&origin=출발지&destination=도착지&travelmode=transit`
  - 사용자가 링크를 탭하면 구글맵이 실시간 교통/대중교통/도보 경로를 알아서 표시
- "코스 보기" 시트: 장소 순서 타임라인 + 각 구간 **"구글맵으로 길찾기"** 링크

**장점**: API 비용 0원, 실시간 교통 반영, 구현 간단

### F2: 날짜별 버튼 2개

- 타임라인 날짜 카드에 버튼 영역 추가
- "일정 추가" (기존 기능) + "코스 보기" (F1 기능)
- 일정이 0개인 경우 "코스 보기" 버튼 비활성화

### F3: 콘텐츠 카드 대표 이미지

**CTO 의견**:
> 외부 이미지 URL을 직접 사용하면 CORS/핫링크 문제가 있고, 로컬 이미지를 수십 장 포함하면 파일이 비대해진다. **현실적 접근**:
> 1. Unsplash/Wikimedia의 무료 이미지를 `img` 필드로 데이터에 추가
> 2. 이미지 로딩 실패 시 fallback으로 이모지 아이콘 표시
> 3. 초기에는 주요 장소(10~15곳)만 이미지 추가, 나머지는 아이콘

### F4: 대규모 이동 교통 제안

- `DAYS` 데이터에서 `ck:'travel'` 날짜 감지
- 해당 날짜의 daySheet에 **교통 비교 카드** 자동 삽입:
  - TGV: 약 26~190€, 5.5시간
  - OUIGO: 약 19€~, 5.5시간 (사전 예약)
  - 비행기: 약 34€~, 1.5시간 (공항 이동 시간 별도)
- 이미 `DAYS[4]` (4/3 파리 이동)에 해당

## 4. 기술적 제약

| 제약 | 대응 |
|------|------|
| 단일 HTML 파일 | 모든 기능을 index.html 내에서 구현 |
| API 키 없음 | 구글맵 딥링크로 경로 안내 위임 (비용 0원) |
| 이미지 호스팅 없음 | Wikimedia/Unsplash 무료 URL 또는 emoji fallback |
| localStorage 기반 | 기존 저장 구조 확장 (`S.course` 등) |

## 5. 구현 우선순위

| 순위 | 기능 | 이유 |
|------|------|------|
| 1 | F2 - 버튼 분리 | 기존 UI 구조 변경, 다른 기능의 기반 |
| 2 | F4 - 교통 제안 | 데이터만 추가하면 됨, 구현 간단 |
| 3 | F1 - 코스 자동 생성 | 핵심 기능이지만 zone 데이터 작업 필요 |
| 4 | F3 - 대표 이미지 | 이미지 URL 수집 작업이 필요 |

## 6. 예상 데이터 구조 변경

```javascript
// 각 장소에 zone + gmap 검색어 (기존 gmap 필드 활용)
{id:'N1', name:'마티스 미술관', zone:'nice-cimiez', gmap:'Musée Matisse Nice', ...}
{id:'N3', name:'MAMAC', zone:'nice-center', gmap:'MAMAC Nice', ...}
{id:'P1', name:'루브르', zone:'paris-louvre', gmap:'Musée du Louvre Paris', ...}

// zone 정렬 순서 (동선 최적화용)
const ZONE_ORDER = {
  nice: ['nice-cimiez','nice-port','nice-center','nice-old','nice-promenade'],
  paris: ['paris-montmartre','paris-opera','paris-louvre','paris-marais','paris-latin','paris-stgermain','paris-eiffel','paris-versailles']
};

// 구글맵 딥링크 생성 (이동 정보는 구글맵에 위임)
function gmapDir(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
}

// 대규모 이동 정보 (travel일에 표시)
const MAJOR_TRANSIT = {
  'nice→paris': [
    {name:'TGV', price:'26~190€', duration:'5.5시간', note:'SNCF Connect 예약'},
    {name:'OUIGO', price:'19€~', duration:'5.5시간', note:'사전 예약 필수, 좌석 지정'},
    {name:'비행기', price:'34€~', duration:'1.5시간', note:'공항 이동 2시간 추가'},
  ]
};
```

## 7. 미해결 사항

- [ ] 이미지 URL 소싱 방법 최종 결정 (Wikimedia vs Unsplash vs emoji only)
- [x] ~~zone 분류 기준 확정~~ → zone은 동선 정렬용, 이동 정보는 구글맵 딥링크로 위임
- [ ] 코스 보기 시트의 디자인 확정 → Design 단계에서 결정

---

> 다음 단계: `/pdca design daily-course-enhancement`
