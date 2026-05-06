import json
import sys
from AI_Handover_Platform.Backend.src.utils import clean_json_string
from AI_Handover_Platform.Backend.AgentRoles.Orchestrator import orchestrator
sys.stdin.reconfigure(encoding='utf-8', errors='replace')

def main():
    print("\n🚀 Project MegaHub: AI Handover System 🚀")
    print("업무 자료를 분석하여 자동으로 인수인계 폴더를 정리하고 매뉴얼을 작성합니다.")
    
    # 초기 상태 설정
    current_state = json.dumps({"phase": "IDLE", "current_project": None})

    while True:
        user_input = input("\n>> USER: ")
        if user_input.lower() in ['exit', 'quit', '종료']:
            break

        try:
            # 오케스트레이터 호출
            response_raw = orchestrator(query=user_input, state=current_state)
            response_json = json.loads(clean_json_string(response_raw))
            
            print(f"\n>> AGENT: {response_json.get('message')}")
            
            # 상태 업데이트
            if response_json.get('state'):
                current_state = json.dumps(response_json.get('state'))
                print(f"[DEBUG] Current Phase: {response_json['state'].get('phase')}")

        except Exception as e:
            print(f"오류가 발생했습니다: {e}")

if __name__ == "__main__":
    main()