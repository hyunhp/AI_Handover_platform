# MegaHub/AgentRoles/FolderManager.py
import os
import shutil
import json
from strands import tool

@tool
def folder_manage(classification_result: str, mother_folder: str) -> str:
    """
    AI의 분류 결과(JSON)를 받아 UPLOADS/{mother_folder}의 파일들을
    RESULT/{mother_folder}/프로젝트명 폴더로 복사하여 정리합니다.
    """
    try:
        # 1. JSON 정제 및 파싱
        res_text = classification_result.strip()
        if "{" in res_text:
            res_text = res_text[res_text.find("{"):res_text.rfind("}")+1]
        mapping = json.loads(res_text)

        # 2. 경로 설정 (반드시 함수 내부에서 수행)
        # 모든 파일의 기준점이 되는 절대 경로
        MEGAHUB_BASE = "/home/ec2-user/AI_Handover_Platform/Backend"
        
        # 원본 파일이 있는 곳: UPLOADS/마더폴더
        upload_source_dir = os.path.join(MEGAHUB_BASE, "UPLOADS", mother_folder)
        # 결과가 저장될 곳: RESULT/마더폴더
        base_result_dir = os.path.join(MEGAHUB_BASE, "RESULT", mother_folder)

        # 원본 폴더가 실제로 존재하는지 체크
        if not os.path.exists(upload_source_dir):
            return f"[FAIL] 원본 폴더를 찾을 수 없습니다: {upload_source_dir}"

        report = []
        
        # 3. 프로젝트별 분류 및 파일 복사 시작
        for project_name, file_list in mapping.items():
            # 타겟 폴더 생성: RESULT/마더폴더/프로젝트명/참고문서
            project_path = os.path.join(base_result_dir, project_name, "참고문서")
            os.makedirs(project_path, exist_ok=True)
            
            success_count = 0 
            
            for file_name in file_list:
                # 개별 파일의 절대 경로 생성
                src_path = os.path.join(upload_source_dir, file_name).strip()
                dst_path = os.path.join(project_path, file_name)
                
                if os.path.exists(src_path):
                    shutil.copy2(src_path, dst_path)
                    success_count += 1
                    print(f"   ㄴ [SUCCESS] '{project_name}' 폴더로 복사 완료: {file_name}", flush=True)
                else:
                    print(f"   ㄴ [FAIL] 파일을 찾을 수 없음: {src_path}", flush=True)
            
            report.append(f" - '{project_name}': {success_count}개 파일 복사 완료")

        return f"✅ [{mother_folder}] 프로젝트 정리 결과:\n" + "\n".join(report)

    except Exception as e:
        # 에러 발생 시 로그 출력
        print(f"[Folder Manager Error] {str(e)}", flush=True)
        return f"[Folder Manager Error] {str(e)}"