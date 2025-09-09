import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

window.PIXI = PIXI;

Live2DModel.registerTicker(PIXI.Ticker);
// register InteractionManager to make Live2D models interactive
PIXI.Renderer.registerPlugin("interaction", PIXI.InteractionManager);

function App() {
  useEffect(() => {
    const app = new PIXI.Application({
      view: document.getElementById("canvas"),
      autoStart: true,
      resizeTo: window
    });

    Live2DModel.from("resources/runtimeb/mao_pro_t02.model3.json", {
      idleMotionGroup: "Idle"
    }).then((model) => {
      app.stage.addChild(model);
      model.anchor.set(0.5, 0.5);
      model.position.set(window.innerWidth / 4, window.innerHeight / 4);
      model.scale.set(0.09, 0.09);

      model.on("pointertap", () => {
        model.motion("Tap@Body");
      });
    });
  }, []);

  return <canvas id="canvas" />;
}

export default App;
