import os
import shutil
import json
import sys
import re
import datetime
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import importlib.util

# 1. 경로 설정 및 환경 구성
MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"
if MEGAHUB_BASE not in sys.path:
    sys.path.append(MEGAHUB_BASE)

BASE_UPLOADS = os.path.join(MEGAHUB_BASE, "UPLOADS")
BASE_RESULT = os.path.join(MEGAHUB_BASE, "RESULT")
from src.utils import clean_json_string

# 💡 [추가] 핵심 의존성 패키지 체크 함수
def check_dependencies():
    required_packages = ["fastapi", "uvicorn", "strands", "langchain", "openai", "dotenv"]
    missing_packages = []
    
    print("\n" + "="*50)
    print("[SYSTEM] 의존성 패키지 정밀 검사 중...")
    
    for pkg in required_packages:
        spec = importlib.util.find_spec(pkg)
        if spec is None:
            missing_packages.append(pkg)
            print(f"❌ [MISSING] {pkg} 이(가) 설치되어 있지 않습니다.")
        else:
            print(f"✅ [OK] {pkg} 발견됨")
            
    if missing_packages:
        print("\n⚠️ 경고: 일부 필수 패키지가 누락되었습니다.")
        print(f"명령어: pip install {' '.join(missing_packages)}")
        print("="*50 + "\n")
        # 중대한 패키지 누락 시 서버 종료를 원하면 아래 주석 해제
        # sys.exit(1)
    else:
        print("[SUCCESS] 모든 필수 패키지가 준비되었습니다.")
        print("="*50 + "\n")

check_dependencies()

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

# 3. API 엔드포인트
@app.post("/api/upload-and-analyze")
async def upload_and_analyze(folderName: str = Form(...), files: list[UploadFile] = File(...)):
    print(f"\n[START] {folderName} 프로젝트 분석 시작...")
    try:
        from AgentRoles.ContextAnalyzer import context_analyze
        from AgentRoles.FolderManager import folder_manage

        # 1. 파일 저장 확인
        mother_dir = os.path.join(BASE_UPLOADS, folderName)
        os.makedirs(mother_dir, exist_ok=True)

        saved_files = []
        for file in files:
            file_location = os.path.join(mother_dir, file.filename)
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_files.append(file.filename)
        print(f"📁 [1/3] 파일 저장 완료: {saved_files}")

        # 2. AI 분석 결과 확인
        query = f"마더 폴더 '{folderName}' 안의 파일들을 분석해서 프로젝트별로 분류해줘. 목록: {saved_files}"
        raw_response = context_analyze(query)
        print(f"🤖 [2/3] AI 원본 응답: {raw_response}") # 💡 이 부분이 비어있는지 확인 필요

        clean_json = clean_json_string(raw_response)
        
        # 3. 폴더 매니저 실행 결과 확인
        print(f"📂 [3/3] FolderManager 실행 중 (JSON: {clean_json})")
        management_report = folder_manage(clean_json, folderName)
        print(f"📝 최종 리포트: {management_report}")

        return {
            "status": "success",
            "analysis_result": json.loads(clean_json),
            "report": management_report
        }
    except Exception as e:
        print(f"❌ [ERROR] 분석 실패: {str(e)}")
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

