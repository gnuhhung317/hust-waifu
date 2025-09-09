# HUST Chat AI Assistant - Agent Instructions

This is a full-stack Live2D chat application with HUST university integration, featuring a FastAPI backend proxy, Next.js frontend, and Live2D character animations.

## Architecture Overview

```
Frontend (Next.js) ←→ Backend (FastAPI) ←→ HUST API (External)
      ↓                      ↓
  Live2D Model           TTS Service
  (Mao character)        (gTTS/Browser API)
```

**Key Components:**
- **Backend**: FastAPI proxy server handling HUST API integration, WebSocket connections, and TTS
- **Frontend**: Next.js app with Live2D integration, chat UI, and audio playback
- **Live2D**: Cubism 4 models with PIXI.js rendering for character interactions

## Critical Patterns & Conventions

### Backend Architecture (`backend/main.py`)
- **Dual Communication**: WebSocket (primary) + HTTP fallback for HUST API
- **User Identity**: Hash-based email generation from `X-User-Identity` header
- **Session Management**: `user_sessions` dict tracks WebSocket responses per user
- **Error Handling**: Graceful fallbacks from WebSocket→HTTP→default responses

```python
# User identity pattern
email = generate_email_from_identity(x_user_identity or "")
```

### Frontend Live2D Integration (`app/page.tsx`)
- **Load Order**: Wait for `Live2DCubismCore` → Import PIXI → Load Live2DModel
- **Model Setup**: Full-screen canvas with specific anchor/scale for body visibility
- **Motion Triggers**: Try multiple motion names (`['TapBody', 'Tap@Body', 'tap_body']`)
- **Error Handling**: Fallback to PIXI Graphics if model loading fails

```typescript
// Critical Live2D loading pattern
while (!(window as any).Live2DCubismCore && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 100));
  attempts++;
}
```

### TTS Implementation
- **Backend**: gTTS API endpoint `/text-to-speech` returns MP3 files
- **Frontend**: Fetch audio blob → Create Audio element → Play with cleanup
- **Fallback**: Browser Web Speech API if backend TTS fails

## Development Workflows

### Local Development
```bash
# Backend (Terminal 1)
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (Terminal 2)
npm install
npm run dev
```

### Docker Deployment
```powershell
# Windows
.\docker-run.ps1 start    # Build and start
.\docker-run.ps1 logs     # Monitor logs
.\docker-run.ps1 stop     # Stop services

# Ports: Frontend (3000), Backend (8000)
```

### Testing TTS Integration
```bash
cd backend
python test_tts.py  # Comprehensive TTS API testing
```

## File Structure Patterns

### Live2D Assets (`public/resources/`)
- `runtime/` - Rice model (alternative)
- `runtimeb/` - **Mao model** (primary character)
- Model files: `.model3.json`, `.moc3`, `.physics3.json`
- Motions: `motions/*.motion3.json`

### Configuration Files
- `docker-compose.yml` - Service orchestration
- `next.config.js` - Next.js settings  
- `requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies

## Integration Points

### HUST API Communication
- **Base URL**: `https://hustva-chat.vbeecore.com/api/v1/msg`
- **WebSocket**: `wss://hustva-chat.vbeecore.com/socket.io/`
- **Headers**: Mimic browser requests with specific User-Agent/Origin
- **Rate Limiting**: 15s timeout with graceful fallback

### Environment Variables
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend  
PYTHONUNBUFFERED=1
```

### CORS Configuration
- Frontend origins: `localhost:3000`, `127.0.0.1:3000`
- Headers: Allow `X-User-Identity` for session tracking

## Common Troubleshooting

### Live2D Loading Issues
1. Check `Live2DCubismCore` availability in browser console
2. Verify model files exist in `public/resources/runtimeb/`
3. Test with fallback graphics if model fails
4. Use `.motion()` with multiple name attempts

### Backend Connection Issues
1. Check HUST API accessibility
2. Verify WebSocket connection logs
3. Test with HTTP fallback endpoint
4. Monitor `user_sessions` state

### Docker Issues
```bash
docker-compose logs backend  # Check backend errors
docker-compose ps            # Service status
docker system prune -a       # Clean cache if build fails
```

## Key Dependencies
- **Frontend**: `pixi-live2d-display@0.4.0`, `pixi.js@6.3.0`, `next@15.0.0`
- **Backend**: `fastapi@0.104.1`, `python-socketio@5.10.0`, `gTTS@2.4.0`

## File Modification Guidelines
- **Model Changes**: Update `public/resources/runtimeb/` and adjust scale in `page.tsx`
- **API Changes**: Modify `backend/main.py` endpoints and update frontend API calls
- **UI Changes**: Edit `app/page.tsx` with inline styles (no separate CSS framework)
- **Docker Changes**: Update `docker-compose.yml` and rebuild with `--no-cache`
