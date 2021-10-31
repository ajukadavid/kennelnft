import { Injectable } from "@angular/core";
import { Web3ModalService } from "@mindsorg/web3modal-angular";
import Web3 from "web3";
import * as _ from "lodash";
import { NETWORKS, DEFAULTNETWORK } from "./constants";
import { Observable, ReplaySubject, Subject } from "rxjs";
import fighter from "../assets/abi/fighter.json";
import trainer from "../assets/abi/training.json";
import token from "../assets/abi/token.json";
import { NotifyService } from "./notify.service";


@Injectable({
    providedIn: "root"
})
export class CryptoWalletService {

    private updated: ReplaySubject<any> = new ReplaySubject(1);
    public updated$: Observable<any> = this.updated.asObservable();

    private transactionStatus: Subject<any> = new Subject();
    public transactionStatus$: Observable<any> = this.transactionStatus.asObservable();

    public walletInfo: {
        wallet: string,
        network: string,
        isConnected: boolean,
    };

    private provider;
    private web3;

    public registration: {
        username: string,
        path: string,
    }

    constructor(
        private notifierService: NotifyService,
        private web3modalService: Web3ModalService) { }

    private async getWalletInfo(web3, account, login) {
        const walletInfo = _.cloneDeep(this.walletInfo);
        if (account && walletInfo) {
            walletInfo.wallet = account;
        }
        //    await this.getNFTInfo(web3, walletInfo);
        this.walletInfo = walletInfo ? _.cloneDeep(walletInfo) : this.walletInfo;
        this.updated.next(this.walletInfo);
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
            isConnected: false
        };
        this.notifierService.pop("success", "Account " + account + " disconnected", "Account info");
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
            this.walletInfo.isConnected = networkId === DEFAULTNETWORK;
            this.getWalletInfo(this.web3, this.walletInfo.wallet, false);
        });
        const networkId = await this.web3.eth.getChainId();
        const walletInfo = {} as any;
        walletInfo.isConnected = networkId === DEFAULTNETWORK;

        if (accounts && accounts.length > 0) {
            walletInfo.network = NETWORKS[networkId] ? NETWORKS[networkId] : `${networkId} network`;
            walletInfo.wallet = accounts[0].toLowerCase();
            this.walletInfo = walletInfo;
            await this.getWalletInfo(this.web3, walletInfo.wallet, true);
            this.notifierService.pop("success", "Account " + walletInfo.wallet + " connected to " + this.walletInfo.network, "Account info");
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

    public async createFighter(address): Promise<any> {
        const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
        const trainerAddress = await contractFighter.methods.trainerContract().call();
        const contractTrainer = new this.web3.eth.Contract(trainer.output.abi, trainerAddress);
        try {
            // call transfer function
            return ((toaster, trans) => new Promise((resolve, reject) => {
                contractTrainer.methods.recruit().send({ from: this.walletInfo.wallet })
                    .once("transactionHash", function (hash) {
                        resolve({ result: true, data: hash });
                    })
                    .then(function (receipt) {
                        toaster.pop("success", "Your transaction is confirmed", "Transaction info");
                        trans.next({ status: "Fighter completed", data: receipt });
                    });
            }))(this.notifierService, this.transactionStatus);
        }
        catch (err) {
            console.log("err", err);
        }
    }

    public async revealFighter(tokenId, address, hash): Promise<any> {
        const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
        const trainerAddress = await contractFighter.methods.trainerContract().call();
        console.log("trainerAddress", trainerAddress);
        const contractTrainer = new this.web3.eth.Contract(trainer.output.abi, trainerAddress);
        console.log("contractTrainer", contractTrainer);
        try {
            return ((toaster, trans) => new Promise((resolve, reject) => {
                contractTrainer.methods.revealFighter(tokenId, hash).send({ from: this.walletInfo.wallet })
                    .once("transactionHash", function (hash) {
                        resolve({ result: true, data: hash });
                    })
                    .then(function (receipt) {
                        toaster.pop("success", "Your transaction is confirmed", "Transaction info");
                        trans.next({ status: "Reveal completed", data: tokenId });
                    });
            }))(this.notifierService, this.transactionStatus);
        }
        catch (err) {
            console.log("err", err);
            return Promise.resolve({ result: false });
        }
    }

    public async checkAllowed(address): Promise<boolean> {
        if (this.walletInfo.wallet) {
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const trainerAddress = await contractFighter.methods.trainerContract().call();
            const contractTrainer = new this.web3.eth.Contract(trainer.output.abi, trainerAddress);
            const tokenAddress = await contractTrainer.methods.tokenAddress().call();

            if (tokenAddress) {
                const contractToken = new this.web3.eth.Contract(token.abi, tokenAddress);
                const allow = await contractToken.methods.allowance(this.walletInfo.wallet, trainerAddress).call();
                console.log("allow", allow);
                return true;
            }
        }
        return false;
    }

    public async approve(address): Promise<any> {
        const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
        const trainerAddress = await contractFighter.methods.trainerContract().call();
        const contractTrainer = new this.web3.eth.Contract(trainer.output.abi, trainerAddress);
        const tokenAddress = await contractTrainer.methods.tokenAddress().call();
        if (tokenAddress) {
            const contractToken = new this.web3.eth.Contract(token.abi, tokenAddress);
            try {
                return ((toaster, trans) => new Promise((resolve, reject) => {
                    contractToken.methods.approve(trainerAddress, "99999999999999999999999999999999999999999999999999999890000000000000000000000").send({
                        from: this.walletInfo.wallet
                    })
                        .once("transactionHash", function (hash) {
                            resolve({ result: true, data: hash });
                        })
                        .then(function (receipt) {
                            toaster.pop("success", "Your transaction is confirmed", "Transaction info");
                            trans.next({ status: "Approve completed", data: receipt });
                        });
                }))(this.notifierService, this.transactionStatus);
            }
            catch (err) {
                console.log("err", err);
                return Promise.resolve({ result: false });
            }
        }
    }

}
