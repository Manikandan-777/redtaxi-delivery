/* global __ENV */
import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Gate 8 Performance Load Test (T8.8)
 * 200 concurrent passengers, p95 read < 500 ms, error rate < 1%
 */
export const options = {
  stages: [
    { duration: "5s", target: 50 },
    { duration: "10s", target: 200 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:4000";

export default function () {
  const res = http.get(`${BASE_URL}/vehicles`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "vehicles returned": (r) => r.json().length > 0,
  });
  sleep(0.5);
}
