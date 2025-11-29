import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export enum BottomSheetState {
  COLLAPSED = 'collapsed',
  HALF = 'half',
  EXPANDED = 'expanded',
}

interface AnimatedBottomSheetProps {
  children: ReactNode;
  state: BottomSheetState;
  onStateChange: (state: BottomSheetState) => void;
  snapPoints?: {
    collapsed: number;
    half: number;
    expanded: number;
  };
}

const defaultSnapPoints = {
  collapsed: 120,
  half: SCREEN_HEIGHT * 0.4,
  expanded: SCREEN_HEIGHT * 0.75,
};

export default function AnimatedBottomSheet({
  children,
  state,
  onStateChange,
  snapPoints = defaultSnapPoints,
}: AnimatedBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPointsArray = [snapPoints.collapsed, snapPoints.half, snapPoints.expanded];

  const stateToIndex = {
    [BottomSheetState.COLLAPSED]: 0,
    [BottomSheetState.HALF]: 1,
    [BottomSheetState.EXPANDED]: 2,
  };

  const indexToState = {
    0: BottomSheetState.COLLAPSED,
    1: BottomSheetState.HALF,
    2: BottomSheetState.EXPANDED,
  };

  const handleSheetChanges = useCallback((index: number) => {
    const newState = indexToState[index as keyof typeof indexToState];
    if (newState) {
      onStateChange(newState);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onStateChange]);

  useEffect(() => {
    const index = stateToIndex[state];
    bottomSheetRef.current?.snapToIndex(index);
  }, [state]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPointsArray}
      index={stateToIndex[state]}
      onChange={handleSheetChanges}
      enablePanDownToClose={false}
      handleComponent={null}
      backgroundStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
      }}
    >
      <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}
