// map from chainId to summits contract
export interface Currency {
  name: string, 
  symbol: string,
}

export interface NetworkInfo {
  addr: string, 
  nativeCurrency: Currency 
}

export default {
  5: {
    addr: '0x0baBF216a5815F0567f400bAF94b72F57eeF07B9', 
    nativeCurrency: {
      name: 'GoerliEthereum',
      symbol: 'ETH',
    }
  }, 
  1337: {
    addr: '5FbDB2315678afecb367f032d93F642f64180aa3', 
    nativeCurrency: {
      name: 'localnetCurrency',
      symbol: 'ETH',
    }
  }, 
  80001: {
    addr: '825b11Fd4bc6F185c87C145fdDa032216a7Bdd2c', 
    nativeCurrency: {
      name: 'MumbaiMatic',
      symbol: 'MATIC',
    }
  }
} as {[chainId: number]: NetworkInfo};
