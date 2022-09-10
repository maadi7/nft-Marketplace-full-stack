const {assert, expect} = require("chai");
const {network, deployments, ethers, getNamedAccounts} = require("hardhat");
const {developmentChains} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip 
    : describe('Nft Marketplace Tests', function() {
       let nftMarketplace, basicNft, deployer, player
       const PRICE = ethers.utils.parseEther("0.1");
       const TOKEN_ID = 0;
       beforeEach( async () =>{
        deployer = (await getNamedAccounts()).deployer;
        const accounts = await ethers.getSigners();
        player = accounts[1];
        await deployments.fixture(["all"]);
        nftMarketplace = await ethers.getContract("NftMarketplace");
        basicNft = await ethers.getContract("BasicNft");
        await basicNft.mintNft();
        await basicNft.approve(nftMarketplace.address, TOKEN_ID);
       });
       it("lists and can be bought", async function () {
        await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
        const playerConnectedNftMarketplace = nftMarketplace.connect(player);
        await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {value: PRICE});
        const newOwner = await basicNft.ownerOf(TOKEN_ID);
        const deployerProceeds = await nftMarketplace.getProceeds(deployer);
        assert(newOwner.toString() == player.address);
        assert(deployerProceeds.toString() == PRICE.toString());
       });

       describe('list item', () => {
        it("list item should revert if price is set to zero or less", async function(){
           await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
          
           });
        it("should emit when listed", async ()=>{
            expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit("ItemListed");
        });
        it("mapping should be updated after listing",async ()=>{
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
            const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
            const newOwner = await basicNft.ownerOf(TOKEN_ID);
             assert(listing.price.toString() == PRICE.toString());
             assert(listing.seller.toString() == newOwner.toString());
        });        
       });

       describe('buy Item', () => {
        it("should revert if item is not listed", async()=>{
            await expect(nftMarketplace.buyItem(basicNft.address, 2, {value: PRICE})).to.be.revertedWith("NftMarketplace__NotListed");
        })
         beforeEach(async ()=>{
            await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
         });
         it("should emit event if buying is successful", async()=>{
            expect(await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {value: PRICE})).to.emit("ItemBought");
         })
         it("revert if not same amount is transfered", async ()=>{
            await expect(nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {value: 0})).to.be.revertedWith("NftMarketplace__PriceNotMet");
         });
         it("proceeds of seller shoud be increased", async ()=>{
            const playerConnectedNftMarketplace = nftMarketplace.connect(player);
            await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {value: PRICE});
            const newOwner = await basicNft.ownerOf(TOKEN_ID);
            const deployerProceeds = await nftMarketplace.getProceeds(deployer);
            assert(newOwner.toString() == player.address);
            assert(deployerProceeds.toString() == PRICE.toString());
         });
       });

       describe('cancel listing', () => {
         it("should revert if item is not listed", async ()=>{
            await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.be.revertedWith("NftMarketplace__NotListed");
         });
        
         
       })
       
       

     
     })
     