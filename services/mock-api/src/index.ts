import { createMockApp } from "./server";

export * from "./seed";
export * from "./server";

const PORT = process.env.PORT || 4000;

const isDirectRun =
  Boolean(typeof require !== "undefined" && require.main === module) ||
  process.argv[1]?.includes("index.ts") ||
  process.argv[1]?.includes("mock-api");

if (isDirectRun || process.env.RUN_MOCK_SERVER === "1") {
  const app = createMockApp();
  app.listen(PORT, () => {
    console.info(`[mock-api] Server running at http://localhost:${PORT}`);
  });
}
