import React, { Component, useEffect } from 'react'
import { BigNumber, ethers } from 'ethers'
import styles from '../styles/Home.module.css'
import { ConnectWallet } from '../components/ConnectWallet'
import shopAddress from '../contracts/DDWorldShop-contract-address.json'
import shopArtifacts from '../contracts/DDWorldShop.json'
import token from '../contracts/token-address.json'
import tokenJSON from 'D:/solidity/ERC 20/artifacts/contracts/Erc.sol/DDWorldToken.json'

const HARDHAT_NETWORK_ID = '1337'
const ERROR_CODE_TX_REJECTED_BY_USER = 4001

export default class extends Component {
  constructor(props) {
    super(props)

    this.initialState = {
      selectedAccount: null,
      networkError: null,
      balance: null,  
      amount: null,
      tokenBalance: null
    }
   
    this.state = this.initialState
    this.tokenToBuy = React.createRef();
    this.amountToSell = React.createRef();
    this.amountToTransfer = React.createRef();
    this.tokenTransferTo = React.createRef();
  }

  _connectWallet = async () => {
    if(window.ethereum === undefined) {
      this.setState({
        networkError: 'Please install Metamask!'
      })
      return
    }

    const [selectedAddress] = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    if(!this._checkNetwork()) { return }

    this._initialize(selectedAddress)

    window.ethereum.on('accountsChanged', ([newAddress]) => {
      if(newAddress === undefined) {
        return this._resetState()
      }

      this._initialize(newAddress)
    })

    window.ethereum.on('chainChanged', ([networkId]) => {
      this._resetState()
    })
    
  }

  async _initialize(selectedAddress) {
    
    this._provider = new ethers.providers.Web3Provider(window.ethereum)
   
    this._DDWShop = new ethers.Contract(
      shopAddress.DDWorldShop,
      shopArtifacts.abi,
      this._provider.getSigner(0)
    )
    this.erc20 = new ethers.Contract(
      token.tokenAddress, 
      tokenJSON.abi, 
      this._provider.getSigner(0)
    )

    this.setState({
      selectedAccount: selectedAddress
    }, async () => 
      await this.updateBalance()
  )
  this._balanceOf()
  const tx = await this._DDWShop._tokenbalance(selectedAddress)
  this.setState({
    tokenBalance: Number(tx)/1000000000
  })
 
  }
 
  async updateBalance() {
    const newBalance = (await this._provider.getBalance(
      this.state.selectedAccount
    )).toString()

    this.setState({
      balance: newBalance
    })
  }


_buy = async () => {
  let buyToken = this.tokenToBuy.current.value
  console.log(buyToken);
  const txData = {
    value: buyToken,
    gasLimit: ethers.utils.hexlify(100000)
  }

  const tx = await this._DDWShop.buy(txData)
  await tx.wait()
  this._balanceOf()
  const tx1 = await this._DDWShop._tokenbalance(this.state.selectedAccount)
  this.setState({
    tokenBalance: Number(tx1)/1000000000
  })
}

_transfer = async () => {
  let amount = this.amountToTransfer.current.value;
  let address = this.tokenTransferTo.current.value
  const txData = { 
    gasLimit: ethers.utils.hexlify(100000)
  }
  const tx1 = await this.erc20.approve(address.toString(),amount,txData)
  await tx1.wait()
  
  const tx = await this._DDWShop.transferTo(address.toString(),amount,txData)
  this._balanceOf()
  const tx2 = await this._DDWShop._tokenbalance(this.state.selectedAccount)
  this.setState({
    tokenBalance: Number(tx2)/1000000000
  })
}
_sell = async () =>{
  let amount = this.amountToSell.current.value
  console.log(amount);
  const tx1 = await this.erc20.approve(this._DDWShop.address, amount,{
    gasLimit: ethers.utils.hexlify(100000)
  })
  await tx1.wait()
  const txData = {
    gasLimit: ethers.utils.hexlify(100000)
  }
  const tx = await this._DDWShop.sell(amount, txData)
  this._balanceOf()
  const tx2 = await this._DDWShop._tokenbalance(this.state.selectedAccount)
  this.setState({
    tokenBalance: Number(tx2)/1000000000
  })
}
  _balanceOf = async () => { 
    const balance = await this._DDWShop.tokenBalance()
    this.setState({
      amount:  Number(balance)
    })
  }
  
  _resetState() {
    this.setState(this.initialState)
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) { return true }

    this.setState({
      networkError: 'Please connect to localhost:8545'
    })

    return false
  }

  _dismissNetworkError = () => {
    this.setState({
      networkError: null
    })
  }

  _dismissTransactionError  = () => {
    this.setState({
      transactionError: null 
    })
  }

 
_getRpcErrorMessage(error){
   if (error.data) {
    return error.data.message
   }
   return error.message
}
  render() {
    if(!this.state.selectedAccount) {
      return <ConnectWallet
        connectWallet={this._connectWallet}
        networkError={this.state.networkError}
        dismiss={this._dismissNetworkError}
      />
    }else{
      
        
      
       
      
    return(
      <>
        
       <div className={styles.container}>
        <p className={styles.name}>DDW Token Marketplace </p>
        <div className={styles.containerBalance}>
        <div style={{display:"flex"}}>
        <div className={styles.tokenAmount} style={{margin:"auto",display:"flex"}}> token amount: {this.state.amount}</div>
       </div>
       <p className={styles.tokenBalance}>{this.state.tokenBalance} DDW</p> 
       
       {this.state.balance &&
       <p className={styles.balance}>{ethers.utils.formatEther(this.state.balance).slice(0,10)} ETH</p>}
       
       </div>
       
    <div className={styles.containerBalance} style={{marginTop:"30px"}}>
        
       <div className={styles.balance} style={{marginTop:"10px"}}>token to buy <br></br><input ref={this.tokenToBuy}></input></div>
       <div className={styles.balance} style={{marginTop:"10px"}}><button className={styles.button} onClick = {this._buy}> buy </button></div>
        
        <div className={styles.balance} style={{marginTop:"10px"}}> amount to sell <br></br><input ref={this.amountToSell}></input></div>
        <div className={styles.balance} style={{marginTop:"10px"}}><button className={styles.button} onClick = {this._sell}> sell </button></div>
        
        <div className={styles.balance} style={{marginTop:"10px"}}> amount to transfer <br></br><input ref={this.amountToTransfer}></input> <br></br>  address to transfer <br></br> <input ref={this.tokenTransferTo}></input> </div>
        

        <div className={styles.balance} style={{marginTop:"10px"}}><button className={styles.button} onClick = {this._transfer}>transfer token</button></div>
        
        
    </div>
      
      
        
        <div >
        </div>
        
        </div>
      </>
    )
    }
    
  }
}     