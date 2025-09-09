'use client'

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "Xin chào! Tôi là Mao - trợ lý AI của HUST! 🎓 Tôi có thể giúp bạn tìm hiểu về các môn học, quy định và thông tin của trường. Hãy hỏi tôi bất cứ điều gì nhé! 💖", isUser: false }
  ]);

  // Identity management with localStorage
  const [userIdentity, setUserIdentity] = useState<string>("");

  // Initialize user identity
  useEffect(() => {
    let identity = localStorage.getItem('hust_chat_identity');
    if (!identity) {
      // Generate random identity: timestamp + random string
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      identity = `${timestamp}_${randomStr}`;
      localStorage.setItem('hust_chat_identity', identity);
    }
    setUserIdentity(identity);
    console.log('User identity:', identity);
  }, []);

  // Auto-speak welcome message when component mounts
  useEffect(() => {
    const welcomeMessage = "Xin chào! Tôi là Mao - trợ lý AI của HUST! Tôi có thể giúp bạn tìm hiểu về các môn học, quy định và thông tin của trường. Hãy hỏi tôi bất cứ điều gì nhé!";
    setTimeout(() => speakText(welcomeMessage), 2000); // Speak after 2 seconds
  }, []); // Remove dependencies to avoid re-running

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection hook
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobile);
    };
    
    checkMobile(); // Check on initial load
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to parse time string "5:48:28 PM" to Date object for sorting
  const parseTime = (timeStr: string): Date => {
    const today = new Date();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    today.setHours(hour24, minutes, seconds || 0);
    return today;
  };

  // Function to sort messages by time
  const sortMessagesByTime = (messages: any[]) => {
    return messages.sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA.getTime() - timeB.getTime();
    });
  };

  // Text-to-Speech function using backend API
  const speakText = async (text: string) => {
    if (!speechEnabled) return;
    
    // Stop any existing speech
    stopSpeech();
    
    // Clean text for better speech (remove markdown formatting)
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*([^*]+)\*/g, '$1')     // Remove italic formatting
      .replace(/###?\s*/g, '')          // Remove headers
      .replace(/\n+/g, '. ')            // Replace newlines with periods
      .replace(/\s+/g, ' ')             // Normalize spaces
      .trim();
    
    if (!cleanText) return;
    
    setIsSpeaking(true);
    
    try {
      console.log('🔊 Converting text to speech via backend API...');
      
      // Call backend TTS API
      const response = await fetch(`${API_BASE_URL}/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          language: 'vi', // Vietnamese
          slow: false
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      console.log('✅ Audio blob received, playing audio...');
      
      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio); // Store audio instance
      
      // Handle audio events
      audio.onloadeddata = () => {
        console.log('Audio loaded, starting playback');
        audio.play().catch(e => {
          console.error('Audio play error:', e);
          setIsSpeaking(false);
          setCurrentAudio(null);
        });
      };
      
      audio.onended = () => {
        console.log('Audio playback finished');
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      
      // Trigger model animation while speaking
      const model = (window as any).live2dModel;
      if (model) {
        try {
          model.motion('TapBody');
        } catch (e) {
          console.log("Motion not available");
        }
      }
      
    } catch (error) {
      console.error('TTS API error, falling back to browser speech:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
      
      // Fallback to browser's speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        utterance.lang = 'vi-VN';
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Store current audio instance for stopping
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Stop speech function
  const stopSpeech = () => {
    // Stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop current audio playback
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    setIsSpeaking(false);
  };

  useEffect(() => {
    const loadLive2D = async () => {
      try {
        console.log("Starting Live2D initialization...");
        
        // Wait for Live2DCubismCore
        let attempts = 0;
        const maxAttempts = 50; 
        while (!(window as any).Live2DCubismCore && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!(window as any).Live2DCubismCore) {
          console.error("Live2DCubismCore not found after waiting");
          return;
        }
        
        console.log("Live2DCubismCore found!");
        
        // Load PIXI
        const PIXI = await import("pixi.js");
        (window as any).PIXI = PIXI;
        console.log("PIXI loaded:", !!PIXI);

        // Import Live2DModel for Cubism 4
        const { Live2DModel } = await import("pixi-live2d-display/cubism4");
        console.log("Live2DModel imported:", !!Live2DModel);

        // Only register ticker - skip InteractionManager
        try {
          Live2DModel.registerTicker(PIXI.Ticker as any);
          console.log("PIXI Ticker registered successfully");
        } catch (e) {
          console.warn("Failed to register PIXI ticker:", e);
        }

        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        if (!canvas) {
          console.error("Canvas not found");
          return;
        }

        // Create PIXI app with full screen transparent background
        const app = new PIXI.Application({
          view: canvas,
          autoStart: true,
          resizeTo: window, // Let PIXI handle resize automatically
          backgroundColor: 0x000000,
          backgroundAlpha: 0, // Trong suốt hoàn toàn
          antialias: true,
          preserveDrawingBuffer: true, // Giữ buffer để render tốt hơn
        });

        console.log("PIXI app created");

        try {
          console.log("Loading local model...");
          
          // Load local Mao model
          const model = await Live2DModel.from("resources/runtimeb/mao_pro_t02.model3.json");
          console.log("Local model loaded successfully:", model);
          
          // Add to stage
          app.stage.addChild(model as any);
          
          // Setup model - hiển thị full body, center properly
          model.anchor.set(0.5, 0.2); // Center anchor thay vì bottom anchor
          model.position.set(app.screen.width / 2, app.screen.height / 2); // Center screen
          
          // Scale để hiển thị toàn bộ cơ thể trong màn hình
          const screenWidth = app.screen.width;
          const screenHeight = app.screen.height;
          
         
          // Chọn scale nhỏ hơn để đảm bảo model không bị cắt
          let optimalScale=0.1;
          model.scale.set(optimalScale, optimalScale);
          
          console.log(`Model setup: scale=${optimalScale}, position=(${app.screen.width/2}, ${app.screen.height/2}), screen=(${screenWidth}x${screenHeight})`);
          
          // Store model reference for interactions
          (window as any).live2dModel = model;
          
          // Simple canvas click handler
          canvas.addEventListener('click', (event) => {
            console.log("Model clicked! Playing motion...");
            try {
              // Try different motion patterns
              const motions = ['TapBody', 'Tap@Body', 'tap_body', 'Idle', 'idle'];
              let played = false;
              
              for (const motion of motions) {
                try {
                  model.motion(motion);
                  console.log(`✅ Motion "${motion}" played successfully!`);
                  played = true;
                  break;
                } catch (e) {
                  console.log(`Motion "${motion}" not available, trying next...`);
                }
              }
              
              if (!played) {
                console.log("No motions available, trying to get motion info...");
                console.log("Model internal:", model.internalModel);
                if (model.internalModel?.motionManager) {
                  console.log("Motion manager available:", model.internalModel.motionManager);
                }
              }
            } catch (e) {
              console.error("Motion play error:", e);
            }
          });
          
          canvas.style.cursor = 'pointer';
          console.log("✅ Mao model loaded and ready for interaction!");
          
        } catch (modelError) {
          console.error("Failed to load model:", modelError);
          
          // Fallback graphics
          const graphics = new PIXI.Graphics();
          graphics.beginFill(0x9966FF);
          graphics.drawRect(-50, -50, 100, 100);
          graphics.endFill();
          
          graphics.beginFill(0xFFFFFF);
          graphics.drawCircle(-20, -20, 10);
          graphics.drawCircle(20, -20, 10);
          graphics.endFill();
          
          graphics.position.set(200, 250);
          app.stage.addChild(graphics);
          
          console.log("Fallback graphics created");
        }
        
      } catch (error) {
        console.error("Failed to initialize Live2D:", error);
      }
    };

    loadLive2D();
  }, []);

  // API functions for HUST chat through our FastAPI backend
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://171.244.195.203/api';
  
  const sendMessageToAPI = async (message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Identity': userIdentity, // Add user identity header
        },
        body: JSON.stringify({
          question: message,
          userType: "UNDER_GRADUATE",
          isOutsidePage: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Message sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const getMessagesFromAPI = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-messages?page=1&size=10`, {
        method: 'GET',
        headers: {
          'X-User-Identity': userIdentity, // Add user identity header
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !userIdentity) return; // Check if userIdentity is available
    
    const userMessage = inputMessage.trim();
    
    // Add user message immediately
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputMessage("");
    setIsTyping(true);
    
    // Trigger model animation
    const model = (window as any).live2dModel;
    if (model) {
      try {
        model.motion('TapBody');
      } catch (e) {
        console.log("Motion not available");
      }
    }
    
    try {
      console.log("Sending message to HUST via backend:", userMessage);
      console.log("Using user identity:", userIdentity);
      
      // Send message to HUST API through our backend
      const sendResult = await sendMessageToAPI(userMessage);
      
      if (sendResult && sendResult.status === 1) {
        console.log("Message sent successfully, waiting for response...");
        
        // Wait a moment for the API to process and generate response
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        // Get updated messages from API through backend
        const apiMessages = await getMessagesFromAPI();
        
        // Find the AI response for our message
        if (apiMessages && apiMessages.length > 0) {

          const aiResponse = apiMessages[apiMessages.length-1];
          
          if (aiResponse && aiResponse.message) {
            console.log("AI response received:", aiResponse.message.text);
            const aiText = aiResponse.message.text;
            setMessages(prev => [...prev, { text: aiText, isUser: false }]);
            
            // Speak the AI response
            setTimeout(() => speakText(aiText), 500); // Small delay for better UX
          } else {
            console.log("No AI response found, using fallback");
            const fallbackText = "Tôi đã nhận được tin nhắn của bạn! Hãy cho tôi chút thời gian để suy nghĩ nhé 🤔";
            setMessages(prev => [...prev, { text: fallbackText, isUser: false }]);
            setTimeout(() => speakText(fallbackText), 500);
          }
        } else {
          console.log("No messages returned from API, using fallback");
          const fallbackText = "Hệ thống HUST đang xử lý câu hỏi của bạn. Vui lòng đợi một chút! ⏳";
          setMessages(prev => [...prev, { text: fallbackText, isUser: false }]);
          setTimeout(() => speakText(fallbackText), 500);
        }
      } else {
        console.log("Send message failed:", sendResult);
        const errorText = "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại! 😅";
        setMessages(prev => [...prev, { text: errorText, isUser: false }]);
        setTimeout(() => speakText(errorText), 500);
      }
      
    } catch (error) {
      console.error("Error in chat:", error);
      // Fallback to original responses if API fails
      const fallbackResponses = [
        "Xin lỗi, hệ thống HUST đang bảo trì. Tôi sẽ trả lời bạn bằng kiến thức của mình! �",
        "Kết nối với server HUST gặp sự cố. Hãy thử lại sau nhé! �",
        "Tôi đang gặp sự cố kỹ thuật nhưng vẫn muốn giúp bạn! Bạn có thể mô tả thêm không? �"
      ];
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setMessages(prev => [...prev, { text: fallbackResponse, isUser: false }]);
      setTimeout(() => speakText(fallbackResponse), 500);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      backgroundImage: 'url(/resources/background.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Overlay để làm mờ background một chút - chỉ ở các góc */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.1) 70%)', 
        zIndex: 1
      }} />
      
      {/* Live2D Model - Full screen overlay, nằm tự nhiên trên background */}
      <div style={{
        position: 'fixed', // Fixed để cover toàn bộ màn hình
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2,
        pointerEvents: 'none' // Cho phép click through, chỉ model mới có thể click
      }}>
        <canvas 
          id="canvas" 
          style={{ 
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            pointerEvents: 'auto' // Canvas có thể click
          }} 
        />
      </div>

      {/* Chat Toggle Button */}
      <button 
        onClick={() => setShowChat(!showChat)}
        style={{
          position: 'fixed',
          bottom: showChat ? (isMobile ? '60vh' : '540px') : '20px',
          right: isMobile ? '20px' : '30px',
          width: isMobile ? '56px' : '60px',
          height: isMobile ? '56px' : '60px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          fontSize: isMobile ? '20px' : '24px',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: showChat ? 'scale(0.8) rotate(45deg)' : 'scale(1) rotate(0deg)',
          opacity: showChat ? 0.8 : 1
        }}
        onMouseEnter={(e) => {
          if (!showChat) {
            e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)'
            e.currentTarget.style.backgroundColor = '#1d4ed8'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.5)'
          }
        }}
        onMouseLeave={(e) => {
          if (!showChat) {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
            e.currentTarget.style.backgroundColor = '#2563eb'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(37, 99, 235, 0.4)'
          }
        }}
      >
        {showChat ? '✕' : '💬'}
      </button>

      {/* Chat Panel - Responsive design */}
      <div style={{
        position: 'fixed',
        bottom: showChat ? '10px' : '-100vh',
        right: isMobile ? '10px' : '20px',
        left: isMobile ? '10px' : 'auto',
        width: isMobile ? 'calc(100vw - 20px)' : '380px',
        height: isMobile ? '60vh' : '500px',
        maxHeight: isMobile ? '60vh' : '500px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '12px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9,
        transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: isMobile ? '12px 16px' : '16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          borderTopLeftRadius: isMobile ? '12px' : '16px',
          borderTopRightRadius: isMobile ? '12px' : '16px'
        }}>
          <div>
            <h3 style={{ 
              margin: 0, 
              color: '#1e40af', 
              fontSize: isMobile ? '14px' : '16px', 
              fontWeight: '600' 
            }}>
              💖 Chat với Mao
            </h3>
            <p style={{ 
              margin: '2px 0 0 0', 
              fontSize: isMobile ? '10px' : '11px', 
              color: '#64748b',
              fontWeight: '500'
            }}>
              HUST AI Assistant
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '4px' : '8px',
            flexWrap: 'wrap'
          }}>
            {/* Speech Controls */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              style={{
                backgroundColor: speechEnabled ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '8px' : '12px',
                padding: isMobile ? '3px 6px' : '4px 8px',
                fontSize: isMobile ? '8px' : '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              title={speechEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {speechEnabled ? '🔊' : '🔇'}
            </button>

            {/* Test TTS button - Hide on very small screens */}
            {!isMobile && (
              <button
                onClick={() => speakText("Xin chào! Tôi là Mao, trợ lý AI của bạn!")}
                disabled={isSpeaking}
                style={{
                  backgroundColor: isSpeaking ? '#6b7280' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? '8px' : '12px',
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  fontSize: isMobile ? '8px' : '10px',
                  cursor: isSpeaking ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                title="Test giọng nói"
                onMouseEnter={(e) => {
                  if (!isSpeaking) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSpeaking) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                  }
                }}
              >
                🎤
              </button>
            )}
            
            {isSpeaking && (
              <button
                onClick={stopSpeech}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? '8px' : '12px',
                  padding: isMobile ? '3px 6px' : '4px 8px',
                  fontSize: isMobile ? '8px' : '10px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                title="Dừng nói"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                ⏹️
              </button>
            )}
            
            <button 
              onClick={() => setShowChat(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: isMobile ? '14px' : '16px',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '20px' : '24px',
                height: isMobile ? '20px' : '24px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#9ca3af'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="chat-messages"
          style={{
            flex: 1,
            padding: isMobile ? '8px 12px' : '12px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '6px' : '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#e2e8f0 transparent'
          }}
        >
          {messages.map((message, index) => (
            <div key={index} style={{
              alignSelf: message.isUser ? 'flex-end' : 'flex-start',
              maxWidth: isMobile ? '85%' : '85%'
            }}>
              <div style={{
                position: 'relative',
                padding: isMobile ? '8px 10px' : '10px 14px',
                borderRadius: message.isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: message.isUser 
                  ? '#2563eb' 
                  : 'rgba(248, 250, 252, 0.9)',
                color: message.isUser ? 'white' : '#334155',
                fontSize: isMobile ? '12px' : '13px',
                wordWrap: 'break-word',
                lineHeight: '1.4',
                boxShadow: message.isUser 
                  ? '0 2px 8px rgba(37, 99, 235, 0.3)' 
                  : '0 2px 6px rgba(0, 0, 0, 0.05)',
                border: message.isUser ? 'none' : '1px solid rgba(226, 232, 240, 0.5)'
              }}>
                {message.isUser ? (
                  // Render user message as plain text
                  message.text
                ) : (
                  <>
                    {/* Render AI message as markdown */}
                    <ReactMarkdown 
                      components={{
                        p: ({children}) => <p style={{margin: '0 0 6px 0', lineHeight: '1.4', color: 'inherit', fontSize: 'inherit'}}>{children}</p>,
                        ul: ({children}) => <ul style={{margin: '4px 0 4px 16px', paddingLeft: 0}}>{children}</ul>,
                        ol: ({children}) => <ol style={{margin: '4px 0 4px 16px', paddingLeft: 0}}>{children}</ol>,
                        li: ({children}) => <li style={{margin: '1px 0', fontSize: isMobile ? '11px' : '12px'}}>{children}</li>,
                        strong: ({children}) => <strong style={{fontWeight: '600'}}>{children}</strong>,
                        em: ({children}) => <em style={{fontStyle: 'italic'}}>{children}</em>,
                        code: ({children}) => <code style={{
                          backgroundColor: 'rgba(0,0,0,0.08)', 
                          padding: '2px 4px', 
                          borderRadius: '4px',
                          fontSize: isMobile ? '10px' : '11px',
                          fontFamily: 'Monaco, Consolas, monospace'
                        }}>{children}</code>
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                    
                    {/* Speak button for AI messages */}
                    <button
                      onClick={() => speakText(message.text)}
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        right: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isMobile ? '9px' : '10px',
                        opacity: 0.6,
                        padding: isMobile ? '1px 3px' : '2px 4px',
                        borderRadius: '4px',
                        color: 'inherit',
                        transition: 'all 0.2s',
                        minWidth: isMobile ? '16px' : '18px',
                        minHeight: isMobile ? '16px' : '18px'
                      }}
                      title="Nghe lại"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6'
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      🔊
                    </button>
                  </>
                )}
              </div>
              {/* Show timestamp for debugging */}
              {(message as any).time && (
                <div style={{
                  fontSize: isMobile ? '8px' : '9px',
                  color: '#9ca3af',
                  textAlign: message.isUser ? 'right' : 'left',
                  marginTop: '2px',
                  paddingLeft: message.isUser ? '0' : '6px',
                  paddingRight: message.isUser ? '6px' : '0'
                }}>
                  {(message as any).time}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div style={{
              alignSelf: 'flex-start',
              maxWidth: '85%'
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                backgroundColor: 'rgba(248, 250, 252, 0.9)',
                color: '#64748b',
                fontSize: '13px',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '2px'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#94a3b8',
                    animation: 'pulse 1.4s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#94a3b8',
                    animation: 'pulse 1.4s ease-in-out infinite 0.2s'
                  }}></div>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: '#94a3b8',
                    animation: 'pulse 1.4s ease-in-out infinite 0.4s'
                  }}></div>
                </div>
                Mao đang suy nghĩ...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: isMobile ? '8px 12px 12px 12px' : '12px 16px 16px 16px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(248, 250, 252, 0.5)',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '6px' : '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Hỏi Mao về HUST..."
              disabled={!userIdentity}
              style={{
                flex: 1,
                padding: isMobile ? '8px 12px' : '10px 14px',
                border: '2px solid #e2e8f0',
                borderRadius: '18px',
                fontSize: isMobile ? '12px' : '13px',
                outline: 'none',
                backgroundColor: 'white',
                transition: 'all 0.2s',
                opacity: !userIdentity ? 0.6 : 1,
                minHeight: isMobile ? '36px' : '40px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb'
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !userIdentity}
              style={{
                padding: isMobile ? '8px 12px' : '10px 16px',
                backgroundColor: inputMessage.trim() && !isTyping && userIdentity ? '#2563eb' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '18px',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: '600',
                cursor: inputMessage.trim() && !isTyping && userIdentity ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                minWidth: isMobile ? '44px' : '50px',
                minHeight: isMobile ? '36px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (inputMessage.trim() && !isTyping && userIdentity) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }
              }}
              onMouseLeave={(e) => {
                if (inputMessage.trim() && !isTyping && userIdentity) {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              {isTyping ? '⏳' : '🚀'}
            </button>
          </div>
        </div>
      </div>

      {/* Hint Text */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontSize: '14px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '8px 20px',
        borderRadius: '20px',
        zIndex: 10, // Cao hơn model để luôn hiển thị
        textAlign: 'center',
        maxWidth: '90vw',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        opacity: showChat ? 0.7 : 1
      }}>
        🎓 HUST AI Assistant - Click Mao hoặc nút chat! ✨
      </div>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        /* Custom scrollbar for chat */
        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
