export interface DesignLayer {
  id: string;
  name: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  view: TShirtView;
  pinterestUrl?: string;
  textProps?: {
    text: string;
    font: string;
    color: string;
  };
}

export type TShirtView = 'front' | 'back';
export type TShirtColor = 'black' | 'white' | 'navy' | 'red' | 'gray';

export interface TShirtConfig {
  view: TShirtView;
  color: TShirtColor;
}
