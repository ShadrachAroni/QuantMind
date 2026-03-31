import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface DraggableDebugFABProps {
  onPress: () => void;
  isActive: boolean;
}

const FAB_SIZE = 56;
const PADDING = 20;

export const DraggableDebugFAB: React.FC<DraggableDebugFABProps> = ({ onPress, isActive }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Initial horizontal position: depend on SCREEN_WIDTH
  // We use useSharedValue and update it in an effect or during drag
  const translateX = useSharedValue(SCREEN_WIDTH - FAB_SIZE - PADDING);
  const translateY = useSharedValue(SCREEN_HEIGHT - FAB_SIZE - 100);
  const context = useSharedValue({ x: 0, y: 0 });

  // Update position if screen size changes (e.g. orientation)
  React.useEffect(() => {
    translateX.value = withSpring(SCREEN_WIDTH - FAB_SIZE - PADDING);
    translateY.value = withSpring(SCREEN_HEIGHT - FAB_SIZE - 100);
  }, [SCREEN_WIDTH, SCREEN_HEIGHT]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;
    })
    .onEnd(() => {
      // Snap to edges horizontally
      const snapX = translateX.value > SCREEN_WIDTH / 2 
        ? SCREEN_WIDTH - FAB_SIZE - PADDING 
        : PADDING;
      
      translateX.value = withSpring(snapX);
      
      // Boundary check vertically
      if (translateY.value < PADDING) {
        translateY.value = withSpring(PADDING);
      } else if (translateY.value > SCREEN_HEIGHT - FAB_SIZE - PADDING) {
        translateY.value = withSpring(SCREEN_HEIGHT - FAB_SIZE - PADDING);
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .runOnJS(true)
    .onEnd(() => {
      console.log('🔘 [FAB_DEBUG] Tap detected');
      onPress();
    });

  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      backgroundColor: isActive ? '#000000' : '#FF3B80',
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.fab, animatedStyle]}>
        <Text style={styles.text}>{isActive ? '✕' : '🔍'}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  text: {
    fontSize: 24,
    color: '#FFF',
  },
});
