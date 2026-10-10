import { createMockApp } from "./server";

export * from "./seed";
export * from "./server";

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  const app = createMockApp();
  app.listen(PORT, () => {
    console.info(`[mock-api] Server running at http://localhost:${PORT}`);
  });
}
