import {
  ReactNode,
  createContext,
  useEffect,
  useState,
  useReducer,
} from "react";
import { useNavigate } from "react-router-dom";
import socketIOClient from "socket.io-client";
import Peer from "peerjs";
import { v4 as uuidV4 } from "uuid";
import { peersReducer, PeerAction, PeerState } from "./peerReducer";
import { addPeerAction, removePeerAction } from "./peerActions";
import { connect } from "http2";

// URL link for our server
const WS = "http://localhost:8080";

// this is the room context
export const RoomContext = createContext<null | any>(null);

// connecting our web socket
const ws = socketIOClient(WS);

// the room provider
export const RoomProvider: React.FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [me, setMe] = useState<Peer>(); // for setting up the peer id
  const [peers, dispatch] = useReducer(peersReducer, {}); // 'peers' is basically our state
  const [stream, setStream] = useState<MediaStream>(); // for getting the media devices
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const enterRoom = ({ roomId }: { roomId: "string" }) => {
    navigate(`/room/${roomId}`);
    console.log(roomId);
  };
  const getUsers = ({ participants }: { participants: string[] }) => {
    console.log(participants);
  };

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  };

  // for switching back to our stream i.e. video
  const switchStream = (stream: MediaStream) => {
    setStream(stream);
    setScreenSharingId(me?.id || "");

    // for getting all connections of the current users. since we want to share our screen to all peers
    // for each connection we want to replace the video track of the stream
    Object.values(me?.connections || {}).forEach((connection: any) => {
      const videoTrack = stream
        ?.getTracks()
        .find((track) => track.kind === "video");
      connection[0].peerConnection
        .getSenders()[1]
        .replaceTrack(videoTrack)
        .catch((err: any) => console.log(err));
    });
  };

  // for sharing the screne
  const shareScreen = () => {
    if (screenSharingId) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(switchStream);
    } else {
      navigator.mediaDevices.getDisplayMedia({}).then(switchStream);
    }
  };

  // this try-catch block is for getting the video-audio
  useEffect(() => {
    const meId = uuidV4();

    const peer = new Peer(meId); // creating our peer with this unique id
    setMe(peer); // setting to our state

    try {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);
        });
    } catch (error) {
      console.log(error);
    }

    ws.on("room-created", enterRoom); // listening for our event, room created
    ws.on("get-users", getUsers); // listening to the event where every participant can see the list of all other joined participants
    ws.on("user-disconnected", removePeer);
    ws.on("user-started-sharing", (peerId) => setScreenSharingId(peerId));
    ws.on("user-stopped-sharing", () => setScreenSharingId(""));

    // we should unsubscribe when our useEffect is not mounted otherwise it may lead to memory leak
    return () => {
      ws.off("room-created");
      ws.off("user-joined");
      ws.off("get-users");
      ws.off("user-disconnected");
      ws.off("user-started-sharing");
      ws.off("user-stopped-sharing");
    };
  }, []);

  // we want to share this screenSharingId with our web-socket server
  useEffect(() => {
    if (screenSharingId) {
      ws.emit("start-sharing", { peerId: screenSharingId, roomId });
    } else {
      ws.emit("stop-sharing");
    }
  }, [screenSharingId, roomId]);

  // for checking and getting the user and it's media stream

  // for every new user who will join we will call him/her and wil pass stream to him/her
  // listening
  // initiating the call and sending our stream

  // our user who just joined, will make a event listner and will dispatch the stream of the user

  // every user who calls us, we will listen to the call event and will answer with our own stream
  // answering to the peers call and also sending our stream

  useEffect(() => {
    if (!me) return;
    if (!stream) return;

    // ws.on("user-joined", ({ peerId }) => {
    //   const call = me.call(peerId, stream);
    //   call.on("stream", (peerStream) => {
    //     dispatch(addPeerAction(peerId, peerStream));
    //   });
    // });

    ws.on("user-joined", ({ peerId }) => {
      setTimeout(connectToNewUser, 2000, peerId);
    });

    const connectToNewUser = (peerId: string) => {
      const call = me.call(peerId, stream);
      call.on("stream", (peerStream) => {
        dispatch(addPeerAction(peerId, peerStream));
      });
    };

    me.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (peerStream) => {
        dispatch(addPeerAction(call.peer, peerStream));
      });
    });
  }, [me, stream]);

  console.log({ peers });

  return (
    <RoomContext.Provider
      value={{
        ws,
        me,
        stream,
        peers,
        shareScreen,
        roomId,
        setRoomId,
        screenSharingId,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
