import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, withDelay, interpolateColor, Easing } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from './Typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface Node {
  id: string;
  type: 'signal' | 'agent';
  action?: 'BUY' | 'SELL' | 'HOLD' | 'SPECULATE';
}

interface Edge {
  from: string;
  to: string;
}

interface SocialGraphVisualizerProps {
  data: {
    nodes: Node[];
    edges: Edge[];
  };
}

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width - 80;
const CENTER = CANVAS_SIZE / 2;

export function SocialGraphVisualizer({ data }: SocialGraphVisualizerProps) {
  const { theme } = useTheme();
  const pulse = useSharedValue(0);
  const dashOffset = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
    dashOffset.value = withRepeat(
      withTiming(-20, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  if (!data || !data.nodes) return null;

  // Layout agents in a circle around the center
  const agents = data.nodes.filter(n => n.type === 'agent');
  const agentCount = agents.length;
  const radius = CANVAS_SIZE * 0.35;

  const getActionColor = (action?: string) => {
    if (action === 'BUY') return theme.success;
    if (action === 'SELL') return theme.error;
    if (action === 'SPECULATE') return theme.warning;
    return theme.primary;
  };

  return (
    <View style={styles.container}>
      <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={theme.primary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Pulsing Central Signal Aura */}
        <AnimatedCircle 
          cx={CENTER} 
          cy={CENTER} 
          r={40} 
          fill="url(#grad)"
          animatedProps={useAnimatedProps(() => ({
            r: 40 + pulse.value * 20,
            opacity: 0.5 - pulse.value * 0.3
          }))}
        />

        {/* Edges */}
        {agents.map((agent, i) => {
          const angle = (i / agentCount) * 2 * Math.PI;
          const x = CENTER + radius * Math.cos(angle);
          const y = CENTER + radius * Math.sin(angle);
          
          return (
            <AnimatedLine 
              key={`edge-${i}`}
              x1={CENTER} 
              y1={CENTER} 
              x2={x} 
              y2={y} 
              stroke={theme.primary} 
              strokeWidth="1.5" 
              strokeDasharray="4, 4"
              animatedProps={useAnimatedProps(() => ({
                strokeDashoffset: dashOffset.value,
                opacity: 0.2 + (1 - pulse.value) * 0.3
              }))}
            />
          );
        })}

        {/* Nodes */}
        {/* Signal Node */}
        <G>
          <Circle cx={CENTER} cy={CENTER} r={12} fill={theme.primary} />
          <Circle cx={CENTER} cy={CENTER} r={15} stroke={theme.primary} strokeWidth="1" fill="transparent" opacity={0.5} />
        </G>

        {/* Agent Nodes */}
        {agents.map((agent, i) => {
          const angle = (i / agentCount) * 2 * Math.PI;
          const x = CENTER + radius * Math.cos(angle);
          const y = CENTER + radius * Math.sin(angle);
          const color = getActionColor(agent.action);

          return (
            <G key={`node-${i}`}>
              <Circle cx={x} cy={y} r={18} fill={theme.background} stroke={color} strokeWidth="2" />
              <AnimatedCircle 
                cx={x} 
                cy={y} 
                r={18} 
                stroke={color} 
                strokeWidth="1" 
                fill="transparent"
                animatedProps={useAnimatedProps(() => ({
                    r: 18 + pulse.value * 8,
                    opacity: 0.4 - pulse.value * 0.4
                }))}
              />
              <SvgText 
                x={x} 
                y={y + 5} 
                fill={color} 
                fontSize="10" 
                fontWeight="bold" 
                textAnchor="middle"
              >
                {agent.action?.charAt(0) || 'H'}
              </SvgText>
              <SvgText 
                x={x} 
                y={y + 35} 
                fill={theme.textSecondary} 
                fontSize="8" 
                textAnchor="middle"
              >
                {agent.id.substring(0, 8)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
