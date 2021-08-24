import Alpine from "alpinejs";

let STATE = "state";

let initialState = {
  dummyCounter: 1,
  user: {
    showQRScanner: true,
    stationsVisited: [],
    tags: [],
    timers: [],
    onLevel: 0,
    helpAvailable: 3,
  },
  audio: {
    volume: 0,
    story: {
      isPlaying: false,
      data: {},
    },
    background: {
      isPlaying: false,
      data: {},
    },
  },
  fakeId: "play-timer-1",
};

// Pick up stored Alpine.store state from localStorage or null if none exists.
function getStateFromLocalStorage() {
  // Get the serialized data
  let serializedState = localStorage.getItem(STATE);

  if (serializedState !== null) {
    // Put it in an Alpine store
    Alpine.store(STATE, JSON.parse(serializedState));

    // Return that store
    return Alpine.store(STATE);
  } else {
    // Or null if nothing was on disk
    return null;
  }
}

// Put state into localStorage
function saveStateToLocalStorage(state) {
  let serializedState = JSON.stringify(state);
  localStorage.setItem(STATE, serializedState);
}

// Run once, on app startup, return an Alpine.store
export function initializeState() {
  // Try to get persisted state
  let state = getStateFromLocalStorage();
  console.log("state1: ", state);

  // If that was successful, return it
  if (state !== null) {
    return state;
  } else {
    // Otherwise create a brand new Alpine state
    Alpine.store(STATE, initialState);

    // Put the same thing in localStorage
    saveStateToLocalStorage(JSON.stringify(initialState));

    // And return it.
    return Alpine.store(STATE);
  }
}

// This is what we usually call to get the current state.
// That is, when we don't think that we need to read from disk
export function getState() {
  return Alpine.store(STATE);
}

// All state altering functions are defined below. And follow the pattern of our increaseDummyCounter function

export function increaseDummyCounter(num) {
  // Get our current state
  let state = Alpine.store(STATE);

  // Do our changes
  state.dummyCounter += num;

  // Save the new state to disk
  saveStateToLocalStorage(state);
}

export function decreaseHelpAvailable() {
  // Get our current state
  let state = Alpine.store(STATE);

  // Do our changes
  state.user.helpAvailable--;

  // Save the new state to disk
  saveStateToLocalStorage(state);
}
