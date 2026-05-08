import os
import re # 정규표현식 추가
from strands import Agent, tool

EDITOR_SYSTEM_PROMPT = '''
당신은 인수인계 매뉴얼 전문 편집자입니다.
기존 매뉴얼 내용과 사용자의 수정 요청사항을 분석하여, 내용을 보강하거나 다듬는 역할을 수행합니다.

[수정 원칙]
1. 기존 매뉴얼의 '업무 매뉴얼' 표준 구조를 유지하십시오.
2. 사용자가 요청한 부분(예: 특정 섹션의 디테일 보강)을 중점적으로 업데이트하십시오.
3. 전체적인 톤앤매너를 일관되게 유지하며, 가독성을 높이기 위해 불필요한 중복은 제거하십시오.
4. 수정이 완료된 전체 마크다운 내용을 반환하십시오.
'''

@tool
def manual_editor(mother_folder: str, project_name: str, user_feedback: str) -> str:
    MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"
    project_dir = os.path.join(MEGAHUB_BASE, "RESULT", mother_folder, project_name)
    
    if not os.path.exists(project_dir):
        return f"오류: 프로젝트 폴더를 찾을 수 없습니다. (경로: {project_dir})"

    # 1. 💡 최신 파일 찾기 로직 추가
    files = [f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")]
    
    if not files:
        return "오류: 수정할 매뉴얼 파일이 존재하지 않습니다."

    # 숫자 넘버링을 확인하여 가장 높은 버전 찾기
    latest_file = "manual_draft.md"
    max_ver = 0
    for f in files:
        match = re.search(r"manual_draft_(\d+)\.md", f)
        if match:
            ver = int(match.group(1))
            if ver > max_ver:
                max_ver = ver
                latest_file = f
    
    target_path = os.path.join(project_dir, latest_file)
    print(f"[DEBUG] 편집 대상 파일: {latest_file}")

    # 2. 최신 파일 내용 읽기
    with open(target_path, "r", encoding="utf-8") as f:
        existing_content = f.read()

    # 3. 에이전트 가동
    editor_agent = Agent(
        system_prompt=EDITOR_SYSTEM_PROMPT,
        tools=[],
        callback_handler=None
    )
    
    prompt = f"""
    [참고할 최신 매뉴얼 내용]
    {existing_content}

    [사용자 수정 요청]
    {user_feedback}

    위 요청사항을 반영하여 매뉴얼 전체를 업데이트해주세요.
    """
    
    try:
        updated_content = editor_agent(prompt)
        
        # 4. 수정된 내용은 기본 manual_draft.md에 덮어쓰기 
        # (이후 server.py에서 이를 다시 넘버링하여 복사본을 만듭니다)
        base_path = os.path.join(project_dir, "manual_draft.md")
        with open(base_path, "w", encoding="utf-8") as f:
            f.write(str(updated_content))
            
        return f"'{project_name}' 매뉴얼 최신본({latest_file})을 기반으로 수정이 완료되었습니다!"
    except Exception as e:
        return f"매뉴얼 수정 중 오류 발생: {str(e)}"