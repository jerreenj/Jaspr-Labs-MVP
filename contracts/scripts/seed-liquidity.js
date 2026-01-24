const hre = require("hardhat");
const fs = require("fs");
const { parseUnits } = require("ethers");

async function main() {
  console.log("🌊 Seeding liquidity to SimpleAMM...");

  // Load addresses
  const addresses = JSON.parse(fs.readFileSync("./deployed-addresses.json", "utf8"));
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n👤 Using deployer:", deployer.address);

  // Get contracts
  const usdc = await hre.ethers.getContractAt("MockUSDC", addresses.MockUSDC);
  const amm = await hre.ethers.getContractAt("SimpleAMM", addresses.SimpleAMM);

  // Mint tokens to deployer
  console.log("\n💰 Minting tokens to deployer...");
  
  // Mint 100,000 USDC
  const usdcAmount = parseUnits("100000", 6);
  await usdc.mint(deployer.address, usdcAmount);
  console.log("✅ Minted 100,000 USDC");

  // Mint jTokens
  for (const [symbol, address] of Object.entries(addresses.tokens)) {
    const token = await hre.ethers.getContractAt("MockToken", address);
    const amount = parseUnits("10000", 18); // 10,000 tokens
    await token.mint(deployer.address, amount);
    console.log(`✅ Minted 10,000 ${symbol}`);
  }

  // Create pools and add liquidity
  console.log("\n🏊 Creating pools and adding liquidity...");

  const liquidityPairs = [
    { symbol: "jBTC", usdcPerToken: "50000" }, // 1 jBTC = 50,000 USDC
    { symbol: "jETH", usdcPerToken: "3000" },  // 1 jETH = 3,000 USDC
    { symbol: "jSOL", usdcPerToken: "100" },   // 1 jSOL = 100 USDC
    { symbol: "jBNB", usdcPerToken: "300" },   // 1 jBNB = 300 USDC
    { symbol: "jXRP", usdcPerToken: "2" },     // 1 jXRP = 2 USDC
    { symbol: "jADA", usdcPerToken: "0.5" },   // 1 jADA = 0.5 USDC
    { symbol: "jDOGE", usdcPerToken: "0.1" },  // 1 jDOGE = 0.1 USDC
    { symbol: "jAVAX", usdcPerToken: "30" },   // 1 jAVAX = 30 USDC
    { symbol: "jTON", usdcPerToken: "5" },     // 1 jTON = 5 USDC
    { symbol: "jMATIC", usdcPerToken: "0.8" }, // 1 jMATIC = 0.8 USDC
  ];

  for (const pair of liquidityPairs) {
    const tokenAddress = addresses.tokens[pair.symbol];
    const token = await hre.ethers.getContractAt("MockToken", tokenAddress);

    // Calculate amounts for 1:1 ratio in terms of value
    const tokenAmount = parseUnits("100", 18); // 100 tokens
    const usdcAmount = parseUnits((100 * parseFloat(pair.usdcPerToken)).toString(), 6);

    // Approve
    await usdc.approve(addresses.SimpleAMM, usdcAmount);
    await token.approve(addresses.SimpleAMM, tokenAmount);

    // Create pool
    try {
      await amm.createPool(addresses.MockUSDC, tokenAddress);
      console.log(`📦 Created pool: USDC/${pair.symbol}`);
    } catch (e) {
      console.log(`⚠️  Pool USDC/${pair.symbol} already exists`);
    }

    // Add liquidity
    await amm.addLiquidity(addresses.MockUSDC, tokenAddress, usdcAmount, tokenAmount);
    console.log(`✅ Added liquidity: ${pair.usdcPerToken} USDC per ${pair.symbol}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 LIQUIDITY SEEDING COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n✅ All 10 pools created and funded");
  console.log("✅ Ready for trading!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });