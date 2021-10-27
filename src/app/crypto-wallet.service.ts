import { Injectable } from "@angular/core";
import { Web3ModalService } from "@mindsorg/web3modal-angular";
import Web3 from "web3";
import * as _ from "lodash";
import { ToastrService } from "ngx-toastr";
import { ADDRESS, ADDRESSABI, NETWORKS } from "./constants";
import { Observable, Subject } from "rxjs";
import fighter from "../assets/abi/fighter.json";

@Injectable({
    providedIn: "root"
})
export class CryptoWalletService {

    private updated: Subject<any> = new Subject();
    public updated$: Observable<any> = this.updated.asObservable();

    private transactionStatus: Subject<any> = new Subject();
    public transactionStatus$: Observable<any> = this.transactionStatus.asObservable();    

    public walletInfo: {
        wallet: string,
        network: string,
    };

    private provider;
    private web3;

    public registration: {
        username: string,
        path: string,
    }

    constructor(
        private toastr: ToastrService,
        private web3modalService: Web3ModalService) { }

    private async getWalletInfo(web3, account, login) {
        const walletInfo = _.cloneDeep(this.walletInfo);
        if (account) {
            walletInfo.wallet = account;
        }
        //    await this.getNFTInfo(web3, walletInfo);
        this.walletInfo = _.cloneDeep(walletInfo);
        this.updated.next(this.walletInfo);
    }

    private async getNFTInfo(web3: any, walletInfo: any) {
        try {
            //    const contract = new web3.eth.Contract(ADDRESSABI, ADDRESS);

            // let balance = await contract.methods.balanceOf(walletInfo.wallet, GOLDEN).call();
            // // read NFT
            // if (balance > 0) {
            //     walletInfo.isGolden = GOLDEN;
            // }
            // for (let silver of SILVERS) {
            //     console.log("silver",walletInfo.wallet );
            //     balance = await contract.methods.balanceOf(walletInfo.wallet, silver).call();
            //     console.log("silver",walletInfo.wallet, balance );
            //     if (balance > 0) {
            //         walletInfo.silvers.push(silver);
            //     }
            // }
        } catch (ex) {
            this.toastr.error("We can't check nft hodling. Pls check that you are connected to MATIC network. Or ty reload page", "NFT check problem");
            // not connected
            console.log(ex);
        }
        this.walletInfo = walletInfo;
    }

    public async disconnectWallet() {
        if (this.provider?.disconnect) {
            this.provider.disconnect();
        }
        this.provider = undefined;
        this.web3 = undefined;
        const account = this.walletInfo.wallet;
        this.walletInfo = {
            wallet: undefined,
            network: undefined,
        };
        this.toastr.success("Account " + account + " disconnected", "Wallet disconnected");
    }

    private async getConnection(accounts) {
        // Subscribe to account change
        this.provider.on("accountsChanged", (accounts: string[]) => {
            this.getWalletInfo(this.web3, accounts[0], true);
        });

        // Subscribe to chainId change
        this.provider.on("chainChanged", (chainId: string) => {
            const networkId = parseInt(chainId, 16);
            this.walletInfo = this.walletInfo ? this.walletInfo : {} as any;
            this.walletInfo.network = NETWORKS[networkId] ? NETWORKS[networkId] : `${networkId} network`;
            this.getWalletInfo(this.web3, this.walletInfo.wallet, false);
        });
        const networkId = await this.web3.eth.getChainId();
        const walletInfo = {} as any;
        console.log("accounts", accounts);
        if (accounts && accounts.length > 0) {
            walletInfo.network = NETWORKS[networkId] ? NETWORKS[networkId] : `${networkId} network`;
            walletInfo.wallet = accounts[0].toLowerCase();
            this.walletInfo = walletInfo;
            await this.getWalletInfo(this.web3, walletInfo.wallet, true);
            this.toastr.success("Account " + walletInfo.wallet + " at " + this.walletInfo.network, "Wallet connected");
        }
    }

    public async checkConnection() {
        try {
            if (window["ethereum"]) {
                this.web3 = new Web3(window["ethereum"]);
            } else if (window["web3"]) {
                this.web3 = new Web3(window["web3"].currentProvider);
            }

            if (this.web3) {
                this.provider = this.web3.currentProvider;
                this.web3.eth.defaultCommon = { customChain: { chainId: 137, networkId: 137 }, baseChain: "mainnet" };
                const accounts = await this.web3.eth.getAccounts();
                await this.getConnection(accounts);
            }
        } catch (exA) {
            // not connected
            console.log(exA);
        }
    }

    public async connectWallet() {
        try {
            this.provider = await this.web3modalService.open();
            this.web3 = new Web3(this.provider as any);
            this.web3.eth.defaultCommon = { customChain: { chainId: 137, networkId: 137 }, baseChain: "mainnet" };
            const accounts = await this.web3.eth.getAccounts();
            if (accounts) {
                await this.getConnection(accounts);
            }
        } catch (exA) {
            // not connected
            console.log(exA);
        }
    }

    public async signMessage(message) {
        const hash = this.web3.utils.sha3(message);
        const signature = await this.web3.eth.personal.sign(hash, this.walletInfo.wallet);
        return signature;
    }

    public async createFighter(address): Promise<any> {
        const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
        try {
            // call transfer function
            return ((toaster, trans) => new Promise((resolve, reject) => {
                contractFighter.methods.createFighter().send({ from: this.walletInfo.wallet })
                    .once("transactionHash", function (hash) {
                        resolve({ result: true, data: hash });
                    })
                    // .once("receipt", function (receipt) { console.log("receipt", receipt); })
                    // .on("confirmation", function (confNumber, receipt, latestBlockHash) { console.log("confirmation", confNumber, receipt, latestBlockHash); })
                    // .on("error", function (error) { console.error("error", error); })
                    .then(function (receipt) {
                        toaster.success("Your transaction is confirmed", "Payment transaction");
                        trans.next({status: "completed", data: receipt});
                        // will be fired once the receipt is mined
                        // console.log("minted receipt", receipt);
                        // return resolve({result: true, tx: receipt});
                    });
            }))(this.toastr, this.transactionStatus);
        }
        catch (err) {
            console.log("err", err);
        }
    }
}
