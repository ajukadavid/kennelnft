import { Injectable } from "@angular/core";
import Web3 from "web3";
import * as _ from "lodash";
import { KENNELADDRESS, KOMBATADDRESS, WEB3URL } from "./constants";
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

    private teamsData = {};

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

    public async getFightInfo(): Promise<{ fightSymbol: string; fightPrice: number }> {
        const contractKombat = new this.web3.eth.Contract(kombat.output.abi, KOMBATADDRESS);
        let fightPrice = await contractKombat.methods.fightPrice().call();
        const contractToken = new this.web3.eth.Contract(token.abi, KENNELADDRESS);
        const decimals = await contractToken.methods.decimals().call();
        const fightSymbol = await contractToken.methods.symbol().call();
        const fightPr = fightPrice / (10 ** decimals);
        return { fightSymbol, fightPrice: fightPr };
    }

    public async getSquadInfo(address): Promise<{ address: string; name: string; symbol: string; fightSymbol: string; fightPrice: number; recruitPrice: number; tokenSymbol: string }> {
        let teamsInfo = { address: "", name: "", symbol: "", fightSymbol: "", fightPrice: 0, recruitPrice: 0, tokenSymbol: "" };
        try {
            if (this.teamsData[address]) {
                console.log("this.teamsData[address]", this.teamsData[address]);
                return this.teamsData[address];
            }
            this.initWeb3();

            const fightInfo = await this.getFightInfo();
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
            teamsInfo = { address, name, symbol, fightPrice: fightInfo.fightPrice, fightSymbol: fightInfo.fightSymbol, recruitPrice: price, tokenSymbol };
            this.teamsData[address] = teamsInfo;
            return teamsInfo;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
        return teamsInfo;
    }

    public async getPrices(address): Promise<{ address: string; armorPrice: number; lvlUpPrice: number; trainingPrice: number; tokenSymbol: string; fightSymbol: string; fightPrice: number }> {
        let teamsInfo = { address: "", armorPrice: 0, trainingPrice: 0, lvlUpPrice: 0, tokenSymbol: "", fightSymbol: "", fightPrice: 0 };
        try {
            this.initWeb3();
            const fightInfo = await this.getFightInfo();
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const trainerAddress = await contractFighter.methods.trainerContract().call();
            const contractTrainer = new this.web3.eth.Contract(trainer.output.abi, trainerAddress);
            const armorPrice = await contractTrainer.methods.armorPrice().call();
            const trainingPrice = await contractTrainer.methods.trainingPrice().call();
            const levelUpPrice = await contractTrainer.methods.levelUpPrice().call();
            let price = 0;
            let trainPrice = 0;
            let lvlUpPrice = 0;
            let tokenSymbol = "";
            const tokenAddress = await contractTrainer.methods.tokenAddress().call();
            if (tokenAddress) {
                const contractToken = new this.web3.eth.Contract(token.abi, tokenAddress);
                const decimals = await contractToken.methods.decimals().call();
                tokenSymbol = await contractToken.methods.symbol().call();
                price = armorPrice / (10 ** decimals);
                trainPrice = trainingPrice / (10 ** decimals);
                lvlUpPrice = levelUpPrice / (10 ** decimals);
            }
            teamsInfo = { address, armorPrice: price, trainingPrice: trainPrice, lvlUpPrice, tokenSymbol, ...fightInfo };
            return teamsInfo;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Fighters contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
        return teamsInfo;

    }

    public async getFightersInfo(address, numFighters = 10, lastFighter?, startFighter?): Promise<any> {
        try {
            this.initWeb3();
            // get teams
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            let start = startFighter;
            console.log("address", address);
            if (!startFighter) {
                let fighters = await contractFighter.methods.totalSupply().call();
                console.log("start", fighters);

                this.dataStream.next({ type: "team", fighters });
                start = fighters;
            }
            let end = lastFighter ? lastFighter : (start - numFighters);
            end = (end < 0) ? 0 : end;
            let promises = [];
            console.log("start", start);
            console.log("end", end);
            for (let fighter = (start - 1); fighter >= end; fighter--) {
                promises.push(this.getFighterBasicInfo(address, fighter));
            }
            const results = await Promise.all(promises);
            return { result: "ok" };
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
            return { result: "error" };
        }
    }

    public async getOpponents(address, tokenId): Promise<any[]> {
        try {
            const results = [];
            this.initWeb3();
            const contractKombat = new this.web3.eth.Contract(kombat.output.abi, KOMBATADDRESS);
            let teams = await contractKombat.methods.allTeams().call();
            console.log(teams);
            for (const team of teams) {
                const contractFighter = new this.web3.eth.Contract(fighter.output.abi, team);
                const metadata = await contractFighter.methods.tokenURI(0).call();
                const base64 = metadata.split(",")[1];
                const json = JSON.parse(Buffer.from(base64, 'base64').toString('ascii').replace("\"attributes\":\"", "\"attributes\":").replace("]\", \"image", "], \"image"));
                results.push({ address: team, id: 1, metadata: json, result: 1, blockNumber: 1 });
            }
            return results;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
            return [];
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
            const upgradable = await contractFighter.methods.upgradable(tokenId).call();
            console.log("metadata", address, tokenId, metadata);
            const base64 = metadata.split(",")[1];
            console.log("base64", base64);
            console.log("info", Buffer.from(base64, 'base64').toString('ascii'));
            const json = JSON.parse(Buffer.from(base64, 'base64').toString('ascii').replace("\"attributes\":\"", "\"attributes\":").replace("]\", \"image", "], \"image"));
            const ownerOf = await contractFighter.methods.ownerOf(tokenId).call();
            teamContent = { address, token: tokenId, ownerOf, imageUploaded, metadata: json, upgradable };

            this.dataStream.next({ type: "fighter", fighter: teamContent });
            console.log("data", tokenId);
            return teamContent;
        } catch (ex) {
            this.notifierService.pop("error", "We can't check Kombat contract, try again later", "Contract connect");
            // not connected
            console.log(ex);
        }
        return {};
    }

}
