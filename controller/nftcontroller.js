var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
// var cookieSession = require('cookie-session')
const fs = require('fs')
var nftvrCollection = require("../models/nftvr");
var user = require("../models/user");
var cart = require("../models/cart");
var nftRoomCollection = require("../models/nftRoom");
var nftPriceCollection = require("../models/nftPrice");
var config = require("../config");
const uuid = require('uuid');
var config = require("../config").config;
// import axios from 'axios';
var axios = require('axios');
// var nftDummy = require("../models/dummy");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;

const API_URL = process.env.API_URL
const adminUser = process.env.PUBLIC_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY
const buyerPublicAddress = process.env.PUBLIC_KEY_BUYER
const buyerPrivateKey = process.env.PRIVATE_KEY_BUYER
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");

let provider = new HDWalletProvider({
    mnemonic: {
        phrase: process.env.mnemonic
    },
    providerOrUrl: API_URL
});

// const API_URL = process.env.API_URL
// const adminUser = process.env.PUBLIC_KEY
// const PRIVATE_KEY = process.env.PRIVATE_KEY
// const publickey = "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// const buyerPublicKey = "70997970C51812dc3A010C7d01b50e0d17dc79C8"
// const secondBuyerPublickey = "3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
// const HDWalletProvider = require("@truffle/hdwallet-provider");
// const Web3 = require("web3");
// let provider = new HDWalletProvider({
//     mnemonic: {
//         phrase: process.env.mnemonic
//     },
//     providerOrUrl: API_URL
// });

// let provider = new HDWalletProvider("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", "http://localhost:8545");
// const privateKeys = [
//     "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
//     "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
//     "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
// ];
// provider = new HDWalletProvider(privateKeys, "http://localhost:8545", 0, 3);
const web3 = new Web3(provider);
web3.setProvider(provider);

// const web3 = new Web3(provider);
// web3.setProvider(provider);

const contract = require('../abis/NFTVR.json')
const contractAddress = config.contractAddress;
const nftContract = new web3.eth.Contract(contract.abi, contractAddress)

const pinataSDK = require('@pinata/sdk');
const { nextTick } = require("process");
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

const registerUser = async (req, res) => {

    var newUser = new user();

    newUser.userId = uuid.v4()
    newUser.userName = req.body.userName;
    newUser.password = bcrypt.hashSync(req.body.password, 8)

    console.log(newUser.userName, newUser.password);

    if (newUser.userName == "neosoft") {
        newUser.isAdmin = true;
        newUser.save(function (err) {
            if (err) {
                if (err.code == 11000) {
                    res.status(400).json({ message: 'User already exists' });
                } else {
                    res.status(400).send(err);
                }
            }
            else {
                res.status(200).json({
                    message: 'User created',
                    admin: newUser.isAdmin
                });
            }
        });
    }
    else {
        newUser.isAdmin = false;
        newUser.save(function (err) {
            if (err) {
                if (err.code == 11000) {
                    res.status(400).json({
                        message: 'User already exists',
                        admin: newUser.isAdmin
                    });
                }
            }
            else {
                res.status(200).json({
                    message: 'User created',
                    admin: newUser.isAdmin
                });
            }
        });
    }
}

const loginUser = async (req, res) => {
    try {
        let findUser = await user.findOne({ userName: req.body.userName })
        console.log(findUser, "finduser");
        if (!findUser) { return res.status(404).send({ message: "User Not found." }); }
        else {
            var passwordIsValid = bcrypt.compareSync(req.body.password, findUser.password);

            if (!passwordIsValid) {
                return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
            }

            let id = findUser.userId.toString();
            console.log(findUser.userName, "name-------------");
            console.log(findUser.isAdmin, "admin-------------");

            var token = jwt.sign({ id, isAdmin: findUser.isAdmin }, config.secret, {
                expiresIn: 86400
            });
        }
        res.status(200).send({
            user: { id: findUser.userId, userName: findUser.userName },
            message: "Login successfull",
            accessToken: token,
            admin: findUser.isAdmin,
        });
    }
    catch (err) {
        console.log(err, "==> error");
    }
};

