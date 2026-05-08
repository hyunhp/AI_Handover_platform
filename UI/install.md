🎨 1. 프론트엔드 (UI) 설치 정리
- UI 폴더로 이동한 후 실행하세요. (방금 발생한 TypeScript 에러 해결 포함)

# 1. 기본 의존성 설치
npm install

# 2. TypeScript 타입 정의 설치 (방금 발생한 에러 해결용)
npm install --save-dev @types/react @types/react-dom @types/node

# 3. 주요 UI 라이브러리 (코드에 사용된 것들)
npm install lucide-react clsx tailwind-merge framer-motion

# 4. Shadcn/UI 및 Radix 관련 (ScrollArea, Button 등에 필요)
npm install @radix-ui/react-scroll-area @radix-ui/react-slot
--------

🐍 2. 백엔드 (Backend) 설치 정리
Backend 폴더로 이동한 후 실행하세요. (Python 3.11 기준)

# 1. FastAPI 및 서버 구동 패키지
pip install fastapi uvicorn python-multipart

# 2. AI 에이전트 및 환경 변수 관련
pip install langchain openai anthropic python-dotenv

# 3. 기타 유틸리티
pip install requests

# 4. PIP install
pip install -r requirements.txt
--------

🖥️ 3. 시스템 및 도구 (EC2/Linux)
서버 자체에 필요한 유틸리티입니다.

# 1. htop 설치 (아까 command not found 떴던 것 해결)
sudo yum install htop  # Amazon Linux 2023 기준
# 또는
sudo amazon-linux-extras install epel -y && sudo yum install htop -y

# 2. Node.js 버전 확인 (18버전 이상 추천)
node -v