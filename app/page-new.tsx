'use client'

import { useEffect } from "react";

export default function Home() {
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

        // Create PIXI app
        const app = new PIXI.Application({
          view: canvas,
          autoStart: true,
          resizeTo: window,
          backgroundColor: 0x1a1a1a,
          antialias: true,
        });

        console.log("PIXI app created");

        try {
          console.log("Loading local model...");
          
          // Load local Mao model
          const model = await Live2DModel.from("/resources/runtimeb/mao_pro_t02.model3.json");
          console.log("Local model loaded successfully:", model);
          
          // Add to stage
          app.stage.addChild(model as any);
          
          // Setup model
          model.anchor.set(0.5, 0.5);
          model.position.set(window.innerWidth / 2, window.innerHeight / 2);
          model.scale.set(0.25, 0.25);
          
          // Simple canvas click handler
          canvas.addEventListener('click', (event) => {
            console.log("Canvas clicked! Playing motion...");
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
          graphics.drawRect(-100, -100, 200, 200);
          graphics.endFill();
          
          graphics.beginFill(0xFFFFFF);
          graphics.drawCircle(-40, -40, 20);
          graphics.drawCircle(40, -40, 20);
          graphics.endFill();
          
          graphics.position.set(window.innerWidth / 2, window.innerHeight / 2);
          app.stage.addChild(graphics);
          
          console.log("Fallback graphics created");
        }
        
      } catch (error) {
        console.error("Failed to initialize Live2D:", error);
      }
    };

    loadLive2D();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#1a1a1a' }}>
      <canvas id="canvas" style={{ display: 'block' }} />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: '#fff',
        fontSize: '14px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}>
        🐱 Click anywhere to make Mao dance! ღ(◕‿◕)ღ
      </div>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#0f0',
        fontSize: '12px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}>
        Live2D Mao Model v2.0 ✅
      </div>
    </div>
  );
}
