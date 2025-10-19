export class PythPriceFeeds {
  static readonly BTC_USD = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
  static readonly ETH_USD = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
  static readonly USDC_USD = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";
  static readonly USDT_USD = "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b";
  static readonly DAI_USD = "0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd";
  static readonly MATIC_USD = "0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52";
  static readonly HBAR_USD = "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
  static readonly LINK_USD = "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221";

  static readonly PYTH_SEPOLIA = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21";
  static readonly PYTH_HEDERA_TESTNET = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";

  static getPriceFeedId(symbol: string): string | null {
    const upperSymbol = symbol.toUpperCase();
    switch (upperSymbol) {
      case "BTC":
        return this.BTC_USD;
      case "ETH":
        return this.ETH_USD;
      case "USDC":
        return this.USDC_USD;
      case "USDT":
        return this.USDT_USD;
      case "DAI":
        return this.DAI_USD;
      case "MATIC":
        return this.MATIC_USD;
      case "HBAR":
        return this.HBAR_USD;
      case "LINK":
        return this.LINK_USD;
      default:
        return null;
    }
  }

  static getPythAddress(chainId: number): string | null {
    switch (chainId) {
      case 11155111:
        return this.PYTH_SEPOLIA;
      case 296:
        return this.PYTH_HEDERA_TESTNET;
      default:
        return null;
    }
  }
}
