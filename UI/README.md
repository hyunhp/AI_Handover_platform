  # AI Handover Platform UI

  This is a code bundle for AI Handover Platform UI. The original project is available at https://www.figma.com/design/sdh2SL30ZtZMIbgpzewVZ2/AI-Handover-Platform-UI.

  ## AWS Configuration
  - EC2 : Inbound rules : 8000, 22, 443, 8501 / EBS Volume more than 30 GIB
  - IAM : EC2-Bedrock-Role (AmazonBedrockFullAccess)

  ## Configuration
  
  - CREATE .env file.
  - WRITE PUBLIC IP ADDRESS (e.g, VITE_API_BASE_URL=http://{PUBLIC_IP}:8000)
  
  ## Running the code

  Run `npm i` to install the dependencies for the first time.

  Run `npm run dev -- --host 0.0.0.0 --port 8501` to start the development server.
  
  Run `uvicorn server:app --host 0.0.0.0 --port 8000 --reload` to start the fastapi server.