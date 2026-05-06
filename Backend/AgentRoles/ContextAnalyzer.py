import os
import json
import re
from strands import Agent, tool

ANALYZER_SYSTEM_PROMPT = '''
당신은 'Project MegaHub'의 데이터 분석 전문가입니다.
당신의 임무는 업로드된 파일들의 목록을 보고, 맥락(Context)이 같은 파일들끼리 프로젝트 단위로 그룹화하는 것입니다.

[분류 원칙]
1. 파일명과 내용을 참고하여 동일한 업무나 프로젝트에 속하는지 판단하십시오.
2. 프로젝트 명은 직관적이고 명확하게 생성하십시오 
3. 하나의 파일이 여러 프로젝트에 중복으로 포함될 수 있습니다 (MECE하지 않게 처리 가능).

[분류 규칙 - 필독]
1. 파일의 성격이 여러 프로젝트에 걸쳐 있다면, 반드시 '모든' 해당 프로젝트 리스트에 포함시키십시오.
2. 예를 들어 규정, 내규 등 공통적으로 검토해야 되는 파일은 'A 프로젝트'와 'B 프로젝트' 모두에 들어갈 수 있습니다.
3. 절대 MECE(중복 없음)하게 나누려고 애쓰지 마십시오. 사용자는 모든 폴더에서 필요한 파일을 다 보길 원합니다.

[응답 형식]
반드시 아래와 같은 순수 JSON 형식으로만 응답하십시오.
{
    "프로젝트명1": ["파일명1", "파일명2"],
    "프로젝트명2": ["파일명2", "파일명3"]
}
'''

# 1. 에이전트 생성
analyzer_agent = Agent(
    system_prompt=ANALYZER_SYSTEM_PROMPT,
    tools=[],
    callback_handler=None
)
# MegaHub/AgentRoles/ContextAnalyzer.py

@tool
def context_analyze(query: str) -> str:
    print(f"\n[TOOL DEBUG] ContextAnalyzer 실행됨. 입력 쿼리: {query}")
    # ... 에이전트 생성 생략 ...
    try:
        response = analyzer_agent(query)
        res_text = str(response).strip()
        print(f"[TOOL DEBUG] 에이전트 원본 출력: {res_text}")
        
        # JSON 추출 시도 전후 로그
        if "{" in res_text:
            start_idx = res_text.find("{")
            end_idx = res_text.rfind("}") + 1
            res_text = res_text[start_idx:end_idx]
            print(f"[TOOL DEBUG] JSON 추출 결과: {res_text}")
        
        return res_text
    except Exception as e:
        print(f"[TOOL ERROR] ContextAnalyzer 에러: {str(e)}")
        return json.dumps({"Error": str(e)})