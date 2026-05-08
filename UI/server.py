import os
import shutil
import json
import sys
import re
import datetime
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# 1. 경로 설정 및 환경 구성
MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"
if MEGAHUB_BASE not in sys.path:
    sys.path.append(MEGAHUB_BASE)

BASE_UPLOADS = os.path.join(MEGAHUB_BASE, "UPLOADS")
BASE_RESULT = os.path.join(MEGAHUB_BASE, "RESULT")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 유틸리티 함수
def get_latest_manual_path(project_dir):
    """프로젝트 폴더 내에서 가장 최신 버전의 매뉴얼 경로와 번호를 반환합니다."""
    if not os.path.exists(project_dir):
        return None, 0
        
    files = [f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")]
    if not files:
        return None, 0

    latest_version = 0
    latest_file = "manual_draft.md"

    for f in files:
        match = re.search(r"manual_draft_(\d+)\.md", f)
        if match:
            version = int(match.group(1))
            if version > latest_version:
                latest_version = version
                latest_file = f
        elif f == "manual_draft.md" and latest_version == 0:
            latest_file = f
            
    return os.path.join(project_dir, latest_file), latest_version

from src.utils import clean_json_string

# 3. API 엔드포인트

@app.post("/api/upload-and-analyze")
async def upload_and_analyze(folderName: str = Form(...), files: list[UploadFile] = File(...)):
    """파일을 업로드하고 프로젝트별로 분류를 실행합니다."""
    try:
        from AgentRoles.ContextAnalyzer import context_analyze
        from AgentRoles.FolderManager import folder_manage

        mother_dir = os.path.join(BASE_UPLOADS, folderName)
        os.makedirs(mother_dir, exist_ok=True)

        for file in files:
            file_location = os.path.join(mother_dir, file.filename)
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        
        file_list = os.listdir(mother_dir)
        query = f"마더 폴더 '{folderName}' 안의 파일들을 분석해서 프로젝트별로 분류해줘. 목록: {file_list}"
        
        raw_response = context_analyze(query)
        clean_json = clean_json_string(raw_response)
        management_report = folder_manage(clean_json, folderName)

        return {
            "status": "success",
            "analysis_result": json.loads(clean_json),
            "report": management_report
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/get-archive")
async def get_archive():
    """저장된 마더 프로젝트 목록을 가져옵니다."""
    try:
        if not os.path.exists(BASE_RESULT):
            os.makedirs(BASE_RESULT, exist_ok=True)
            return {"status": "success", "archive": []}

        archive_list = []
        # os.scandir를 사용하여 속도 최적화
        with os.scandir(BASE_RESULT) as entries:
            for entry in entries:
                if entry.is_dir():
                    folder_path = entry.path
                    sub_projects = [sp for sp in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, sp))]
                    stats = entry.stat()
                    created_date = datetime.datetime.fromtimestamp(stats.st_ctime).strftime('%m. %d.')
                    
                    archive_list.append({
                        "name": entry.name,
                        "subProjectsCount": len(sub_projects),
                        "date": created_date,
                        "author": "나의 프로젝트",
                        "color": "blue" if len(sub_projects) > 1 else "orange"
                    })
        
        archive_list.sort(key=lambda x: x['date'], reverse=True)
        return {"status": "success", "archive": archive_list}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/load-project-details")
