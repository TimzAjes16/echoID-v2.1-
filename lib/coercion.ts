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
  // AI-based vocal analysis
  avgPitch?: number; // Average pitch in Hz (higher pitch can indicate stress)
  pitchVariation?: number; // Standard deviation of pitch (high variation = stress/uncertainty)
  avgVolume?: number; // Average volume level (0-1)
  volumeVariation?: number; // Volume consistency (low = hesitant)
  tempoStability?: number; // Rhythm consistency (0-1, lower = more irregular = stress)
  hesitationMarkers?: number; // Count of "um", "uh", long pauses
  confidenceScore?: number; // Overall confidence score (0-1, lower = less confident)
  emotionalTone?: 'calm' | 'stressed' | 'uncertain' | 'confident'; // AI-determined tone
}

/**
 * Analyze audio recording for coercion indicators using AI-enhanced vocal analysis
 * This combines heuristic analysis with vocal intonation patterns
 */
export function analyzeCoercion(audioAnalysis: AudioAnalysis): CoercionLevel {
  const { 
    duration, 
    pauseCount, 
    avgPauseLength, 
    speakingRate,
    avgPitch,
    pitchVariation,
    avgVolume,
    volumeVariation,
    tempoStability,
    hesitationMarkers,
    confidenceScore,
    emotionalTone
  } = audioAnalysis;

  let riskScore = 0;

  // Duration checks - very short recordings might indicate rushing
  if (duration < 5) {
    riskScore += 1;
  } else if (duration < 10) {
    riskScore += 0.5;
  }

  // Pause analysis - excessive pauses indicate hesitation
  const pauseRatio = pauseCount / duration;
  if (pauseRatio > 0.3) {
    riskScore += 1.5;
  } else if (pauseRatio > 0.2) {
    riskScore += 0.5;
  }

  // Long pauses indicate prompting or coercion
  if (avgPauseLength > 5) {
    riskScore += 2;
  } else if (avgPauseLength > 3) {
    riskScore += 1;
  }

  // Speaking rate - abnormal rates indicate stress
  if (speakingRate < 50 || speakingRate > 200) {
    riskScore += 1;
  } else if (speakingRate < 70 || speakingRate > 160) {
    riskScore += 0.5;
  }

  // AI-based vocal intonation analysis
  if (avgPitch !== undefined) {
    // Higher pitch can indicate stress or fear
    if (avgPitch > 250) { // High pitch threshold (adjust based on gender/normal range)
      riskScore += 1;
    }
    
    // High pitch variation indicates uncertainty or stress
    if (pitchVariation !== undefined && pitchVariation > 50) {
      riskScore += 1.5;
    }
  }

  // Volume analysis - inconsistent volume suggests hesitation
  if (volumeVariation !== undefined && volumeVariation > 0.3) {
    riskScore += 1;
  }
  
  // Low average volume might indicate reluctance
  if (avgVolume !== undefined && avgVolume < 0.3) {
    riskScore += 0.5;
  }

  // Tempo stability - irregular rhythm suggests stress or hesitation
  if (tempoStability !== undefined && tempoStability < 0.5) {
    riskScore += 1.5;
  }

  // Hesitation markers (um, uh, long pauses)
  if (hesitationMarkers !== undefined) {
    const hesitationRatio = hesitationMarkers / duration;
    if (hesitationRatio > 0.5) {
      riskScore += 2;
    } else if (hesitationRatio > 0.2) {
      riskScore += 1;
    }
  }

  // Confidence score from AI analysis
  if (confidenceScore !== undefined) {
    if (confidenceScore < 0.3) {
      riskScore += 2;
    } else if (confidenceScore < 0.5) {
      riskScore += 1;
    }
  }

  // Emotional tone analysis
  if (emotionalTone === 'stressed') {
    riskScore += 2;
  } else if (emotionalTone === 'uncertain') {
    riskScore += 1.5;
  } else if (emotionalTone === 'confident') {
    riskScore -= 0.5; // Reduce risk if confident
  }

  // Determine coercion level based on cumulative risk score
  if (riskScore >= 6) {
    return CoercionLevel.RED;
  } else if (riskScore >= 3) {
    return CoercionLevel.AMBER;
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

