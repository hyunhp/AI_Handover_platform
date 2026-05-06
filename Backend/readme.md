🚀 Project MegaHub: AI Handover Agent

"일상의 업무 로그를 단 한 번의 클릭으로 전문적인 인수인계서로 변환합니다."
MegaHub는 평소 업무 데이터를 맥락 기반으로 자동 그룹화하고, 퇴사나 부서 이동 시 AI Agent가 MECE(Mutually Exclusive, Collectively Exhaustive) 원칙에 입각한 고품질 인수인계 매뉴얼을 자동 생성 및 편집하는 시스템입니다.

💡 Core Vision

Daily Use: 사내 업무의 '구글 검색기'처럼 활용하며 업무 맥락(Context)을 쌓습니다.
Smart Grouping: AI가 이메일, 문서, 메신저 이력을 프로젝트별 가상 폴더로 자동 분류합니다.
Dynamic Refinement: 단순 생성을 넘어, 사용자와의 대화를 통해 매뉴얼의 디테일을 실시간으로 보강합니다.

🛠 System Architecture (Agentic Workflow)

본 프로젝트는 Multi-Agent Orchestration 구조를 채택하여 복잡한 문서화 및 수정 과정을 효율적으로 처리합니다.

1. Orchestrator (The Manager)
상태 관리: IDLE → ANALYZING → DRAFTING → AWAITING_REVIEW → REFINING으로 이어지는 워크플로우를 총괄합니다.
의사결정: 사용자의 입력이 "승인"인지 "수정 요청"인지 판단하여 적절한 에이전트를 호출합니다.

2. Context Analyzer (The History Searcher)
데이터 추출: 흩어진 업무 자료에서 핵심 키워드와 타임라인을 추출합니다.
맥락 파악: 어떤 파일이 어떤 프로젝트(A포털 채용, 신규 입사자 세팅 등)에 속하는지 분류 로직을 세웁니다.

3. Folder Manager (The Asset Organizer) 
역할: Context Analyzer가 분류한 결과에 따라 실제 파일이나 데이터를 물리적/논리적 폴더로 이동 및 복사합니다.
기능: * 파일 분류 실행: 분석된 맥락에 따라 폴더 구조(RESULT/프로젝트명/자료)를 생성하고 파일을 배치합니다.
중복 허용 처리: 이미지 가이드대로 특정 자료는 여러 폴더에 존재할 수 있도록(MECE하지 않게) 유연하게 관리합니다.
인덱싱: 나중에 Manual Architect가 참고할 수 있도록 각 폴더에 어떤 자료가 있는지 '자료 목록'을 만듭니다.

4. Manual Architect (The Drafter)
구조화: 추출된 데이터를 '업무 매뉴얼' 표준 양식에 맞춰 초안을 작성합니다.
표준 가이드 적용: 업무 목적(Why), 도구(Where), 프로세스(How)를 포함합니다.

5. Manual Editor (The Refiner)
인터랙티브 피드백: "이 부분 더 자세히 써줘"와 같은 사용자의 피드백을 반영하여 특정 섹션을 정밀 수정합니다.
맥락 유지: 전체 구조를 유지하면서 요구사항에 맞게 톤앤매너와 상세 내용을 보완합니다.

6. MECE Auditor (The Quality Checker)
무결성 검수: 생성된 매뉴얼에 중복이나 누락이 없는지 MECE 원칙에 따라 검토합니다.
반복 루프: 검수 결과 미흡한 점이 발견되면 다시 Architect나 Editor에게 피드백을 전달합니다.

🔄 Updated Workflow (State Transition)

Smart Grouping이 포함된 실제 작동 순서입니다:
[ANALYZING]: Context Analyzer가 업무 로그를 읽고 프로젝트별 '태그'를 부여합니다.
[GROUPING]: Folder Manager가 호출되어 실제 파일 시스템에 프로젝트 폴더를 생성하고 문서를 copy/paste 합니다.
[DRAFTING]: Manual Architect가 준비된 폴더 데이터를 기반으로 인수인계서 초안(draft.md)을 생성합니다.
[AWAITING_REVIEW]: 사용자에게 결과물을 제시하고 피드백을 기다립니다.
[REFINING]: 수정 요청 시 Manual Editor가 특정 섹션을 보완한 후 다시 검토 단계로 돌아갑니다.

📋 Manual Standard Structure (Output Format)

AI Agent는 다음 5단계 구조를 엄격히 준수하여 결과물을 생성합니다:
업무 운영 및 보안 원칙: 보안 등급, 정보 공유 범위, 업데이트 주기 명시.
주기별 업무 목록: [월간/주간/일일/상시]별 업무 및 데드라인.
표준 실무 가이드: Why(목적), Where(도구/경로), How(프로세스 요약), Detail(상세 가이드).
검증 및 효율화 도구: 필수 체크리스트 및 커뮤니케이션 템플릿.
예외 상황 및 담당자: 대응 시나리오 및 유관 부서/외부 담당자 정보.

🚀 Tech Stack

Core: Python 3.10+
Framework: Strands (Agentic Workflow SDK)
LLM:  Claude 3.5 Sonnet
UI: 별도 검토 중 (Streamlit 기반 Interactive Dashboard)

📅 Roadmap (Hackathon Scope)

[v] Phase 1: Orchestrator 기반 다중 에이전트 통신 구조 설계.
[v] Phase 2: Context Analyzer & Folder Manager를 통한 자동 파일 분류 및 인덱싱 구현. 
[v] Phase 3: 일상 업무 로그 분석 및 Manual Architect 초안 생성 구현.
[v] Phase 4: 사용자 피드백 대응을 위한 Manual Editor 루프 완성.
[v] Phase 5: MECE Auditor를 통한 최종 문서 품질 검증 자동화.

MegaHub/
├── main.py                 # 시스템 실행 엔트리 포인트
├── src/
│   ├── __init__.py
│   └── utils.py            # 공통 유틸리티 (JSON 정리, 필드 추출 등)
├── AgentRoles/
│   ├── __init__.py
│   ├── Orchestrator.py     # 상태 관리 및 에이전트 조율 (The Brain)
│   ├── ContextAnalyzer.py  # 데이터 분석 및 프로젝트 분류
│   ├── FolderManager.py    # 물리적 파일 정리 (Smart Grouping)
│   ├── ManualArchitect.py  # 인수인계서 초안 작성
│   ├── ManualEditor.py     # 사용자 피드백 반영 수정
│   └── MECEAuditor.py      # 품질 검수
├── UPLOADS/                # 사용자가 업로드한 원본 파일 보관함
└── RESULT/                 # 에이전트가 정리한 프로젝트별 폴더 및 매뉴얼



