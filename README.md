# Field Visit Monitoring and Analytics System

This project is a comprehensive system designed for field staff to submit visit observations and for managers to access advanced analytics dashboards. The system leverages AI services (OCR, Whisper, and Gemini) to automatically process handwritten notes, audio recordings, and site images to generate actionable insights.

## 1. Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB instance (running locally on `mongodb://localhost:27017` or configured via `.env`)

### Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv fieldsight
   
   # Windows:
   .\fieldsight\Scripts\activate
   
   # macOS/Linux:
   source fieldsight/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory with your environment variables (e.g., `GEMINI_API_KEY`, database URL, etc.).

### Frontend Setup
1. Open a terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## 2. Running the Servers

### Starting the Backend
From the `backend` directory with your virtual environment activated, run:
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```
*The backend API will be available at `http://localhost:8000`*

### Starting the Frontend
From the `frontend` directory, run:
```bash
npm start
```
*The React app will launch automatically in your browser at `http://localhost:3000`*

## 3. Backend Routes

### Root
- `GET /` : Health check endpoint.

### Authentication (`/auth`)
- `POST /auth/signup` : Register a new user (admin or staff).
- `POST /auth/login` : Authenticate a user and return a JWT access token.

### Field Findings (`/api`)
- `POST /api/post_findings` : Submit a new field finding. Accepts form data along with file uploads (notes image, site image, audio file). 

### Admin Analytics (`/api/admin`)
- `GET /api/admin/users` : Retrieve a list of all registered users.
- `GET /api/admin/users/{user_id}/reports` : Get all reports submitted by a specific user.
- `GET /api/admin/reports/{report_id}` : Get the detailed view of a specific report.
- `GET /api/admin/analytics/locations` : Get a distinct list of all active regions/locations.
- `GET /api/admin/analytics/kpis` : Retrieve key performance indicators (e.g., total visits, critical issues).
- `GET /api/admin/analytics/issue-types` : Aggregation of common issue types found.
- `GET /api/admin/analytics/sentiment` : Overall sentiment analysis breakdown.
- `GET /api/admin/analytics/trends` : Issue trends over time (daily, weekly, monthly).
- `GET /api/admin/analytics/stakeholders` : Frequency of stakeholders met.
- `GET /api/admin/analytics/follow-up-priority` : Priority distribution of follow-up actions.

### Dashboard (`/dashboard`)
- `GET /dashboard/findings` : Fetch all findings, with optional date filtering.
- `GET /dashboard/finding/{finding_id}` : Retrieve a single finding by its ID.
- `GET /dashboard/staff/{user_id}` : Retrieve all findings for a specific staff member.

## 4. Backend Services

The backend integrates deeply with AI models for data processing, separated into individual services:

- **OCR Service (`ocr_service.py`)**: Uses EasyOCR to extract handwritten or typed text from uploaded images of field notes.
- **Audio Service (`audio_service.py`)**: Interfaces with speech-to-text models (Whisper) to generate accurate transcripts from audio recordings.
- **Gemini Service (`gemini_service.py`)**:
  - `analyze_site_image`: Passes uploaded site images to Gemini Vision to detect infrastructure, facilities, and potential hazards.
  - `generate_final_analytics`: Takes the combined OCR text, audio transcript, and image analysis, passing them to a Gemini language model to extract key findings, blockers, structured follow-up priorities, and sentiment.

## 5. Architecture & Workflow Diagram

```mermaid
graph LR
    %% Colors and Styles
    classDef user fill:#e8f0fe,stroke:#1a73e8,stroke-width:2px,color:#000
    classDef frontend fill:#fce8e6,stroke:#d93025,stroke-width:2px,color:#000
    classDef backend fill:#e6f4ea,stroke:#1e8e3e,stroke-width:2px,color:#000
    classDef ai fill:#fef7e0,stroke:#f9ab00,stroke-width:2px,color:#000
    classDef db fill:#f3e8fd,stroke:#9334e6,stroke-width:2px,color:#000

    subgraph Users [User Roles]
        direction TB
        Staff([Field Staff]):::user
        Admin([Manager / Admin]):::user
    end

    subgraph Frontend [React Frontend]
        App[Web Application]:::frontend
    end

    subgraph Backend [FastAPI Backend]
        API[API Gateway & Routers]:::backend
        
        subgraph AI [AI Processing Services]
            direction TB
            OCR[EasyOCR Module]:::ai
            Whisper[Whisper Audio Module]:::ai
            Gemini[Gemini Vision & LLM]:::ai
        end
    end

    subgraph Storage [Persistence Layer]
        direction TB
        DB[(MongoDB)]:::db
        Files[Local File System]:::db
    end

    %% Step-by-step Workflow
    Staff -->|1. Submit findings & media| App
    Admin -->|1. View dashboards & KPIs| App
    
    App -->|2. HTTP REST Requests| API
    
    API -->|3a. Save media| Files
    API -->|3b. Process notes image| OCR
    API -->|3c. Transcribe audio| Whisper
    API -->|3d. Analyze site & synthesize| Gemini
    
    OCR -.->|Extracted Text| API
    Whisper -.->|Audio Transcript| API
    Gemini -.->|Final JSON Analytics| API
    
    API -->|4. Store complete report| DB
    API -.->|5. Return response/data| App
```
