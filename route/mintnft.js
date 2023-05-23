const express = require('express');
const router = express();
const fs = require('fs')
const FormData = require('form-data');
const multer = require('multer');
const pinataEndpoint = process.env.PINATA_ENDPOINT;
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const form_data = new FormData();
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

const { registerUser,
  loginUser,
  uploadNft,
  mintNft,
  addRoomIdToTokenId,
  getNftDetails,
  addToCart,
  transferOwnership,
  updateNFTPrice,
  showAllNFTs,
  setApprovalForAlltoken,
  getNftOwner,
  showAllUserNFTs,
  showNFTsToBeMinted,
  createNewRoom,
  getAllRooms,
  getUserCart,
  saveMintData } = require("../controller/nftcontroller");

require("dotenv").config()
require("../models/nftvr");
require("../models/user");

let verifyToken = require('../middlewares/authJWT')

router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept,Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
  next();
})

const imgfolderName = 'uploads'
if (!fs.existsSync(imgfolderName)) {
  fs.mkdirSync(imgfolderName);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname)
  }
});

const upload = multer({ storage: storage });

/**
 * @swagger
*   components:
*       schemas :
*           user:
*                type: object
*                properties:
*                    userName:
*                        type: string
*                        example: john
*                    password:
*                        type: string
*                        example: john123
*/

/**
 * @swagger
*   components:
*       schemas :
*           nftvr:
*                type: object
*                properties:
*                    roomId:
*                        type: integer
*                        example: 1
*                    tokenId:
*                        type: integer
*                        example: 12
*                    tokenHash:
*                        type: string
*                        example: QmR7SJzdbVrG1RdTDqiCBjXoG7HWrgs3N877sC1H5nmJus
*                    nftName:
*                        type: string
*                        example: Resolution
*                    nftDescritption:
*                        type: string
*                        example: Strive for a change
*                    nftImage:
*                        type: string
*                        example: https://gateway.pinata.cloud/ipfs/QmWymiBpMUA3DAM6bha9fbbj6FmF2RCRTjG2rq43e54m27       
*                    nftCurrentPrice:
*                        type: string
*                        example: 0.1
*/

/**
 * @swagger
*   components:
*       schemas :
*           Cart:
*                type: object
*                properties:
*                    userId:
*                        type: string
*                        example: 76df750b-5a49-415c-acbf-08e39c468a0a
*                    tokenId:
*                        type: integer
*                        example: 12
*/

/**
 * @swagger
*   components:
*       schemas :
*           nftPrice:
*                type: object
*                properties:
*                    seller:
*                        type: string
*                        example: "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
*                    buyer:
*                        type: string
*                        example: "70997970C51812dc3A010C7d01b50e0d17dc79C8"           
*                    tokenId:
*                        type: number
*                        example: 1
*                    nftPrice:
*                        type: integer
*                        example: 0.5
*                    Date:
*                        type: Date
*                        example: 2022-09-26T11:52:22.284+00:00
*/

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Accepts username and password for registraion process.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 description: The user's name.
 *                 example: jessi
 *               password:
 *                  type: string
 *                  description: accepts user's password
 *                  example: jessi123
 *     responses:
 *       201:    
 *        description: Success
*/

