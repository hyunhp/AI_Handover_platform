from typing import Any
import json
from strands import Agent, tool
from AgentRoles.FolderManager import folder_manage # 추가
from AgentRoles.ContextAnalyzer import context_analyze
from AgentRoles.ManualArchitect import manual_architect # 추가
from AgentRoles.ManualEditor import manual_editor # 추가
from AgentRoles.MECEAuditor import mece_audit # 추가

ORCHESTRATOR_SYSTEM_PROMPT = '''
당신은 'Project MegaHub: AI 인수인계 시스템'의 총괄 설계자입니다.
사용자의 업무 로그를 분석하여 프로젝트별로 정리하고, 전문적인 매뉴얼을 생성하는 과정을 관리합니다.

## 1. 상태 및 도구 규칙 (State Machine)
- [IDLE]: 초기 상태. 사용자가 파일 업로드나 분석을 요청하면 'context_analyze'를 호출하고 [ANALYZING]으로 변경.
- [ANALYZING]: 업무 데이터에서 맥락을 파악하고 프로젝트를 분류합니다. 분류 완료 시 [GROUPING]으로 변경.
- [GROUPING]: 'folder_manage' 도구를 사용하여 실제 파일을 프로젝트 폴더로 이동합니다. 
  분류 결과(JSON)를 folder_manage에 전달하십시오. 완료 시 [DRAFTING]으로 변경.
- [DRAFTING]: 사용자가 선택한 프로젝트에 대해 'manual_architect'를 호출하여 초안을 생성합니다.
  - 매뉴얼 작성이 완료되면 파일 경로를 안내하고, 'mece_audit'을 호출하여 [AUDITING] 단계로 넘어갑니다.
- [AUDITING]: 
  - 검수 결과 'is_passed'가 true이면 [AWAITING_REVIEW]로 변경하여 사용자에게 공개합니다.
  - false이면 피드백 내용을 바탕으로 'manual_editor'를 호출하여 자동 수정한 뒤 다시 검토합니다.
- [AWAITING_REVIEW]: 사용자 검토 단계입니다.
  - 사용자가 "좋아/진행해/확인" 등 긍정적인 반응을 보이면 상태를 [FINISH]로 변경하고 종료 인사를 하십시오.
  - 사용자가 특정 부분의 수정을 요청하면 'manual_editor'를 호출하고 상태를 [REFINING]으로 변경하십시오.
  - 수정이 완료되면 다시 [AWAITING_REVIEW]로 돌아와 재검토를 요청하십시오.
- [REFINING]: 수정이 완료되면 다시 [AWAITING_REVIEW]로 돌아가 검토를 요청합니다.
- [END]: 모든 작업이 완료되어 다른 항목에 대해서 인수인계 문서 작성을 준비하시오.

## 2. 응답 제약 (Constraints)
- 반드시 순수 JSON으로만 응답하며, 마크다운 코드 블록(```json)을 금지합니다.
- JSON 외의 어떠한 설명이나 대화도 추가하지 마십시오.
- 'message' 필드는 사용자와의 유일한 소통 창구입니다.

## 3. 응답 형식
반드시 아래 JSON 스키마로만 응답하십시오.
{
    "message": "사용자에게 전달할 안내 문구",
    "state": {
        "phase": "IDLE | ANALYZING | GROUPING | DRAFTING | AWAITING_REVIEW | REFINING",
        "current_project": "현재 작업 중인 프로젝트명",
        "folder_path": "생성된 폴더 경로",
        "draft_path": "생성된 매뉴얼 경로"
    }
}
'''

# 현재는 뼈대만 잡기 위해 tools는 비워둡니다. 이후 구현하며 채울 예정입니다.
orchestrator_agent = Agent(
    system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
    tools=[folder_manage, context_analyze, 
    manual_architect, manual_editor, mece_audit], 
    callback_handler=None
)

@tool
def orchestrator(query: str, state: Any) -> str:
    if state is None or state == "" or state == "IDLE":
        state_dict = {"phase": "IDLE", "current_project": None}
    else:
        state_dict = json.loads(state)

    formatted_query = f'''
        [System Context]
        Current Phase: {state_dict.get('phase')}
        Current Project: {state_dict.get('current_project')}
        
        [User Input]
        {query}
    '''
    
    try:
        print(f"\n[DEBUG] 현재 단계: {state_dict.get('phase')}")
        agent_response = orchestrator_agent(formatted_query)
        response_str = str(agent_response)

        # DEBUGGING 
        # print(f"\n>>[DEBUG] MESSAGE: {agent_response}")        
        return response_str

    except Exception as e:
        return json.dumps({"message": f"Error: {str(e)}", "state": state_dict})