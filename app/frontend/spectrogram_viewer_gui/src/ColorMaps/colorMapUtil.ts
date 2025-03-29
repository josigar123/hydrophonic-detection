import { Color, ColorRGBA } from '@lightningchart/lcjs';

export const denormalizeData = (data: number[][]): Color[] => {
  const colorData: Color[] = [];
  for (let i = 0; i < data.length; i++) {
    colorData.push(
      ColorRGBA(
        Math.round(data[i][0] * 255),
        Math.round(data[i][1] * 255),
        Math.round(data[i][2] * 255)
      )
    );
  }

  return colorData;
};
