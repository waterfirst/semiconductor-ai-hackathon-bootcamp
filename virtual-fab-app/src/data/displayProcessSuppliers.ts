export type DisplaySupplierRow = {
  majorProcess: string
  detail: string
  equipmentMaterial: string
  samsung: string[]
  lg: string[]
  chinaOthers: string[]
  mappedCompanyIds: string[]
}

// 사용자가 제공한 “Flexible OLED 주요 공정별 장비 및 소재 공급 업체” 표를
// 모바일에서 읽을 수 있도록 대표 공급사 중심으로 재구성한 과거 참고 스냅샷이다.
// 기준연도가 없어 현재 공급계약·점유율로 간주하지 않는다.
export const DISPLAY_SUPPLIER_ROWS: DisplaySupplierRow[] = [
  { majorProcess: 'PI', detail: 'PI Varnish', equipmentMaterial: 'PI 소재', samsung: ['익스엠티'], lg: ['Kaneka', 'PI첨단소재'], chinaOthers: ['익스엠티', 'Kaneka', 'PI첨단소재'], mappedCompanyIds: [] },
  { majorProcess: 'PI', detail: 'PI Curing', equipmentMaterial: 'Curing 장비', samsung: ['원익IPS'], lg: ['비아트론'], chinaOthers: ['원익IPS', '비아트론'], mappedCompanyIds: [] },
  { majorProcess: 'LTPS·Oxide', detail: '열처리·ELA', equipmentMaterial: 'Furnace · ELA', samsung: ['원익IPS', '비아트론', 'AP시스템'], lg: ['비아트론', 'Koyo', 'JSW', '이오테크닉스'], chinaOthers: ['원익IPS', '비아트론', 'YAC', 'Koyo', 'AP시스템', 'JSW'], mappedCompanyIds: [] },
  { majorProcess: 'TFT', detail: '세정', equipmentMaterial: 'Wet · Dry Cleaner', samsung: ['SEMES'], lg: ['DMS', 'KC Tech'], chinaOthers: ['DMS', 'KC Tech'], mappedCompanyIds: ['semes', 'dms'] },
  { majorProcess: 'TFT', detail: '증착', equipmentMaterial: 'PECVD · Sputter', samsung: ['Applied Materials', '원익IPS', '뉴파워프라즈마'], lg: ['Applied Materials', '주성엔지니어링'], chinaOthers: ['Applied Materials', '원익IPS', '주성엔지니어링', 'ULVAC', '이노베니아'], mappedCompanyIds: ['applied-materials', 'jusung-engineering', 'ulvac'] },
  { majorProcess: 'TFT', detail: '노광', equipmentMaterial: 'Scanner · Coater', samsung: ['Nikon', 'Canon', 'KC Tech', 'SEMES'], lg: ['Nikon', 'Canon', 'DNS'], chinaOthers: ['Nikon', 'Canon', 'DNS', 'KC Tech'], mappedCompanyIds: ['nikon', 'semes'] },
  { majorProcess: 'TFT', detail: '식각', equipmentMaterial: 'Dry · Wet Etcher · Asher · Stripper', samsung: ['아이씨디', '원익IPS', 'KC Tech', 'SEMES'], lg: ['이노베니아', '아이씨디', 'Tokyo Electron', 'DMS', 'KC Tech'], chinaOthers: ['이노베니아', 'Tokyo Electron', '원익IPS', 'DMS', 'KC Tech', 'YAC', 'CTS'], mappedCompanyIds: ['icd', 'dms', 'tel', 'semes'] },
  { majorProcess: 'TFT', detail: '약액·가스', equipmentMaterial: '식각액 · 박리액 · 특수가스', samsung: ['동진쎄미켐', 'ENF', '효성', 'SK머티리얼즈', 'Air Products', '원익머트리얼즈'], lg: ['솔브레인', 'ENF', '효성', 'SK머티리얼즈', 'Air Products', '원익머트리얼즈'], chinaOthers: ['동진쎄미켐', '솔브레인', 'ENF', '효성', 'Air Products', '원익머트리얼즈'], mappedCompanyIds: ['dongjin-semichem', 'soulbrain', 'enf-technology'] },
  { majorProcess: 'OLED 증착', detail: '증착', equipmentMaterial: 'Evaporator', samsung: ['Canon Tokki'], lg: ['YAS', 'Canon Tokki', '선익시스템'], chinaOthers: ['Canon Tokki', 'ULVAC', 'SFA', '선익시스템', '이노베니아'], mappedCompanyIds: ['canon-tokki', 'ulvac', 'sfa-engineering'] },
  { majorProcess: 'OLED 봉지', detail: '봉지', equipmentMaterial: '무기물 CVD · ALD · Inkjet', samsung: ['원익IPS', 'Applied Materials', 'TES', 'AP시스템', 'Kateeva'], lg: ['주성엔지니어링', 'Applied Materials', 'Kateeva'], chinaOthers: ['원익IPS', 'Applied Materials', '주성엔지니어링', 'TES', 'Kateeva'], mappedCompanyIds: ['applied-materials', 'jusung-engineering'] },
  { majorProcess: 'Laser Lift Off', detail: 'LLO', equipmentMaterial: 'Laser Lift Off', samsung: ['AP시스템', '필옵틱스'], lg: ['이오테크닉스'], chinaOthers: ['AP시스템', '필옵틱스'], mappedCompanyIds: [] },
  { majorProcess: 'Cell', detail: '물류·검사', equipmentMaterial: '물류 · 검사 장비', samsung: ['SFA', 'HB Solution', '참엔지니어링', '이맥', 'Orbotech', 'KC Tech'], lg: ['이노베니아', 'HB Solution', 'Orbotech'], chinaOthers: ['SFA', 'SEMES', 'Daifuku', 'KC Tech', '참엔지니어링', 'Orbotech'], mappedCompanyIds: ['sfa-engineering', 'hb-solution', 'semes'] },
  { majorProcess: 'Module', detail: '후공정', equipmentMaterial: 'Lamination · Cutting · Bonding', samsung: ['톱텍', 'AP시스템', '제이스텍', 'SFA', '필옵틱스', '이오테크닉스', 'KC Tech', '파인텍'], lg: ['LG전자', '이오테크닉스'], chinaOthers: ['톱텍', 'AP시스템', 'SFA', '이오테크닉스', '필옵틱스', '제이스텍', 'KC Tech', '파인텍'], mappedCompanyIds: ['sfa-engineering'] },
  { majorProcess: 'Module', detail: 'IC·FPCB', equipmentMaterial: 'Driver IC · FPCB', samsung: ['Samsung', '비에이치', '인터플렉스', '영풍'], lg: ['LX Semicon', 'LG이노텍'], chinaOthers: ['Samsung', 'Mektron', 'Zhen Ding', '비에이치'], mappedCompanyIds: ['samsung', 'lx-semicon'] },
  { majorProcess: 'OLED 소재', detail: 'HIL·HTL', equipmentMaterial: '유기재료', samsung: ['덕산네오룩스', '두산전자'], lg: ['Idemitsu Kosan', 'Merck'], chinaOthers: ['덕산네오룩스', '두산전자', 'Idemitsu Kosan', 'Merck'], mappedCompanyIds: ['duksan-neolux', 'idemitsu-kosan', 'merck-electronics'] },
  { majorProcess: 'OLED 소재', detail: 'Red·Green', equipmentMaterial: 'Host · Dopant', samsung: ['덕산네오룩스', 'Dow', 'Samsung SDI', 'UDC', 'NSCC', '두산전자'], lg: ['Dow', 'LG화학', 'Merck', 'Idemitsu Kosan', 'UDC'], chinaOthers: ['덕산네오룩스', 'Dow', 'LG화학', 'Merck', 'Samsung SDI', 'UDC'], mappedCompanyIds: ['duksan-neolux', 'samsung-sdi', 'idemitsu-kosan', 'universal-display', 'merck-electronics'] },
  { majorProcess: 'OLED 소재', detail: 'Blue·ETL·EIL', equipmentMaterial: 'Host · Dopant · 수송층', samsung: ['Idemitsu Kosan', 'Dow', 'SFC', 'JNC', '두산전자', 'Tosoh', 'LG화학'], lg: ['Idemitsu Kosan', '희성소재', 'LG화학'], chinaOthers: ['Idemitsu Kosan', '두산전자', 'Tosoh', '희성소재', 'LG화학'], mappedCompanyIds: ['idemitsu-kosan'] },
  { majorProcess: 'OLED 소재', detail: 'FMM', equipmentMaterial: 'Fine Metal Mask', samsung: ['DNP'], lg: ['Toppan Printing'], chinaOthers: ['DNP', 'Toppan Printing'], mappedCompanyIds: [] },
]
