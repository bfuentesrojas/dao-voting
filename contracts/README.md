## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## ⚠️ IMPORTANTE: Ejecutar desde el directorio contracts/

**Todos los comandos de Foundry deben ejecutarse desde el directorio `contracts/`:**

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol
```

Si ejecutas `forge build` desde la raíz del proyecto (`dao/`), obtendrás errores porque Foundry intentará compilar archivos de OpenZeppelin que no deberían compilarse.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
cd contracts
$ forge build
```

### Test

```shell
cd contracts
$ forge test
```

### Format

```shell
cd contracts
$ forge fmt
```

### Gas Snapshots

```shell
cd contracts
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
cd contracts
$ forge script script/Deploy.s.sol:DeployScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

O usar el script bash desde la raíz:
```shell
bash scripts/deploy.sh
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
