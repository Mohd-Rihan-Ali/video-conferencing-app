import { ADD_PEER, REMOVE_PEER } from "./peerActions";

// this is the typescript types for our states
// where key is 'string' and value is 'MediaStream'
export type PeerState = Record<string, { stream: MediaStream }>;
// export type PeerState = Record<string, { _id: string; stream: MediaStream }>;

// types for our peer actions
// this is union type
export type PeerAction =
  | {
      type: typeof ADD_PEER;
      payload: { peerId: string; stream: MediaStream };
    }
  | {
      type: typeof REMOVE_PEER;
      payload: {
        peerId: string  
      };
    };

// reducer function for tackling the changes in the state


// will filter our states, will remove the peers
// using ES6 syntax

export const peersReducer = (state: PeerState, action: PeerAction) => {
  switch (action.type) {
    case ADD_PEER:
      return {
        ...state,
        [action.payload.peerId]: {
          peerId: action.payload.peerId, // Add the _id property
          stream: action.payload.stream,
        },
      };

    case REMOVE_PEER:
      const { [action.payload.peerId]: deleted, ...rest } = state;
      return rest;
    default:
      return { ...state };
  }
};
