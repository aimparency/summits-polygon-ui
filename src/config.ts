// import contractAddresses from files that get automatically written on deployment

export default {
  networks: {
    mumbai: {
      name: 'Mumbai (Polygon Testnet)', 
      chainId: 80001,
      url: 'https://matic-mumbai.chainstacklabs.com',
      explorer: 'https://mumbai.polygonscan.com',
      contractAddress: '825b11Fd4bc6F185c87C145fdDa032216a7Bdd2c', 
      nativeCurrency: {
        name: "MATIC", 
        decimals: 18, 
        symbol: 'MATIC'
      }
    }, 
    localnet: {
      name: 'localnet', 
      chainId: 1337, 
      url: 'http://localhost:8545',
      contractAddress: '5FbDB2315678afecb367f032d93F642f64180aa3', 
//      contractAddress: '9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', 
//      contractAddress: 'Dc64a140Aa3E981100a9becA4E685f962f0cF6C9', 
      nativeCurrency: {
        name: "LocalCoin", 
        decimals: 18, 
        symbol: 'LOCAL'
      }
    }
  } as any, 
  network: 'localnet'
}
