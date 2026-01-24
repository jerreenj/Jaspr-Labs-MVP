const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying JASPR contracts to Base Sepolia...");

  // Deploy MockUSDC
  console.log("\n📝 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Deploy 10 jTokens
  const tokens = [
    { name: "Jaspr Bitcoin", symbol: "jBTC" },
    { name: "Jaspr Ethereum", symbol: "jETH" },
    { name: "Jaspr Solana", symbol: "jSOL" },
    { name: "Jaspr BNB", symbol: "jBNB" },
    { name: "Jaspr XRP", symbol: "jXRP" },
    { name: "Jaspr Cardano", symbol: "jADA" },
    { name: "Jaspr Dogecoin", symbol: "jDOGE" },
    { name: "Jaspr Avalanche", symbol: "jAVAX" },
    { name: "Jaspr Toncoin", symbol: "jTON" },
    { name: "Jaspr Polygon", symbol: "jMATIC" },
  ];

  const tokenAddresses = {};
  console.log("\n📝 Deploying jTokens...");
  
  for (const token of tokens) {
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(token.name, token.symbol);
    await mockToken.waitForDeployment();
    const address = await mockToken.getAddress();
    tokenAddresses[token.symbol] = address;
    console.log(`✅ ${token.symbol} deployed to:`, address);
  }

  // Deploy SimpleAMM
  console.log("\n📝 Deploying SimpleAMM...");
  const SimpleAMM = await hre.ethers.getContractFactory("SimpleAMM");
  const amm = await SimpleAMM.deploy();
  await amm.waitForDeployment();
  const ammAddress = await amm.getAddress();
  console.log("✅ SimpleAMM deployed to:", ammAddress);

  // Save addresses
  const addresses = {
    chainId: 84532,
    network: "Base Sepolia",
    MockUSDC: usdcAddress,
    SimpleAMM: ammAddress,
    tokens: tokenAddresses,
  };

  const outputPath = "./deployed-addresses.json";
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\n💾 Addresses saved to:", outputPath);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nNext steps:");
  console.log("1. Run: node scripts/seed-liquidity.js");
  console.log("2. Copy addresses to frontend/src/config/contracts.js");
  console.log("3. Start the app: cd frontend && npm start");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });