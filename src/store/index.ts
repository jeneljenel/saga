// eslint-disable-next-line
import { Subject } from "rxjs";
// eslint-disable-next-line
import { ComponentCustomProperties } from "vue";

// eslint-disable-next-line
import createPersistedState from "vuex-persistedstate";

import { Store, createStore } from "vuex";
import { IGameConfig, StationID } from "../station";
import { loadGameConfigAndStations } from "../station";
import { log } from "../utils";

interface IUserState {
  QRScannerCanBeDisplayed: boolean;
  QRScannerIsDisplayed: boolean;
  showQRScanner: boolean;
  stationsVisited: StationID[];
  stationsVisitCount: Record<StationID, number>;
  lastStationVisitedId?: StationID;
  tags: string[];
  timers: Record<string, number>;
  helpAvailable: number;
  currentStation: StationID | undefined;
  openStations: StationID[];
}

export interface IState {
  gameConfigLoaded: boolean;
  gameConfig?: IGameConfig;
  displayDevBox: boolean;
  user: IUserState;
  audio: {
    volume: number;
    story: {
      isPlaying: boolean;
      data: string | null;
    };
    background: {
      isPlaying: boolean;
      data: string | null;
    };
  };
}

// This is a trick to get the store to work with TypeScript
declare module "@vue/runtime-core" {
  // declare your own store states

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<IState>;
  }
}

const initialState: IState = {
  gameConfigLoaded: false,
  gameConfig: undefined,
  displayDevBox: true,

  user: {
    QRScannerCanBeDisplayed: false,
    QRScannerIsDisplayed: false,
    showQRScanner: true,
    stationsVisited: [],
    stationsVisitCount: {} as Record<StationID, number>,
    tags: [],
    timers: {},
    // onLevel: 0,
    helpAvailable: 3,
    currentStation: undefined,
    openStations: [],
  },
  audio: {
    volume: 0,
    story: {
      isPlaying: false,
      // data: {},
      data: null,
    },
    background: {
      isPlaying: false,
      // data: {},
      data: null,
    },
  },
};

export const store = createStore({
  //state: {},
  state: initialState,
  mutations: {
    decreaseHelpAvailable(state) {
      state.user.helpAvailable--;
    },

    displayQRScanner(state) {
      state.user.QRScannerIsDisplayed = true;
    },

    hideQRScanner(state) {
      state.user.QRScannerIsDisplayed = false;
    },

    displayButtonToOpenQRScanner(state) {
      state.user.QRScannerCanBeDisplayed = true;
    },

    hideButtonToOpenQRScanner(state) {
      state.user.QRScannerCanBeDisplayed = false;
    },

    pushStationIdToStationsVisited(state, stationId: StationID) {
      state.user.stationsVisited.push(stationId);
      if (stationId in state.user.stationsVisitCount) {
        state.user.stationsVisitCount[stationId]++;
      } else {
        state.user.stationsVisitCount[stationId] = 1;
      }
    },

    addTimer(state, payLoad: { timerName: string; timer: number }) {
      state.user.timers[payLoad.timerName] = payLoad.timer;
    },

    removeTimer(state, timerName: string) {
      delete state.user.timers[timerName];
    },

    setAudioStoryIsPlaying(state, value: boolean) {
      state.audio.story.isPlaying = value;
    },

    setAudioBackgroundIsPlaying(state, value: boolean) {
      state.audio.background.isPlaying = value;
    },

    async loadGameConfig(state) {
      const urlParams = new URLSearchParams(window.location.search);
      const configUrl = urlParams.get("configUrl");

      state.displayDevBox = urlParams.get("displayDevBox") == "yes";

      if (configUrl) {
        state.gameConfig = await loadGameConfigAndStations(new URL(configUrl));
        // const loadedGameConfig = await loadGameConfigAndStations(new URL(configUrl));

        state.user.openStations = state.gameConfig.openStationsAtStart;

        state.gameConfigLoaded = true;
        log("store", "gameConfigLoaded");
      }
    },

    wipeHistory(state) {
      state.user = initialState.user;
      state.audio = initialState.audio;
    },

    setCurrentStation(state, stationId: StationID) {
      state.user.currentStation = stationId;
    },

    updateOpenStations(state, stationIds: StationID[]) {
      state.user.openStations = stationIds;
    },
  },
  actions: {},
  modules: {},
  // TODO reinstate
  // plugins: [createPersistedState()],
});

// const storeClosure = store;
store.subscribe((mutation, state) => {
  const timersExists = Object.keys(state.user.timers).length !== 0;

  // TODO background audio is permissible
  const audioIsPlaying =
    state.audio.story.isPlaying || state.audio.background.isPlaying;
  const qrScannerVisible = state.user.QRScannerIsDisplayed;
  const openQrScannerButtonVisible = state.user.QRScannerCanBeDisplayed;

  if (
    !timersExists &&
    !audioIsPlaying &&
    !qrScannerVisible &&
    !openQrScannerButtonVisible
  ) {
    store.commit(Mutations.displayButtonToOpenQRScanner);
  }

  if (timersExists || audioIsPlaying) {
    // Hide qrScanner and button to open qrScanner
    if (state.user.QRScannerIsDisplayed) {
      store.commit(Mutations.hideQRScanner);
    }
    if (state.user.QRScannerCanBeDisplayed) {
      store.commit(Mutations.hideButtonToOpenQRScanner);
    }
  }
});

export enum Mutations {
  decreaseHelpAvailable = "decreaseHelpAvailable",
  displayQRScanner = "displayQRScanner",
  hideQRScanner = "hideQRScanner",
  displayButtonToOpenQRScanner = "displayButtonToOpenQRScanner",
  hideButtonToOpenQRScanner = "hideButtonToOpenQRScanner",
  wipeHistory = "wipeHistory",
  loadGameConfig = "loadGameConfig",
  pushStationIdToStationsVisited = "pushStationIdToStationsVisited",
  addTimer = "addTimer",
  removeTimer = "removeTimer",
  setAudioStoryIsPlaying = "setAudioStoryIsPlaying",
  setAudioBackgroundIsPlaying = "setAudioBackgroundIsPlaying",
  setCurrentStation = "setCurrentStation",
  updateOpenStations = "updateOpenStations",
}
