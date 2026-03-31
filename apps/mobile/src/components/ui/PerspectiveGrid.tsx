import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface PerspectiveGridProps {
  color?: string;
  spacing?: number;
}

export const PerspectiveGrid: React.FC<PerspectiveGridProps> = ({ 
  color = 'rgba(0, 240, 255, 0.15)', 
  spacing = 50 
}) => {
  const horizontalLines = Math.ceil(height / spacing) + 10;
  const verticalLines = Math.ceil(width / spacing) + 10;

  return (
    <View style={styles.container}>
      <View style={styles.gridWrapper}>
        <Svg width={width * 2} height={height * 2} style={styles.svg}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="1" />
              <Stop offset="0.8" stopColor={color} stopOpacity="0.2" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Vertical Lines */}
          {Array.from({ length: verticalLines * 2 }).map((_, i) => {
            const x = (i - verticalLines) * spacing;
            return (
              <Line
                key={`v-${i}`}
                x1={x}
                y1={-height}
                x2={x}
                y2={height * 2}
                stroke="url(#fade)"
                strokeWidth="1"
              />
            );
          })}

          {/* Horizontal Lines */}
          {Array.from({ length: horizontalLines * 2 }).map((_, i) => {
            const y = (i - horizontalLines) * spacing;
            return (
              <Line
                key={`h-${i}`}
                x1={-width}
                y1={y}
                x2={width * 2}
                y2={y}
                stroke="url(#fade)"
                strokeWidth="1"
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#05070A',
  },
  gridWrapper: {
    position: 'absolute',
    top: -height * 0.5,
    left: -width * 0.5,
    width: width * 2,
    height: height * 2,
    transform: [
      { perspective: 1000 },
      { rotateX: '65deg' },
      { translateY: -100 },
    ],
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
