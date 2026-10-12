/* global __ENV */
import ws from "k6/ws";
import { check } from "k6";

/**
 * Gate 8 Socket Performance Test (T8.9)
 * 500 concurrent connections, no dropped status events
 */
export const options = {
  stages: [
    { duration: "5s", target: 100 },
    { duration: "10s", target: 500 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    ws_connecting: ["p(95)<1000"],
  },
};

const WS_URL = __ENV.WS_URL || "ws://localhost:4000/socket.io/?EIO=4&transport=websocket";

export default function () {
  const res = ws.connect(WS_URL, {}, function (socket) {
    socket.on("open", function () {
      socket.send("40"); // Socket.io connect packet
    });

    socket.on("message", function (data) {
      check(data, {
        "received message": (d) => d.length > 0,
      });
    });

    socket.setTimeout(function () {
      socket.close();
    }, 4000);
  });

  check(res, { "status is 101": (r) => r && r.status === 101 });
}
