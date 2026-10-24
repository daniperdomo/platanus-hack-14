# ZeroID  — Retención  Cero 

Demuestra  que  eres  real  sin  entregar  tus  datos  personales.  

## Estructura  

- `frontend/`  Bóveda  (Next.js)  
- `backend/`  Oráculo  (FastAPI)  
- `docs/`  especificación  y  arquitectura  

## Desarrollo  

```bash
cd frontend && npm install && npm run dev
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
```

## Despliegue  

- Vercel:  Root  Directory  `frontend`  
- Render:  `backend/Dockerfile`  con  contexto  `backend`  