@app.post("/api/generate-manual")
async def generate_manual(motherFolderName: str = Form(...), projectName: str = Form(...)):
    try:
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        os.makedirs(project_dir, exist_ok=True)

        # 1. 매뉴얼 로드 (기존 로직 유지)
        latest_path, current_version = get_latest_manual_path(project_dir)
        if latest_path and os.path.exists(latest_path):
            with open(latest_path, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            from AgentRoles.ManualArchitect import manual_architect
            manual_architect(motherFolderName, projectName) 
            new_path = os.path.join(project_dir, "manual_draft.md")
            content = open(new_path, "r", encoding="utf-8").read() if os.path.exists(new_path) else "# 생성 실패"

        # 2. 사이드바 '원본 자료'용: UPLOADS 폴더 전체 스캔 (업데이트됨)
        mother_upload_path = os.path.join(BASE_UPLOADS, motherFolderName)
        mother_all_files = os.listdir(mother_upload_path) if os.path.exists(mother_upload_path) else []

        # 3. 현재 주제의 참고문서 및 버전 리스트
        ref_dir = os.path.join(project_dir, "참고문서")
        theme_raw_files = os.listdir(ref_dir) if os.path.exists(ref_dir) else []
        version_list = sorted([f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")], reverse=True)
        
        # 예시: 프로젝트 명에 '마케팅'이 포함되면 MARKETING으로 분류하는 로직 (나중에 AI가 판단하게 변경 가능)
        detected_type = "OPERATION"
        if "마케팅" in projectName: detected_type = "MARKETING"
        elif "영업" in projectName: detected_type = "SALES"
        elif "개발" in projectName: detected_type = "PROJECT"

        return {
            "status": "success", 
            "content": content, 
            "work_type": detected_type, # 💡 성격 전달
            "raw_files": theme_raw_files,
            "mother_all_files": mother_all_files,
            "version_list": version_list,
            "new_state": "READY"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/chat-edit")
async def chat_edit(motherFolderName: str = Form(...), projectName: str = Form(...), message: str = Form(...), state: str = Form(...)):
    try:
        from AgentRoles.ManualEditor import manual_editor
        edit_status_msg = manual_editor(motherFolderName, projectName, message)
        
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        base_path = os.path.join(project_dir, "manual_draft.md")
        
        with open(base_path, "r", encoding="utf-8") as f:
            updated_content = f.read()

        _, current_version = get_latest_manual_path(project_dir)
        next_version = current_version + 1
        new_filename = f"manual_draft_{next_version}.md"
        with open(os.path.join(project_dir, new_filename), "w", encoding="utf-8") as f:
            f.write(updated_content)

        # 💡 [핵심] 채팅 수정 후 전체 버전 리스트를 다시 읽어서 반환합니다.
        version_list = sorted([f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")], reverse=True)

        return {
            "status": "success",
            "agent_response": edit_status_msg,
            "updated_content": updated_content,
            "new_version_name": new_filename,
            "version_list": version_list, # 프론트엔드 히스토리 갱신용
            "new_state": state
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
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

# MegaHub/server.py

@app.get("/api/get-archive")
async def get_archive():
    """
    상위 프로젝트가 아닌, 실제 인수인계서가 담긴 
    모든 '업무 주제(하위 프로젝트)' 목록을 최상위 카드로 노출합니다.
    """
    try:
        if not os.path.exists(BASE_RESULT):
            os.makedirs(BASE_RESULT, exist_ok=True)
            return {"status": "success", "archive": []}

        archive_list = []
        
        # 1. 마더 프로젝트 폴더 탐색 (예: '인사팀 업무', '마케팅 프로젝트')
        with os.scandir(BASE_RESULT) as mother_entries:
            for mother_entry in mother_entries:
                if mother_entry.is_dir():
                    mother_name = mother_entry.name
                    mother_path = mother_entry.path
                    
                    # 2. 마더 프로젝트 내부의 실제 '업무 주제' 폴더 탐색
                    with os.scandir(mother_path) as theme_entries:
                        for theme_entry in theme_entries:
                            # 시스템 폴더나 불필요한 파일 제외
                            if theme_entry.is_dir() and not theme_entry.name.startswith('.'):
                                theme_name = theme_entry.name
                                theme_path = theme_entry.path
                                
                                # 통계 정보 계산 (참고문서 개수)
                                ref_doc_path = os.path.join(theme_path, "참고문서")
                                file_count = len(os.listdir(ref_doc_path)) if os.path.exists(ref_doc_path) else 0
                                
                                stats = theme_entry.stat()
                                created_date = datetime.datetime.fromtimestamp(stats.st_ctime).strftime('%m. %d.')
                                
                                # 하위 업무 주제를 아카이브의 개별 단위로 설정
                                archive_list.append({
                                    "name": theme_name,          # 업무 주제명 (카드 제목)
                                    "motherName": mother_name,   # 소속 마더 프로젝트명 (태그)
                                    "fileCount": file_count,
                                    "date": created_date,
                                    "author": "나의 업무",
                                    "color": "indigo" if "인계" in theme_name else "orange"
                                })
        
        # 최신 생성순 정렬
        archive_list.sort(key=lambda x: x['date'], reverse=True)
        
        return {"status": "success", "archive": archive_list}
    except Exception as e:
        print(f"[ERROR] get_archive 실패: {str(e)}")
        return {"status": "error", "message": str(e)}

# MegaHub/server.py
@app.post("/api/save-manual-overwrite")
async def save_manual_overwrite(
    motherFolderName: str = Form(...), 
    projectName: str = Form(...), 
    fileName: str = Form(...),
    content: str = Form(...)
):
    try:
        project_dir = os.path.join(BASE_RESULT, motherFolderName, projectName)
        file_path = os.path.join(project_dir, fileName)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        # 💡 [핵심] 저장 후 전체 버전 리스트를 다시 읽어서 반환합니다.
        version_list = sorted([f for f in os.listdir(project_dir) if f.startswith("manual_draft") and f.endswith(".md")], reverse=True)
            
        return {
            "status": "success", 
            "message": f"{fileName}에 저장되었습니다.",
            "version_list": version_list  # 프론트엔드 히스토리 갱신용
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# MegaHub/server.py에 추가

@app.post("/api/delete-project")
async def delete_project(motherFolderName: str = Form(...), projectName: str = Form(...)):
    """특정 업무 주제(하위 프로젝트) 폴더를 삭제합니다."""
    try:
        # 실제 경로: RESULT / 마더폴더 / 주제폴더
        project_path = os.path.join(BASE_RESULT, motherFolderName, projectName)
        
        if os.path.exists(project_path):
            shutil.rmtree(project_path) # 폴더 및 내부 파일 전체 삭제
            
            # (선택 사항) 만약 마더 폴더가 비게 된다면 마더 폴더도 삭제할 수 있습니다.
            mother_path = os.path.join(BASE_RESULT, motherFolderName)
            if not os.listdir(mother_path): # 비어있다면
                os.rmdir(mother_path)
                
            return {"status": "success", "message": f"'{projectName}' 주제가 삭제되었습니다."}
        else:
            return {"status": "error", "message": "삭제할 폴더를 찾을 수 없습니다."}
            
    except Exception as e:
        print(f"[ERROR] delete_project 실패: {str(e)}")
        return {"status": "error", "message": str(e)}