let config = {'secret': 'supersecret'}  
if(process.env.NODE_ENV == 'development'){
  config.contractAddress = "0x84D31b0247e4A19B804d53ab771FF10193CA65b1"
}
else if(process.env.NODE_ENV == "local"){
  process.env.RPC_URL="http://127.0.0.1:8545/"
  config.contractAddress="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
}
else{
  config.contractAddress = "0x1Da30b291e0b94F5da1e7B2BC08612661232CB68"
}

module.exports.config = config;