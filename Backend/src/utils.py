import re
import os
import json
import pandas as pd
from docx import Document
from pypdf import PdfReader

def clean_json_string(raw_str):
    """설명이 섞여 있어도 { } 구간만 찾아 JSON으로 파싱합니다."""
    try:
        match = re.search(r'\{.*\}', raw_str, re.DOTALL)
        return match.group(0) if match else raw_str.strip()
    except:
        return raw_str.strip()

def extract_field(text, field_name):
    """
    텍스트에서 'Field Name: Value' 형식의 데이터를 추출합니다.
    """
    pattern = rf"{re.escape(field_name)}:\s*(.*?)(?=\n|$)"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def sanitize_filename(filename):
    """
    Bedrock API 규칙에 맞게 파일명/폴더명을 정제합니다.
    (알파벳, 숫자, 공백, 하이픈, 괄호, 대괄호만 허용)
    """
    # 1. 한글 및 기타 특수문자를 제거하거나 안전한 문자로 변경
    # 여기서는 간단하게 한글 등을 제거하고 공백/하이픈/영숫자만 남깁니다.
    clean_name = re.sub(r'[^a-zA-Z0-9\s\-\(\)\[\]]', '', filename)
    
    # 2. 연속된 공백을 하나로 줄임
    clean_name = re.sub(r'\s+', ' ', clean_name).strip()
    
    # 3. 만약 이름이 완전히 비어버리면 기본값 부여
    if not clean_name:
        clean_name = "unnamed_project"
        
    return clean_name



def read_file_content(file_path):
    """
    파일 확장자에 따라 적절한 라이브러리를 사용하여 텍스트 내용을 추출합니다.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        # 1. Word (.docx)
        if ext == '.docx':
            doc = Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        
        # 2. Excel (.xlsx, .xls)
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
            # AI가 구조를 파악하기 쉽게 CSV 형태로 변환하여 반환
            return df.to_csv(index=False)
        
        # 3. PDF (.pdf)
        elif ext == '.pdf':
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        
        # 4. Text 기반 (.txt, .md, .csv, .json 등)
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
                
    except Exception as e:
        return f"(파일 내용 추출 실패: {str(e)})"