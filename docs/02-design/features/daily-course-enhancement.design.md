# Design: 일일 코스 & UX 개선

> 작성일: 2026-02-24
> Plan: [daily-course-enhancement.plan.md](../../01-plan/features/daily-course-enhancement.plan.md)
> 상태: Draft

---

## 1. 데이터 구조 변경

### 1.1 장소별 zone 추가

모든 MUSEUMS, FOODS, TOURS, SPOTS에 `zone` 필드를 추가한다.
기존 `gmap` 필드는 구글맵 딥링크의 출발지/도착지로 재활용한다.

**니스 zone 분류**:
| zone | 포함 장소 | 정렬 순서 |
|------|-----------|-----------|
| `nice-cimiez` | 마티스(N1), 샤갈(N2) | 1 (언덕 위, 아침에 먼저) |
| `nice-port` | 니스 항구(NS6) | 2 |
| `nice-center` | MAMAC(N3), 보자르(N4), Liberation시장(NS7), 마세나광장(NS5) | 3 |
| `nice-old` | 팔레라스카리(N5), 구시가지(NS2), 쿠르살레야(NS3), 성언덕(NS4) | 4 |
| `nice-promenade` | 영국인산책로(NS1) | 5 |
| `nice-suburb` | Maeght(N6), 에즈(NS8), 모나코(NS9) | 6 (근교) |

**파리 zone 분류**:
| zone | 포함 장소 | 정렬 순서 |
|------|-----------|-----------|
| `paris-montmartre` | 몽마르뜨+사크레쾨르(PS4) | 1 (북쪽부터) |
| `paris-opera` | 갈르리라파예트(PS9), 자크마르앙드레(P8) | 2 |
| `paris-louvre` | 루브르(P1), 생트샤펠(P7) | 3 |
| `paris-marais` | 피카소(P5), 마레(PS5) | 4 |
| `paris-latin` | 노트르담(PS3), 생마르탱운하(PS11) | 5 |
| `paris-stgermain` | 오르세(P2), 오랑주리(P3), 뤽상부르(PS6), 생제르맹(PS8), 봉막셰(PS10) | 6 |
| `paris-eiffel` | 로댕(P4), 프티팔레(P6), 에펠탑(PS1), 트로카데로(PS7), 개선문(PS2) | 7 |
| `paris-suburb` | 베르사유(PS12) | 8 (근교) |

**맛집 zone 분류**: 맛집은 위치 기반으로 가장 가까운 zone에 배정.
- 니스: NF1~NF7, NB1~NB2 → `nice-old` 또는 `nice-center`
- 파리: 미슐랭/부이용/비스트로 → 해당 구역별 배정

**투어 zone**: 투어는 출발지 기준으로 zone 배정 (대부분 `nice-center` / `paris-louvre`).

### 1.2 호텔 gmap 데이터 추가

코스 보기에서 "호텔 → 첫 번째 장소" 구글맵 링크를 위해 호텔 검색어 필요.

```javascript
// DAYS에 hotelGmap 추가
{date:'3/30', ..., hotel:'Westminster Hotel & Spa', hotelGmap:'Westminster Hotel Spa Nice'},
{date:'4/3', ..., hotel:'Dandy Hotel', hotelGmap:'Dandy Hotel Paris'},
{date:'4/6', ..., hotel:'Novotel Les Halles', hotelGmap:'Novotel Paris Les Halles'},
```

### 1.3 MAJOR_TRANSIT 데이터

```javascript
const MAJOR_TRANSIT = {
  'nice→paris': {
    label: '니스 → 파리 이동',
    options: [
      {icon:'🚄', name:'TGV', price:'26~190€', dur:'5.5시간', desc:'SNCF Connect 예약, 좌석 넓음'},
      {icon:'🚄', name:'OUIGO', price:'19€~', dur:'5.5시간', desc:'사전 예약 필수, 수하물 제한'},
      {icon:'✈️', name:'비행기', price:'34€~', dur:'1.5시간', desc:'공항 이동 약 2시간 추가'},
    ],
    bookLink: 'https://www.sncf-connect.com/'
  }
};
```

### 1.4 이미지 데이터

주요 장소에 `img` 필드 추가. Wikimedia Commons 썸네일 URL 사용 (무료, 핫링크 허용).

```javascript
// 예시
{id:'P1', name:'루브르', img:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/320px-Louvre_Museum_Wikimedia_Commons.jpg', ...}
```

- 이미지 로딩 실패 시 카테고리별 이모지 fallback: 🎨(museum), 🍽️(food), 🚶(tour), 📍(spot)
- 카드 왼쪽에 60x60 라운드 썸네일로 표시

---

