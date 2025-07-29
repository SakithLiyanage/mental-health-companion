// Simple test to verify breathing timer logic
console.log('Testing breathing timer logic...');

let phase = 'inhale';
let count = 4;
let completedCycles = 0;

const phases = {
  inhale: { duration: 4, message: 'Breathe In', next: 'hold' },
  hold: { duration: 4, message: 'Hold', next: 'exhale' },
  exhale: { duration: 4, message: 'Breathe Out', next: 'pause' },
  pause: { duration: 4, message: 'Rest', next: 'inhale' },
};

function simulateTimer() {
  const currentPhase = phases[phase];
  console.log(`Phase: ${phase}, Count: ${count}, Message: ${currentPhase.message}`);
  
  if (count > 0) {
    count--;
  } else {
    // Move to next phase
    const nextPhase = phases[currentPhase.next];
    phase = currentPhase.next;
    count = nextPhase.duration;
    
    // Count completed cycles
    if (currentPhase.next === 'inhale') {
      completedCycles++;
      console.log(`🎉 Completed cycle ${completedCycles}`);
    }
  }
}

// Simulate 20 seconds
for (let i = 0; i < 20; i++) {
  console.log(`Second ${i + 1}:`);
  simulateTimer();
  console.log('---');
}