router.post('/register', registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Accepts username and password for logging in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 description: The user's name.
 *                 example: jessi
 *               password:
 *                  type: string
 *                  description: accepts user's password
 *                  example: jessi123
 *     responses:
 *       201:    
 *        description: Success
*/

router.post("/login", loginUser);

/**
 * @swagger
 * /uploadNft:
 *   post:
 *     summary: Accepts media file to pin to IPFS, media name and description.
 *     securityDefinitions:  
 *         type: apiKey  
 *         in: header   
 *         name: authorization
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               img:
 *                 type: string
 *                 format: base64
 *               imgname:
 *                 type: string
 *                 description: NFT Name
 *                 example: Resolution
 *               imgdescription:
 *                  type: string
 *                  description: NFT Description
 *                  example: Strive for a better future
 *     responses:
 *       201:    
 *        description: Success
*/

router.post('/uploadNft', upload.single('img'), verifyToken, uploadNft);

/**
 * @swagger
 * /mintNft:
 *   post:
 *     summary: Accepts IPFS hash to mint an NFT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nfthash:
 *                 type: string
 *                 description: IPFS hash of the media
 *                 example: QmR7SJzdbVrG1RdTDqiCBjXoG7HWrgs3N877sC1H5nmJus
 *               nftPrice:
 *                 type: string
 *                 description: NFT Price
 *                 example: 0.1
 *     responses:
 *       201:    
 *        description: Success
*/

router.post('/mintNft', verifyToken, mintNft);

/**
 * @swagger
 * /addRoomIdToTokenId:
 *   post:
 *     summary: Adds an NFT in a room.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                roomId:
 *                  type: string
 *                  description: Room Number for an NFT
 *                  example: 1
 *                tokenId:
 *                  type: string
 *                  description: NFT token ID
 *                  example: 12                
 *     responses:
 *       201:    
 *        description: Success
*/

router.post("/addRoomIdToTokenId", verifyToken, addRoomIdToTokenId);

/**
 * @swagger
 * /addToCart:
 *   post:
 *     summary: Enters an NFT into user's cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                  type: string
 *                  description: accepts an NFT ID
 *                  example: 12
 *     responses:
 *       201:    
 *        description: Success      
*/

router.post("/addToCart", verifyToken, addToCart);

/**
 * @swagger
 * /transferOwnership:
 *   post:
 *     summary: Transfer ownership of an NFT from one user to another.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                currentOwnerAddress:
 *                  type: string
 *                  description: wallet address of the current NFT owner
 *                  example: "0x13cb710bbb380f85f0572359e0c1ec92756c5d01"
 *                newOwnerAddress:
 *                  type: string
 *                  description: wallet address of the new owner
 *                  example: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
 *                nftId:
 *                  type: string
 *                  description: Enter NFT ID
 *                  example: 12
 *     responses:
 *       201:    
 *        description: Success
*/

router.post("/transferOwnership", verifyToken, transferOwnership);

/**
 * @swagger
 * /updateNFTPrice:
 *   post:
 *     summary: Allows Owner of the NFT to set Price
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                address:
 *                  type: string
 *                  description: Wallet address of the NFT's owner
 *                  example: 70997970C51812dc3A010C7d01b50e0d17dc79C8
 *                tokenId:
 *                  type: string
 *                  description: enter token Id to of the nft to set price 
 *                  example: 1
 *                price:
 *                  type: number
 *                  description: Price of the nft
 *                  example: 0.1
 *     responses:
 *       201:    
 *        description: Success
*/

router.post("/updateNFTPrice", verifyToken, updateNFTPrice);

/**
 * @swagger
 * /getNftDetails/{roomId}:
 *   get:
 *     summary: Shows all the NFTs present in a room.
 *     parameters:
 *       - in: path
 *         name: roomId
 *         description: Enter room id.
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/getNftDetails/:roomid", verifyToken, getNftDetails)

/**
 * @swagger
 * /showAllNFTs:
 *   get:
 *     summary: Shows NFT cards
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/showAllNFTs", verifyToken, showAllNFTs);

router.post("/getNftOwner", getNftOwner);

/**
 * @swagger
 * /setApprovalForAlltoken:
 *   get:
 *     summary: Approves NFTs
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/setApprovalForAlltoken", verifyToken, setApprovalForAlltoken);

/**
 * @swagger
 * /show/nft/toMint:
 *   get:
 *     summary: Shows All the NFTs which are not minted
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/show/nft/toMint", verifyToken, showNFTsToBeMinted);

/**
 * @swagger
 * /show/nft/userNFT:
 *   get:
 *     summary: Shows All the Minted and Uploaded NFTs of the current user
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/show/nft/userNFT", verifyToken, showAllUserNFTs);

/**
 * @swagger
 * /createNewRoom:
 *   post:
 *     summary: Create a room for NFTs. Only Admin is allowed this operation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                roomNumber:
 *                  type: number
 *                  description: The room number of a room
 *                  example: "1"
 *                roomName:
 *                  type: string
 *                  description: Room Name 
 *                  example: "Cars"
 *     responses:
 *       201:    
 *        description: Success
*/

router.post("/createNewRoom", verifyToken, createNewRoom);

/**
 * @swagger
 * /getAllRooms:
 *   get:
 *     summary: Shows All the Room created by the admin
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/getAllRooms", getAllRooms);

/**
 * @swagger
 * /getUserCart:
 *   get:
 *     summary: Shows All the NFTs inside of a user cart
 *     responses:
 *        201:    
 *          description: Success
*/

router.get("/getUserCart", verifyToken, getUserCart);

router.post("/saveMintData", verifyToken, saveMintData);

module.exports = router;