## 2. UI 설계

### 2.1 타임라인 날짜 카드 변경 (F2)

**Before**:
```
┌──────────────────────────────────┐
│ 3/31 화                    [니스] │
│ Westminster Hotel & Spa          │
│ 마티스/샤갈/팔레라스카리 휴관      │
│ [마티스] [샤갈] [MAMAC]           │
└──────────────────────────────────┘
  (카드 전체 탭 → daySheet 열림)
```

**After**:
```
┌──────────────────────────────────┐
│ 3/31 화                    [니스] │
│ Westminster Hotel & Spa          │
│ 마티스/샤갈/팔레라스카리 휴관      │
│ [마티스] [샤갈] [MAMAC]           │
│                                  │
│ [+ 일정 추가]    [📋 코스 보기]   │
└──────────────────────────────────┘
```

- 하단에 버튼 2개 가로 배치
- "일정 추가": 기존 daySheet 열기 → addSheet 진입
- "코스 보기": courseSheet(새 시트) 열기
- 일정 0개일 때 "코스 보기" 버튼 회색(disabled) + "일정을 먼저 추가하세요" 툴팁
- 카드 상단 영역 탭 → daySheet (기존 동작 유지)

**CSS 추가**:
```css
.day-actions {
  display: flex; gap: 8px; margin-top: 12px;
}
.day-action-btn {
  flex: 1; padding: 10px; border-radius: var(--radius-xs);
  border: none; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all .15s;
}
.day-action-btn.add {
  background: var(--blue-bg); color: var(--blue);
}
.day-action-btn.course {
  background: var(--gray900); color: #fff;
}
.day-action-btn:disabled {
  background: var(--gray100); color: var(--gray300); cursor: default;
}
```

### 2.2 코스 보기 시트 (F1) — courseSheet

새로운 바텀시트. 장소를 zone 순서로 정렬하여 타임라인 형태로 표시.

```
┌──────────────────────────────────┐
│ ━━━  (handle)                    │
│ 3/31 (화) 코스        [×]        │
├──────────────────────────────────┤
│                                  │
│ 🏨 Westminster Hotel & Spa      │
│    │                             │
│    │ 📍 구글맵으로 길찾기 →       │
│    ▼                             │
│ 🎨 마티스 미술관                  │
│    ~10€ · 1~1.5h                 │
│    │                             │
│    │ 📍 구글맵으로 길찾기 →       │
│    ▼                             │
│ 🎨 샤갈 미술관                    │
│    ~10€ · 1~1.5h                 │
│    │                             │
│    │ 📍 구글맵으로 길찾기 →       │
│    ▼                             │
│ 🍽️ Chez Pipo                    │
│    € · 캐주얼                    │
│    │                             │
│    │ 📍 구글맵으로 길찾기 →       │
│    ▼                             │
│ 🎨 MAMAC                        │
│    무료 · 1~2h                   │
│    │                             │
│    ▼ 📍 호텔로 돌아가기 →         │
│ 🏨 Westminster Hotel & Spa      │
│                                  │
│ ─────────────────────────        │
│ 💰 예상 입장료 합계: ~20€        │
│ 🎫 Riviera Pass 48h(40€)면      │
│    개별보다 저렴!                 │
└──────────────────────────────────┘
```

**핵심 로직**:
1. 해당 날짜의 일정(`S.sch[date]`)에서 장소 목록 가져오기
2. 각 장소의 `zone` 조회 → `ZONE_ORDER[city]` 기준으로 정렬
3. 호텔 → 장소1 → 장소2 → ... → 호텔 순서로 렌더링
4. 각 구간에 구글맵 딥링크 생성: `gmapDir(이전장소.gmap, 현재장소.gmap)`
5. 하단에 입장료 합계 표시 (가격이 있는 장소들의 price 파싱)

