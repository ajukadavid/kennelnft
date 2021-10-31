import { Injectable } from "@angular/core";
import Web3 from "web3";
import * as _ from "lodash";
import { KOMBATADDRESS, WEB3URL } from "./constants";
import fighter from "../assets/abi/fighter.json";
import kombat from "../assets/abi/kombat.json";
import trainer from "../assets/abi/training.json";
import token from "../assets/abi/token.json";

import { Observable, Subject } from "rxjs";
import { NotifyService } from "./notify.service";

@Injectable({
    providedIn: "root"
})
export class NftContractsService {

    private provider;
    private web3;

    private dataStream: Subject<any> = new Subject();
    public dataStream$: Observable<any> = this.dataStream.asObservable();

    constructor(
        private notifierService: NotifyService
    ) { }

    private initWeb3(): any {
        if (!this.web3) {
            this.web3 = new Web3(WEB3URL);
        }
    }

    public async getKombatInfo(): Promise<{ address: string; squad: string; symbol: string }[]> {
        try {
            this.initWeb3();
            const teamsInfo = [];

            // get teams
            const contractKombat = new this.web3.eth.Contract(kombat.output.abi, KOMBATADDRESS);

            let teams = await contractKombat.methods.allTeams().call();
            console.log(teams);
            for (const team of teams) {
                const contractFighter = new this.web3.eth.Contract(fighter.output.abi, team);
                const name = await contractFighter.methods.name().call();
                const symbol = await contractFighter.methods.symbol().call();
                teamsInfo.push({ address: team, squad: name, symbol });
            }
            // get fighters info
            console.log(teamsInfo);
            return teamsInfo;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
        return [];
    }

    public async getSquadInfo(address): Promise<{ address: string; name: string; symbol: string; recruitPrice: number; tokenSymbol: string }> {
        let teamsInfo = { address: "", name: "", symbol: "", recruitPrice: 0, tokenSymbol: "" };
        try {
            this.initWeb3();
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const trainerAddress = await contractFighter.methods.trainerContract().call();
            console.log("trainerAddress", trainerAddress);
            const contractTrainer = new this.web3.eth.Contract(trainer.output.abi, trainerAddress);            
            const name = await contractFighter.methods.name().call();
            const symbol = await contractFighter.methods.symbol().call();
            const recruitPrice = await contractTrainer.methods.recruitPrice().call();
            let price = 0;
            let tokenSymbol = "";
            const tokenAddress = await contractTrainer.methods.tokenAddress().call();
            if (tokenAddress) {
                const contractToken = new this.web3.eth.Contract(token.abi, tokenAddress);  
                const decimals = await contractToken.methods.decimals().call();
                tokenSymbol = await contractToken.methods.symbol().call();
                price = recruitPrice / (10 ** decimals);
            }          
            teamsInfo = { address, name, symbol, recruitPrice: price, tokenSymbol };
            return teamsInfo;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
        return teamsInfo;
    }

    public async getFightersInfo(address, lastFighter = 0) {
        try {
            this.initWeb3();
            // get teams
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            let fighters = await contractFighter.methods.tokenCounter().call();
            //      this.dataStream.next({ type: "fighters", fighters }); TODO preload images...

            for (let fighter = lastFighter; fighter < fighters; fighter++) {
                this.getFighterBasicInfo(address, fighter);
            }
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
    }


    public async getFighterBasicInfo(address, tokenId): Promise<any> {
        try {
            this.initWeb3();
            let teamContent;

            // get fighter
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const metadata = await contractFighter.methods.tokenURI(tokenId).call();
            const imageUploaded = await contractFighter.methods.tokenToImageUpdated(tokenId).call();
            console.log("metadata", address, tokenId, metadata);
            const base64 = metadata.split(",")[1];
            console.log("base64", base64);
            console.log("info", Buffer.from(base64, 'base64').toString('ascii'));
            const json = JSON.parse(Buffer.from(base64, 'base64').toString('ascii').replace("\"attributes\":\"", "\"attributes\":").replace("]\", \"image", "], \"image"));
            const ownerOf = await contractFighter.methods.ownerOf(tokenId).call();
            teamContent = { token: tokenId, ownerOf, imageUploaded, metadata: json };

            this.dataStream.next({ type: "fighter", fighter: teamContent })
            return teamContent;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
        return {};
    }

}
