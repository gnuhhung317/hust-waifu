declare module 'pixi-live2d-display' {
  import { DisplayObject } from 'pixi.js';
  
  export class Live2DModel extends DisplayObject {
    static from(url: string, options?: any): Promise<Live2DModel>;
    static registerTicker(ticker: any): void;
    motion(name: string): void;
    anchor: { set(x: number, y?: number): void };
    position: { set(x: number, y: number): void };
    scale: { set(x: number, y?: number): void };
    on(event: string, handler: (data?: any) => void): void;
  }
}