**`gmapDir` 함수**:
```javascript
function gmapDir(from, to, mode='transit') {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${mode}`;
}
```

### 2.3 대규모 이동 교통 제안 카드 (F4)

`ck:'travel'`인 날짜의 daySheet 상단에 교통 비교 카드 자동 삽입.

```
┌──────────────────────────────────┐
│ 🚄 니스 → 파리 이동               │
│                                  │
│ ┌─────────────────────────────┐  │
│ │ 🚄 TGV        26~190€      │  │
│ │    5.5시간 · 좌석 넓음       │  │
│ ├─────────────────────────────┤  │
│ │ 🚄 OUIGO      19€~         │  │
│ │    5.5시간 · 사전 예약 필수  │  │
│ ├─────────────────────────────┤  │
│ │ ✈️ 비행기     34€~          │  │
│ │    1.5시간 · +공항이동 2시간 │  │
│ └─────────────────────────────┘  │
│                                  │
│ [SNCF Connect에서 예약하기 →]     │
└──────────────────────────────────┘
```

**CSS**:
```css
.transit-card {
  background: var(--green-bg); border-radius: var(--radius-sm);
  padding: 16px; margin-bottom: 16px;
}
.transit-title { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
.transit-option {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,.06);
}
.transit-option:last-child { border-bottom: none; }
.transit-name { font-size: 14px; font-weight: 600; }
.transit-detail { font-size: 12px; color: var(--gray600); }
.transit-price { font-size: 14px; font-weight: 700; color: var(--green); }
.transit-book {
  display: block; text-align: center; padding: 12px;
  background: var(--green); color: #fff; border-radius: var(--radius-xs);
  font-size: 13px; font-weight: 700; margin-top: 12px; text-decoration: none;
}
```

### 2.4 콘텐츠 카드 이미지 (F3)

카드 레이아웃을 좌측 이미지 + 우측 텍스트로 변경.

```
┌──────────────────────────────────┐
│ ┌──────┐  루브르         [무료?] │
│ │ img  │  모나리자, 승리의 여신   │
│ │60x60 │  ~22€ · 4~6h · 화 휴관  │
│ └──────┘  📍 Google 지도에서 보기 │
└──────────────────────────────────┘
```

**CSS 변경**:
```css
.ccard { display: flex; gap: 12px; align-items: flex-start; }
.ccard-img {
  width: 60px; height: 60px; border-radius: var(--radius-xs);
  object-fit: cover; flex-shrink: 0; background: var(--gray100);
}
.ccard-img-fallback {
  width: 60px; height: 60px; border-radius: var(--radius-xs);
  background: var(--gray100); display: flex; align-items: center;
  justify-content: center; font-size: 24px; flex-shrink: 0;
}
```

---

## 3. 새로운 HTML 요소

```html
<!-- courseSheet (daySheet, addSheet와 동일 패턴) -->
<div class="sheet" id="courseSheet">
  <div class="sheet-handle"></div>
  <div class="sheet-header">
    <span class="sheet-title" id="csTitle"></span>
    <button class="sheet-close" onclick="closeCourse()">&times;</button>
  </div>
  <div class="sheet-body" id="csBody"></div>
</div>
```

---

## 4. 함수 설계

### 4.1 신규 함수

| 함수 | 역할 |
|------|------|
| `gmapDir(from, to, mode)` | 구글맵 경로 딥링크 생성 |
| `openCourse(dateKey)` | 코스 보기 시트 열기 |
| `renderCourse(dateKey)` | 코스 내용 렌더링 (zone 정렬 + 딥링크) |
| `closeCourse()` | 코스 시트 닫기 |
| `getZone(id, type)` | 장소 ID로 zone 조회 |
| `sortByZone(items, city)` | zone 순서로 장소 정렬 |
| `renderTransitCard(fromCity, toCity)` | 대규모 이동 교통 카드 HTML 생성 |
| `calcTotalPrice(items)` | 입장료 합계 계산 |

### 4.2 수정 함수

| 함수 | 변경 내용 |
|------|-----------|
| `renderTL()` | 날짜 카드에 버튼 2개 추가, 카드 클릭 이벤트 분리 |
| `openDay()` | travel일에 교통 비교 카드 삽입 |
| `renderContent()` | 카드에 이미지/fallback 추가 |

---

## 5. 구현 순서

| Step | 작업 | 예상 변경 |
|------|------|-----------|
| 1 | 데이터에 `zone`, `hotelGmap` 추가 | MUSEUMS/FOODS/TOURS/SPOTS/DAYS 수정 |
| 2 | `ZONE_ORDER`, `MAJOR_TRANSIT` 상수 추가 | 신규 상수 |
| 3 | `gmapDir()` 함수 추가 | 신규 함수 |
| 4 | 타임라인 버튼 분리 (F2) | CSS + `renderTL()` 수정 |
| 5 | courseSheet HTML + `openCourse()`/`renderCourse()` | HTML + 신규 함수 |
| 6 | 교통 제안 카드 (F4) | `openDay()` 수정 |
| 7 | 이미지 데이터 추가 + 카드 이미지 (F3) | 데이터 + `renderContent()` 수정 |

---

## 6. 영향 범위

- **변경 파일**: `index.html` (유일한 파일)
- **localStorage**: 기존 `ftp_v3` 키 구조 변경 없음 (읽기 전용 데이터만 추가)
- **하위 호환**: 기존 저장된 일정 데이터 그대로 동작

---

> 다음 단계: 설계 승인 후 `/pdca do daily-course-enhancement`