async def load_project_details(motherFolderName: str = Form(...)):
    """특정 마더 프로젝트 클릭 시 내부 하위 프로젝트 구조를 로드합니다."""
    try:
        mother_path = os.path.join(BASE_RESULT, motherFolderName)
        if not os.path.exists(mother_path):
            return {"status": "error", "message": "폴더를 찾을 수 없습니다."}

        sub_dirs = [d for d in os.listdir(mother_path) if os.path.isdir(os.path.join(mother_path, d))]
        analysis_result = {}
        for sub in sub_dirs:
            ref_doc_path = os.path.join(mother_path, sub, "참고문서")
            files = os.listdir(ref_doc_path) if os.path.exists(ref_doc_path) else []
            analysis_result[sub] = files
            
        return {
            "status": "success", 
            "motherFolderName": motherFolderName,
            "analysis_result": analysis_result
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
# MegaHub/server.py 수정 부분

@app.post("/api/generate-manual")
async def generate_manual(motherFolderName: str = Form(...), projectName: str = Form(...)):
    try:
        # 1. 경로 설정 (RESULT/마더폴더/하위프로젝트)
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        os.makedirs(project_dir, exist_ok=True)

        # 2. 기존 파일(최신 버전)이 있는지 확인
        latest_path, current_version = get_latest_manual_path(project_dir)
        
        # 💡 [핵심 로직] 파일이 실제로 존재하는지 엄격히 체크
        if latest_path and os.path.exists(latest_path):
            # 파일이 있으면: 즉시 읽어서 반환 (0.1초 소요)
            print(f"[DEBUG] '{projectName}' 기존 파일 발견. AI 호출 없이 즉시 로드합니다.")
            with open(latest_path, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            # 💡 파일이 없으면: AI 에이전트 실행하여 새로 생성 (시간 소요)
            print(f"[DEBUG] '{projectName}' 매뉴얼이 없습니다. AI 에이전트를 가동합니다.")
            
            from AgentRoles.ManualArchitect import manual_architect
            # AI가 '참고문서' 폴더 내의 파일을 분석하여 'manual_draft.md'를 생성함
            manual_architect(motherFolderName, projectName) 
            
            # 생성된 파일을 다시 확인
            new_path = os.path.join(project_dir, "manual_draft.md")
            if os.path.exists(new_path):
                with open(new_path, "r", encoding="utf-8") as f:
                    content = f.read()
            else:
                content = "# 매뉴얼 생성 실패\nAI가 분석할 자료를 찾지 못했습니다."

        # 3. 사이드바용 정보 (참고문서 목록 및 버전 리스트) 스캔
        ref_dir = os.path.join(project_dir, "참고문서")
        raw_files = [f for f in os.listdir(ref_dir) if os.path.isfile(os.path.join(ref_dir, f))] if os.path.exists(ref_dir) else []
        all_manuals = sorted([f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")], reverse=True)

        return {
            "status": "success", 
            "content": content, 
            "raw_files": raw_files,
            "version_list": all_manuals
        }
    except Exception as e:
        print(f"[CRITICAL ERROR] generate_manual 실패: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/api/chat-edit")
async def chat_edit(
    motherFolderName: str = Form(...), 
    projectName: str = Form(...), 
    message: str = Form(...), 
    state: str = Form(...)
):
    """Orchestrator를 우회하고 ManualEditor를 직접 사용하여 매뉴얼을 즉시 수정합니다."""
    try:
        # 1. ManualEditor 도구 직접 임포트 및 실행
        from AgentRoles.ManualEditor import manual_editor
        
        # manual_editor 도구가 내부적으로 manual_draft.md를 읽고 수정하여 다시 저장함
        # 리턴값: "수정이 완료되었습니다" 등의 안내 메시지
        edit_status_msg = manual_editor(motherFolderName, projectName, message)
        
        # 만약 도구 실행 중 오류 문구가 반환되었다면 에러 처리
        if "오류" in edit_status_msg:
            return {"status": "error", "message": edit_status_msg}

        # 2. 수정된 결과물 경로 설정
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        base_path = os.path.join(project_dir, "manual_draft.md")
        
        if not os.path.exists(base_path):
            return {"status": "error", "message": "수정된 파일을 찾을 수 없습니다."}

        # 3. 수정된 내용 읽기
        with open(base_path, "r", encoding="utf-8") as f:
            updated_content = f.read()

        # 4. 버전 넘버링 로직 실행
        _, current_version = get_latest_manual_path(project_dir)
        next_version = current_version + 1
        new_filename = f"manual_draft_{next_version}.md"
        new_path = os.path.join(project_dir, new_filename)

        # 5. 넘버링된 새 버전 파일로 복사 저장
        with open(new_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        return {
            "status": "success",
            "agent_response": edit_status_msg, # "수정이 완료되었습니다" 메시지
            "updated_content": updated_content, # 가운데 화면에 표시될 수정된 내용
            "new_version_name": new_filename,   # 왼쪽 탭에 추가될 파일명
            "new_state": state # 직접 수정 시에는 복잡한 상태 관리가 필요 없으므로 기존 상태 유지
        }
        
    except Exception as e:
        print(f"[ERROR] chat_edit 실패: {str(e)}")
        return {"status": "error", "message": str(e)}
# MegaHub/server.py 에 추가

@app.post("/api/save-manual")
async def save_manual(
    motherFolderName: str = Form(...), 
    projectName: str = Form(...), 
    content: str = Form(...)
):
    try:
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        os.makedirs(project_dir, exist_ok=True)

        # 1. 현재 폴더에서 가장 높은 버전 번호 찾기
        _, current_version = get_latest_manual_path(project_dir)
        next_version = current_version + 1
        
        # 2. 새 파일명 결정 (예: manual_draft_1.md)
        new_filename = f"manual_draft_{next_version}.md"
        new_path = os.path.join(project_dir, new_filename)

        # 3. 파일 저장
        with open(new_path, "w", encoding="utf-8") as f:
            f.write(content)

        # 4. 전체 버전 리스트 다시 스캔 (최신순)
        all_manuals = sorted([f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")], reverse=True)

        return {
            "status": "success",
            "new_version_name": new_filename,
            "version_list": all_manuals
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# MegaHub/server.py 에 추가 및 수정

@app.post("/api/get-version-content")
async def get_version_content(
    motherFolderName: str = Form(...), 
    projectName: str = Form(...), 
    fileName: str = Form(...)
):
    """선택한 버전 파일의 내용을 읽어옵니다."""
    try:
        file_path = os.path.join(BASE_RESULT, motherFolderName, projectName, fileName)
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return {"status": "success", "content": content}
        return {"status": "error", "message": "파일을 찾을 수 없습니다."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 저장하기 버튼: '덮어쓰기' 방식으로 변경 제안 반영
@app.post("/api/save-manual-overwrite")
async def save_manual_overwrite(
    motherFolderName: str = Form(...), 
    projectName: str = Form(...), 
    fileName: str = Form(...), # 💡 현재 에디터에 열려있는 파일명
    content: str = Form(...)
):
    """현재 작업 중인 파일에 내용을 덮어씌웁니다."""
    try:
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        file_path = os.path.join(project_dir, fileName)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"status": "success", "message": f"{fileName}에 저장되었습니다."}
    except Exception as e:
        return {"status": "error", "message": str(e)}