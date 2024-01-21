import fs from 'fs';
import { Web3 } from 'web3';

const endpoint = 'https://eth.llamarpc.com';
const contractAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
const abi = JSON.parse(fs.readFileSync("./contracts/poolAbi.json", "utf-8"));
const web3 = new Web3(endpoint);
const contract = new web3.eth.Contract(abi, contractAddress, web3);

function toEther(amount) {
  const round = 100000n
  const val = amount * round / 10n ** 18n;
  return val < Number.MAX_SAFE_INTEGER
    ? Number(val) / Number(round)
    : null
}

function estimateFacotr(factor) {
  if (factor <= 1.0) {
    return 'hight'
  } else if (factor > 1.0 && factor <= 3.0) {
    return 'medium'
  } else {
    return 'low'
  }
}

async function main() {
  const addresses = process.argv.slice(2);
  if (addresses.length === 0) throw new Error('addresses not provided')

  const accountsData = await Promise.all(addresses.map(address => contract.methods.getUserAccountData(address).call()));
  const result = accountsData.map((data, i) => ({
    address: addresses[i],
    factor: toEther(data.healthFactor)
  }));

  result.forEach(item => {
    const message = item.factor === null
      ? `${item.address} | the address does not use aave or borrowing`
      : `${item.address} | factor: ${item.factor}, liquidation risk: ${estimateFacotr(item.factor)}`
    console.log(message)
  });
}

main()
  .catch(e => {
    console.log(`Failed to execute script: ${e.message.toLowerCase()}`)
  })