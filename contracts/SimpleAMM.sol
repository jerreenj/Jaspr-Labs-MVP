// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleAMM is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }

    mapping(bytes32 => Pool) public pools;
    uint256 public constant FEE_PERCENT = 3; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 1000;

    event PoolCreated(address indexed tokenA, address indexed tokenB, bytes32 poolId);
    event LiquidityAdded(bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(bytes32 indexed poolId, address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);

    function getPoolId(address tokenA, address tokenB) public pure returns (bytes32) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encodePacked(token0, token1));
    }

    function createPool(address tokenA, address tokenB) external returns (bytes32) {
        require(tokenA != tokenB, "Identical tokens");
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.tokenA == address(0), "Pool exists");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pool.tokenA = token0;
        pool.tokenB = token1;
        
        emit PoolCreated(token0, token1, poolId);
        return poolId;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256 liquidity) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool does not exist");

        (uint256 amount0, uint256 amount1) = tokenA < tokenB ? (amountA, amountB) : (amountB, amountA);
        
        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), amount1);

        if (pool.totalLiquidity == 0) {
            liquidity = sqrt(amount0 * amount1);
        } else {
            liquidity = min(
                (amount0 * pool.totalLiquidity) / pool.reserveA,
                (amount1 * pool.totalLiquidity) / pool.reserveB
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");
        
        pool.reserveA += amount0;
        pool.reserveB += amount1;
        pool.totalLiquidity += liquidity;
        pool.liquidity[msg.sender] += liquidity;

        emit LiquidityAdded(poolId, msg.sender, amount0, amount1, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity");

        uint256 amount0 = (liquidity * pool.reserveA) / pool.totalLiquidity;
        uint256 amount1 = (liquidity * pool.reserveB) / pool.totalLiquidity;

        pool.liquidity[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amount0;
        pool.reserveB -= amount1;

        IERC20(pool.tokenA).safeTransfer(msg.sender, amount0);
        IERC20(pool.tokenB).safeTransfer(msg.sender, amount1);

        (amountA, amountB) = tokenA < tokenB ? (amount0, amount1) : (amount1, amount0);
        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, liquidity);
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool does not exist");
        require(amountIn > 0, "Amount must be > 0");

        bool isToken0 = tokenIn < tokenOut;
        (uint256 reserveIn, uint256 reserveOut) = isToken0 
            ? (pool.reserveA, pool.reserveB) 
            : (pool.reserveB, pool.reserveA);

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENT);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
        
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut < reserveOut, "Insufficient liquidity");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        if (isToken0) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        emit Swap(poolId, msg.sender, tokenIn, amountIn, amountOut);
    }

    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        Pool storage pool = pools[poolId];
        require(pool.tokenA != address(0), "Pool does not exist");

        bool isToken0 = tokenIn < tokenOut;
        (uint256 reserveIn, uint256 reserveOut) = isToken0 
            ? (pool.reserveA, pool.reserveB) 
            : (pool.reserveB, pool.reserveA);

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENT);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }

    function getReserves(address tokenA, address tokenB) external view returns (uint256 reserveA, uint256 reserveB) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        (reserveA, reserveB) = tokenA < tokenB 
            ? (pool.reserveA, pool.reserveB) 
            : (pool.reserveB, pool.reserveA);
    }

    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}