const uploadNft = async (req, res) => {
    const folderName = 'MetaData'
    try {
        // let findUser = await user.findOne({ userName: req.body.userName })
        let findAdmin = await user.findOne({ userId: req.body.id, isAdmin: true });

        if (findAdmin == null) {
            res.status(400).send({ message: "Only the Admin is allowed to Upload NFTs" });
        }

        else {
            const img = req.file.filename;
            const imgName = req.body.imgName;
            const imgDescription = req.body.imgDescription;

            console.log(img, imgName, imgDescription, "<==data");
            if (!fs.existsSync(folderName)) {
                fs.mkdirSync(folderName);
            }

            const pinFile = async (filePath) => {
                const readableStreamForFile = fs.createReadStream(filePath);
                try {
                    const response = await pinata.pinFileToIPFS(readableStreamForFile);
                    return response;
                }
                catch (err) {
                    res.status(400).send("Something went wrong", err);
                }
            }

            const response = await pinFile(`./uploads/${img}`);

            if (response) {
                const metaData = {
                    fileid: Math.floor(Math.random() * 100000),
                    name: imgName,
                    description: imgDescription,
                    image: `https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`
                }

                fs.writeFile('./MetaData/metadata.json', JSON.stringify(metaData), async (err) => {
                    if (err) {
                        res.status(400).send("Something went wrong", err);
                    }
                    else {
                        let result = await pinFile("./MetaData/metadata.json");

                        let ipfsHash = result.IpfsHash;

                        let saveMetadata = new nftvrCollection({
                            userId: req.body.id,
                            tokenHash: ipfsHash,
                            nftName: metaData.name,
                            nftDescritption: metaData.description,
                            nftImage: metaData.image
                        })
                        saveMetadata.save();

                        res.status(200).send({
                            message: "File successfully pinned to Pinata",
                            fileIPFSHash: ipfsHash
                        });
                    }
                })
            }
        }

    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const mintNft = async (req, res) => {
    try {
        console.log(req.body.id, "<== current user");
        let findAdmin = await user.findOne({ userId: req.body.id, isAdmin: true });
        console.log(findAdmin);

        if (findAdmin == null) {
            res.status(400).send({ message: "Only the Admin is allowed to Mint NFTs" });
        }
        else {
            const nftHash = req.body.nftHash;
            const nftSetPrice = req.body.nftPrice;
            console.log("NFT details ==>", nftHash, nftSetPrice);

            let newNftPrice = web3.utils.toWei(nftSetPrice.toString(), "ether").toString();
            console.log("newNftPrice ==>", newNftPrice);

            let transactionReceipt = await nftContract.methods.mintNFT(adminUser, nftHash, newNftPrice).send({ from: adminUser })
            console.log("transactionReceipt==>", transactionReceipt.status);

            if (transactionReceipt.status == true) {
                console.log("inside if");
                let nftTokenId = await nftContract.methods.getTokendata().call()
                console.log("nftTokenId", nftTokenId);
                let successfulOrNot = await nftvrCollection.updateOne({ tokenHash: nftHash }, { tokenId: nftTokenId, nftCurrentPrice: nftSetPrice });
                if (successfulOrNot) {
                    res.status(200).send({
                        message: "Mint Successful",
                        tokenId: nftTokenId,
                        transactionHash: process.env.ETHERSCAN_DOMAIN + transactionReceipt.transactionHash
                    });
                }
            }
            else {
                res.status(400).send("Error while minting NFT");
            }
        }
    }
    catch (err) {
        // res.status(400).send(err);
        res.status(400).send("Something went wrong", err);
    }
}

const addRoomIdToTokenId = async (req, res) => {
    try {

        let _nft = new nftvrCollection({
            userId: req.body.id,
            roomId: req.body.roomId,
            tokenId: req.body.tokenId,
        });
        console.log(_nft.tokenId, "room id");

        let findAdmin = await user.findOne({ userId: req.body.id, isAdmin: true });
        if (findAdmin == false) {
            res.status(400).send({ message: "Only the Admin is allowed to Add NFTs to Rooms" });
        }
        else {
            let findRoom = await nftRoomCollection.findOne({ roomNumber: _nft.roomId });
            console.log(findRoom);
            if (findRoom == null) {
                res.status(400).send({ message: "The Room does not exist" });
            }
            else {
                let findTokenIdExists = await nftvrCollection.findOne({ tokenId: _nft.tokenId });

                if (findTokenIdExists != null) {

                    let addData = await nftvrCollection.updateOne({ tokenId: _nft.tokenId }, { roomId: _nft.roomId });

                    if (addData) {
                        res.status(200).send({
                            message: "NFT added to the Room"
                        });
                    }
                }
                else {
                    res.status(400).send({
                        message: "Token ID does not exists"
                    })
                }
            }
        }
    }
    catch (err) {
        res.status(400).send({
            message: "Something went wrong",
            error: err.message
        });
    }
}

const getNftDetails = async (req, res) => {
    try {
        let nftArray = []

        const roomId = Number(req.params.roomid);

        let getNftPresentInRoom = await nftvrCollection.find({ roomId: roomId });

        for (let nftViewAll of getNftPresentInRoom) {

            let resultArray = [];

            let saleHistoryOfNft = await nftPriceCollection.find({ tokenId: nftViewAll.tokenId });

            if (saleHistoryOfNft.length > 0) {
                for (let result of saleHistoryOfNft) {
                    if (result.buyer != null && result.buyer != "") {
                        resultArray.push({
                            result
                        })
                    }
                }
            }
            nftArray.push({
                NFTDetails: nftViewAll,
                NFTSaleHistory: resultArray
            })
        }
        res.status(200).send(nftArray);
    }
    catch (err) {
        res.status(400).send("Something went wrong" + err);
    }
}

const addToCart = async (req, res) => {
    try {
        const addToCart = new cart({
            userId: req.body.id,
            tokenId: req.body.tokenId
        });
        console.log(addToCart, "user cart");
        let nftTokenId = await nftvrCollection.findOne({ tokenId: addToCart.tokenId });
        if (nftTokenId == null) {
            res.status(400).send({
                message: "NFT Token ID does not exists"
            });
        }
        else {
            let findNft = await cart.findOne({ tokenId: addToCart.tokenId, userId: addToCart.userId });
            if (findNft == null) {
                addToCart.save((err, addToCart) => {
                    if (err) {
                        res.status(400).send("Something went wrong", err);
                        return;
                    }
                    else {
                        res.status(200).send({
                            message: "NFT ID " + addToCart.tokenId + " is added to cart successfully"
                        });
                    }
                });
            }
            else {
                res.status(409).send({
                    message: "NFT is already in cart"
                });
            }
        }
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const setApprovalForAlltoken = async (req, res) => {
    try {
        let setApprove = await nftContract.methods.setApprovalForAll(adminUser, true).send({ from: buyerPublicAddress });
        if (setApprove.status) {
            res.status(200).send({
                message: "NFTs Approved"
            });
        }
    }
    catch (err) {
        res.status(400).send({
            message: "SetApproval for all failed",
            error: err.message
        });
    }
}

const transferOwnership = async (req, res) => {
    try {
        let from = req.body.currentOwnerAddress;
        let to = req.body.newOwnerAddress;
        let tokenId = req.body.nftId;

        let findNftPrice = await nftvrCollection.findOne({ tokenId: req.body.nftId });
        if (findNftPrice == null) {
            res.status(400).send({
                message: "Token ID does not exists"
            })
        }
        const saveHistory = new nftPriceCollection({
            seller: from,
            buyer: to,
            tokenId: tokenId,
            nftPrice: findNftPrice.nftCurrentPrice
        });

        let receipt = await nftContract.methods.transferFrom(from, to, tokenId).send({ from: adminUser });
        if (receipt.status) {

            saveHistory.save();

            res.status(200).send({
                message: "Ownership transfer successful",
                transactionHash: receipt.transactionHash
            });
        }
        else {
            res.status(400).send({
                message: "Failure due to network error"
            });
        }
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const updateNFTPrice = async (req, res) => {
    try {
        let updateNftPriceByOwner = req.body.nftOwnerAddress;

        const updateNftPrice = new nftvrCollection({
            tokenId: req.body.tokenId,
            nftCurrentPrice: req.body.price
        })

        let newNftPrice = web3.utils.toWei(updateNftPrice.nftCurrentPrice.toString(), "ether").toString()

        nftTokenId = updateNftPrice.tokenId;

        let getNftOwner = await nftContract.methods.ownerOf(nftTokenId).call();
        console.log(getNftOwner, "Owner of the nft");
        if (getNftOwner != "0x" + updateNftPriceByOwner || getNftOwner != updateNftPriceByOwner) {
            res.status(400).send({
                message: "Cannot update the nft price. not the owner"
            });
        }
        else {
            let setCurrentNftPrice = await nftContract.methods.updateNftPrice(updateNftPrice.tokenId, newNftPrice).send({ from: updateNftPriceByOwner });

            if (setCurrentNftPrice.status) {
                let findTokenIdPriceToUpdate = await nftvrCollection.findOne({ tokenId: updateNftPrice.tokenId });

                if (findTokenIdPriceToUpdate == null) {
                    updateNftPrice.save(() => {
                        res.status(200).json({
                            message: "Price of NFT token ID is set successfully"
                        });
                    })
                }
                else {
                    let result = await nftvrCollection.updateOne({ tokenId: req.body.tokenId }, { nftCurrentPrice: req.body.price });
                    if (result != null) {
                        res.status(200).json({
                            message: "Price of NFT token ID " + req.body.tokenId + " updated successfully"
                        });
                    }
                    else {
                        res.status(400).send("Something went wrong");
                    }
                }
            }
        }
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const showAllNFTs = async (req, res) => {
    try {
        let ary = []
        let getAllNftFromNFTVRCollection = await nftvrCollection.find({});

        for (let NFTs of getAllNftFromNFTVRCollection) {
            let nftSale = []
            let results = await nftPriceCollection.find({ tokenId: NFTs.tokenId });
            if (results.length > 0) {
                for (let result of results) {
                    if (result.buyer != null && result.buyer != "") {
                        nftSale.push({
                            result
                        })
                    }
                }
            }
            ary.push({
                NFTDetails: NFTs,
                NFTSaleHistory: nftSale
            });
        }
        res.status(200).json(ary);
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const showNFTsToBeMinted = async (req, res) => {
    try {
        let findAllNftsToBeMinted = await nftvrCollection.find({ tokenId: null });
        res.status(200).json({ findAllNftsToBeMinted });
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const showAllUserNFTs = async (req, res) => {
    try {
        let showUserNft = [];
        let onlyUploaded = [];
        let onlyMinted = [];
        let findAllUserNft = await nftvrCollection.find();

        for (let findNftForCurrentUser of findAllUserNft) {
            if (findNftForCurrentUser.userId == req.body.id) {
                showUserNft.push({ NFT: findNftForCurrentUser })
                if (findNftForCurrentUser.tokenId == null) {
                    onlyUploaded.push({ NFT: findNftForCurrentUser })
                }
                else {
                    onlyMinted.push({ NFT: findNftForCurrentUser })
                }
            }
        }
        let uploadOnly = onlyUploaded.length
        let mintOnly = onlyMinted.length

        res.status(200).send({
            Uploaded: uploadOnly,
            Minted: mintOnly,
            showUserNft
        });
    }
    catch (err) {
        res.status(400).send(err);
    }
}

const getNftOwner = async (req, res) => {
    try {
        let nftTokenId = req.body.nftTokenId;
        let nftOwner = await nftContract.methods.ownerOf(nftTokenId).call()
        res.status(200).send(nftOwner);
    }
    catch (err) {
        res.status(400).send(err);
    }
}

const createNewRoom = async (req, res) => {
    try {
        console.log("inside try");
        let findAdmin = await user.findOne({ userId: req.body.id, isAdmin: true });
        console.log(findAdmin, "findAdmin");
        // findAdmin = findAdmin.isAdmin;
        // console.log(findAdmin, "findAdmin");
        if (findAdmin == null) {
            res.status(400).send({ message: "Only the Admin is allowed to create a room" });
        }
        else {
            const createRoom = new nftRoomCollection({
                roomNumber: req.body.roomNumber,
                roomName: req.body.roomName
            });
            let findExistingRoom = await nftRoomCollection.findOne({ roomNumber: createRoom.roomNumber });
            let findtheLatestroom = await nftRoomCollection.findOne({}, {}, { sort: { 'Date': -1 } });

            if (findExistingRoom != null) {
                res.status(400).send({ message: "The room already exists" });
            }

            else {
                let endRoomCounter = 100;
                if (findtheLatestroom == null) {
                    createRoom.save();
                    res.status(200).send({ message: "room created successfully" });
                }
                if (findtheLatestroom.roomNumber + 1 == createRoom.roomNumber) {
                    createRoom.save();
                    res.status(200).send({ message: "room created successfully" });
                }
                else if (createRoom.roomNumber > endRoomCounter) {
                    res.status(400).send({ message: "Exceeded the room limit" });
                }
                else {
                    res.status(400).send({ message: "not a valid room number" });
                }
            }
        }
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const showRooms = async (req, res) => {
    try {
        let getAllRooms = await nftRoomCollection.find();
        res.status(200).send(getAllRooms);
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

const getAllRooms = async (req, res) => {
    try {
        let findRooms = await nftRoomCollection.find({}, { _id: 0, Date: 0 });
        res.send(findRooms);
    }
    catch (err) {
        res.send(err, "Something went wrong")
    }
}

const getUserCart = async (req, res) => {
    try {
        let userId = req.body.id
        console.log(req.body.id, "current user id");
        let cartItems = await cart.find({ userId: userId });
        console.log(cartItems, "currnet user cart");
        let userCartDetails = []
        for (let singleUserInfo of cartItems) {
            let findNFTData = []
            findNFTData = await nftvrCollection.findOne({ tokenId: singleUserInfo.tokenId }, { roomId: 0 });
            console.log(findNFTData, "iy findNFTData");
            let cartItemDetails = {
                cartItem: singleUserInfo,
                nftDetails: findNFTData
            }
            userCartDetails.push(cartItemDetails)
        }
        res.status(200).send({ result: userCartDetails });
    }
    catch (err) {
        res.status(400).send(err, "Something went wrong");
    }
}

const saveMintData = async (req, res) => {
    try {
        let successfulOrNot = await nftvrCollection.updateOne({ tokenHash: req.body.nftHash }, { tokenId: req.body.tokenId, nftCurrentPrice: req.body.nftPrice });
        if (successfulOrNot) {
            res.status(200).send("data stored");
        }
        else {
            res.status(400).send("Something went wrong", err);
        }
    }
    catch (err) {
        res.status(400).send("Something went wrong", err);
    }
}

module.exports = {
    registerUser,
    loginUser,
    uploadNft,
    mintNft,
    addRoomIdToTokenId,
    getNftDetails,
    addToCart,
    transferOwnership,
    updateNFTPrice,
    setApprovalForAlltoken,
    showAllUserNFTs,
    showAllNFTs,
    showNFTsToBeMinted,
    getNftOwner,
    createNewRoom,
    showRooms,
    getAllRooms,
    getUserCart,
    saveMintData
};