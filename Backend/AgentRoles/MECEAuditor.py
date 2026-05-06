import os
from strands import Agent, tool
import json

AUDITOR_SYSTEM_PROMPT = '''
당신은 인수인계 매뉴얼의 논리성을 검증하는 품질 검수관입니다.
MECE(중복 없고 누락 없는) 원칙에 따라 매뉴얼을 평가하십시오.

[검토 기준]
1. Mutually Exclusive (중복 없음): 동일한 설명이 여러 곳에서 불필요하게 반복되지 않는가?
2. Collectively Exhaustive (누락 없음): 제공된 파일의 핵심 업무 프로세스가 매뉴얼에 빠짐없이 포함되었는가?
3. 근거 확인: 제공된 파일에 없는 내용이 포함되어 있지는 않은가? (할루시네이션 체크)

[응답 형식]
반드시 아래 JSON 형식으로만 응답하십시오.
{
    "is_passed": true | false,
    "feedback": "통과되지 않았다면 구체적으로 어떤 부분이 중복되거나 누락되었는지, 혹은 할루시네이션이 있는지 지적하십시오.",
    "score": 0~100
}
'''
# MegaHub/AgentRoles/MECEAuditor.py
import os
from strands import Agent, tool

MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"

@tool
def mece_audit(project_name: str) -> str:
    # slugify 대신 project_name을 그대로 사용하거나 안전하게 처리
    file_path = os.path.join(MEGAHUB_BASE, "RESULT", project_name, "manual_draft.md")    
    
    if not os.path.exists(file_path):
        return json.dumps({"is_passed": False, "feedback": "검수할 매뉴얼 파일이 존재하지 않습니다."})

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    auditor_agent = Agent(
        system_prompt=AUDITOR_SYSTEM_PROMPT,
        tools=[],
        callback_handler=None
    )
    
    return str(auditor_agent(f"다음 매뉴얼을 검수해줘:\n\n{content}"))