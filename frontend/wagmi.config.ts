import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/lib/generated.ts",
  plugins: [
    foundry({
      project: "../contracts",
      include: [
        "MockERC20.sol/**/*.json",
        "Faucet.sol/**/*.json",
        "MockDEX.sol/**/*.json",
      ],
      // Generate hooks for all contracts
      forge: {
        build: true,
      },
    }),
  ],
});
