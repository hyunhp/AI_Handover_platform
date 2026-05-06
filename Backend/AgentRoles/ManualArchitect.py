import os
import json
from strands import Agent, tool
from AI_Handover_Platform.Backend.src.utils import read_file_content

# 기존 시스템 프롬프트 유지
ARCHITECT_SYSTEM_PROMPT = '''
당신은 기업의 인수인계 전문 컨설턴트입니다. 
제공된 파일들을 분석하여 다음 '업무 매뉴얼' 표준 구조에 따라 전문적인 인수인계서를 작성하십시오.

[중요 규칙: 근거 중심 작성]
1. 반드시 제공된 '참고 파일 목록'과 그 내용에 기반해서만 작성하십시오.
2. 파일에 없는 내용을 임의로 지어내거나(Hallucination), 일반적인 지식을 섞지 마십시오.
3. 정보가 부족한 섹션은 지어내지 말고 "해당 자료 없음" 혹은 "추후 업데이트 필요"라고 명시하십시오.

[구조]
1. 업무 운영 및 보안 원칙
2. 주기별 업무 목록
3. 표준 실무 가이드 (Why, Where, How, Detail)
4. 검증 및 효율화 도구 (체크리스트)
5. 예외 상황 및 담당자 매핑
6. [참고 자료] (참고한 파일명 목록)

[작성 원칙]
- 신입사원이 처음 보고도 업무를 수행할 수 있을 만큼 구체적이어야 합니다.
- 파일 내용을 최대한 활용하여 실질적인 가이드를 제공하십시오.
- 한국어로 작성하며, 전문적이고 친절한 톤을 유지하십시오.
'''
# MegaHub/AgentRoles/ManualArchitect.py
import os
import json
from strands import Agent, tool
from AI_Handover_Platform.Backend.src.utils import read_file_content

# MegaHub/AgentRoles/ManualArchitect.py 수정
@tool
def manual_architect(mother_folder: str, project_name: str) -> str:
    # 👈 두 계층의 경로로 수정
    MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"
    project_dir = os.path.join(MEGAHUB_BASE, "RESULT", mother_folder, project_name)
    reference_dir = os.path.join(project_dir, "참고문서")
    output_path = os.path.join(project_dir, "manual_draft.md")
    
    if not os.path.exists(reference_dir):
        return f"오류: '{project_name}' 폴더 내 참고문서를 찾을 수 없습니다. (경로: {reference_dir})"
    file_list = os.listdir(reference_dir)

    # 2. 내부 도구: 파일 읽기 기능
    @tool
    def fetch_document_content(filename: str) -> str:
        target_path = os.path.join(reference_dir, filename)
        if not os.path.exists(target_path):
            return f"오류: '{filename}' 파일을 찾을 수 없습니다."
        return read_file_content(target_path)

    # 3. 에이전트 가동
    architect_agent = Agent(
        system_prompt=ARCHITECT_SYSTEM_PROMPT,
        tools=[fetch_document_content],
        callback_handler=None
    )
    
    prompt = f"프로젝트 '{project_name}'의 파일 목록 {file_list}을 확인하고 매뉴얼 초안을 마크다운 형식으로 작성해줘."
    
    try:
        draft = architect_agent(prompt)
        os.makedirs(project_dir, exist_ok=True) # 결과 폴더 확인
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(str(draft))
        return str(draft) # 화면에 바로 보여주기 위해 내용을 반환
    except Exception as e:
        return f"에러 발생: {str(e)}"