const core = require("@actions/core");
const { run } = require("./main");

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});

