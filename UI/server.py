# MegaHub/server.py
import os
import shutil
import json
import sys
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# 기존 프로젝트 경로 추가
MEGAHUB_PATH = "/home/ec2-user/AI_Handover_Platform/Backend"
if MEGAHUB_PATH not in sys.path:
    sys.path.append(MEGAHUB_PATH)

from AgentRoles.ContextAnalyzer import context_analyze
from AgentRoles.FolderManager import folder_manage
from src.utils import clean_json_string # JSON 클리닝 유틸리티 사용

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# 💡 모든 경로를 MegaHub 기준으로 통일합니다.
MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"
BASE_UPLOADS = os.path.join(MEGAHUB_BASE, "UPLOADS")
BASE_RESULT = os.path.join(MEGAHUB_BASE, "RESULT")

@app.post("/api/upload-and-analyze")
async def upload_and_analyze(
    folderName: str = Form(...),
    files: list[UploadFile] = File(...)
):
    try:
        # 1. 파일을 MegaHub/UPLOADS/[folderName]에 저장하도록 수정
        mother_dir = os.path.join(BASE_UPLOADS, folderName)
        os.makedirs(mother_dir, exist_ok=True)
        
        print(f"[DEBUG 1] 업로드 시작: {mother_dir}", flush=True)

        for file in files:
            file_location = os.path.join(mother_dir, file.filename)
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        
        print(f"[DEBUG 2] 실제 파일 저장 경로 확인: {os.path.abspath(mother_dir)}", flush=True)

        # 2. 분석을 위해 파일 리스트 수집
        file_list = os.listdir(mother_dir)
        query = f"마더 폴더 '{folderName}' 안의 파일들을 분석해서 프로젝트별로 분류해줘. 목록: {file_list}"
        
        # 3. AI 분석 실행
        raw_response = context_analyze(query)
        clean_json = clean_json_string(raw_response)
        
        # 4. FolderManager 실행 (절대 경로를 사용하므로 이제 파일이 보일 겁니다)
        management_report = folder_manage(clean_json, folderName)

        return {
            "status": "success",
            "analysis_result": json.loads(clean_json),
            "report": management_report
        }
    except Exception as e:
        print(f"[ERROR] {str(e)}", flush=True)
        return {"status": "e    rror", "message": str(e)}
    
# MegaHub/server.py에 추가

from AgentRoles.ManualArchitect import manual_architect
from AgentRoles.ManualEditor import manual_editor
from AgentRoles.Orchestrator import orchestrator

@app.post("/api/generate-manual")
async def generate_manual(
    motherFolderName: str = Form(...), # 👈 추가
    projectName: str = Form(...)):
    try:
        # 도구 호출 시 인자 두 개 전달
        manual_architect(motherFolderName, projectName) 
        path = os.path.join(MEGAHUB_BASE, "RESULT", motherFolderName, projectName, "manual_draft.md")
        with open(path, "r", encoding="utf-8") as f: content = f.read()
        return {"status": "success", "content": content}
    except Exception as e: return {"status": "error", "message": str(e)}

@app.post("/api/chat-edit")
async def chat_edit(
    motherFolderName: str = Form(...), # 👈 추가
    projectName: str = Form(...), 
    message: str = Form(...), 
    state: str = Form(...)
):
    try:
        print(f"[DEBUG] 💬 채팅 수정 요청: {message}", flush=True)
        enhanced_query = f"[MotherFolder: {motherFolderName}] {message}"
        response_raw = orchestrator(enhanced_query, state)        

        # 1. Orchestrator 호출
        print(f"[DEBUG] 🤖 Orchestrator 원본 응답: {response_raw}", flush=True)
        
        # 2. JSON 클리닝 (가장 빈번한 에러 원인)
        
        clean_json = clean_json_string(response_raw)
        response_json = json.loads(clean_json)

        # 3. 수정된 매뉴얼 파일 읽기
        draft_path = os.path.join(MEGAHUB_BASE, "RESULT", projectName, "manual_draft.md")
        current_content = ""
        if os.path.exists(draft_path):
            with open(draft_path, "r", encoding="utf-8") as f:
                current_content = f.read()
        else:
            print(f"[WARNING] 수정된 파일을 찾을 수 없음: {draft_path}", flush=True)

        return {
            "agent_response": response_json.get("message"),
            "new_state": json.dumps(response_json.get("state")),
            "updated_content": current_content
        }
    except Exception as e:
        print(f"[CRITICAL ERROR] {str(e)}", flush=True)
        return {"status": "error", "message": str(e)}