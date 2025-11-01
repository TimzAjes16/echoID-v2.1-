/**
 * Coercion detection heuristics based on audio analysis
 */
export enum CoercionLevel {
  GREEN = 0, // Normal, voluntary
  AMBER = 1, // Suspicious patterns
  RED = 2, // High risk of coercion
}

export interface AudioAnalysis {
  duration: number; // in seconds
  pauseCount: number;
  avgPauseLength: number; // in seconds
  speakingRate: number; // words per minute (estimated)
}

/**
 * Analyze audio recording for coercion indicators
 * This is a heuristic-based analysis - values kept off-chain
 */
export function analyzeCoercion(audioAnalysis: AudioAnalysis): CoercionLevel {
  const { duration, pauseCount, avgPauseLength, speakingRate } = audioAnalysis;

  // Very short recordings might indicate rushing
  if (duration < 5) {
    return CoercionLevel.AMBER;
  }

  // Excessive pauses might indicate hesitation or prompting
  if (pauseCount > duration / 3) {
    return CoercionLevel.AMBER;
  }

  // Very long pauses might indicate coercion
  if (avgPauseLength > 5) {
    return CoercionLevel.RED;
  }

  // Very slow or very fast speaking rate might indicate stress
  if (speakingRate < 50 || speakingRate > 200) {
    return CoercionLevel.AMBER;
  }

  // Combination of factors increases risk
  if (
    pauseCount > duration / 4 &&
    avgPauseLength > 3 &&
    (speakingRate < 60 || speakingRate > 180)
  ) {
    return CoercionLevel.RED;
  }

  return CoercionLevel.GREEN;
}

/**
 * Get coercion level label
 */
export function getCoercionLabel(level: CoercionLevel): string {
  switch (level) {
    case CoercionLevel.GREEN:
      return 'Normal';
    case CoercionLevel.AMBER:
      return 'Caution';
    case CoercionLevel.RED:
      return 'High Risk';
    default:
      return 'Unknown';
  }
}

/**
 * Get coercion level color for UI
 */
export function getCoercionColor(level: CoercionLevel): string {
  switch (level) {
    case CoercionLevel.GREEN:
      return '#4CAF50';
    case CoercionLevel.AMBER:
      return '#FF9800';
    case CoercionLevel.RED:
      return '#F44336';
    default:
      return '#757575';
  }
}

